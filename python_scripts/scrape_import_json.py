import argparse
import io
import json
import re
import sys
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup


# Force UTF-8 output so Laravel/JS can parse reliably
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


def _read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def _clean_text(value: str) -> str:
    return " ".join((value or "").replace("\xa0", " ").split()).strip()


def _abs_url(url: str) -> str:
    url = (url or "").strip()
    if url.startswith("//"):
        return "https:" + url
    return url


def _parse_price_to_float(price_text: str) -> Optional[float]:
    """Parse strings like '4,99€' or '1.234,56 €' into float."""
    if not price_text:
        return None

    text = _clean_text(price_text)
    # Keep digits, separators and minus
    text = re.sub(r"[^0-9,\.\-]", "", text)
    if not text:
        return None

    # If both '.' and ',' exist, assume '.' thousands and ',' decimal (EU)
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    else:
        # If only ',' exists, treat as decimal
        if "," in text and "." not in text:
            text = text.replace(",", ".")

    try:
        return float(text)
    except ValueError:
        return None


def _unique_keep_order(items: List[str]) -> List[str]:
    seen = set()
    out: List[str] = []
    for it in items:
        it = (it or "").strip()
        if not it:
            continue
        if it in seen:
            continue
        seen.add(it)
        out.append(it)
    return out


def _extract_from_cards(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    products: List[Dict[str, Any]] = []

    for card in soup.select(".card"):
        title = _clean_text((card.select_one(".titulo") or {}).get_text() if card.select_one(".titulo") else "")
        price_text = _clean_text((card.select_one(".precio") or {}).get_text() if card.select_one(".precio") else "")
        price = _parse_price_to_float(price_text)

        img = card.select_one("img.thumb")
        image_url = _abs_url(img.get("src")) if img and img.get("src") else ""

        link_el = card.select_one(".url-prod a")
        link = link_el.get("href") if link_el and link_el.get("href") else ""

        gallery_imgs = [
            _abs_url(img.get("src"))
            for img in card.select(".galeria img")
            if img.get("src")
        ]

        images = _unique_keep_order([image_url] + gallery_imgs)
        if not image_url and images:
            image_url = images[0]

        if not title or price is None or not image_url:
            continue

        products.append(
            {
                "title": title,
                "price": price,
                "image_url": image_url,
                "images": images,
                # Optional fields supported by importer
                "seo_title": None,
                "seo_description": None,
                # extra info (ignored by importer but helpful for debugging)
                "product_url": link or None,
            }
        )

    return products


def _extract_aliexpress_listing(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    products: List[Dict[str, Any]] = []

    for a in soup.select("a.productContainer"):
        title_el = a.select_one(".AIC-TA-multi-icon-title")
        price_el = a.select_one(".AIC4-PI-price-text")
        img_el = a.select_one(".AIC-MI-container img.AIC-MI-img")

        title = _clean_text(title_el.get_text() if title_el else "")
        price = _parse_price_to_float(price_el.get_text() if price_el else "")
        image_url = _abs_url(img_el.get("src")) if img_el and img_el.get("src") else ""
        href = a.get("href") or ""

        images = _unique_keep_order([image_url])

        if not title or price is None or not image_url:
            continue

        products.append(
            {
                "title": title,
                "price": price,
                "image_url": image_url,
                "images": images,
                "seo_title": None,
                "seo_description": None,
                "product_url": _abs_url(href) or None,
            }
        )

    return products


def _extract_fallback(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Very loose fallback: find item links and nearby data."""
    products: List[Dict[str, Any]] = []

    for a in soup.find_all("a", href=True):
        href = a.get("href") or ""
        if "/item/" not in href:
            continue

        # Try to get an image inside the anchor or nearby
        img = a.find("img")
        image_url = _abs_url(img.get("src")) if img and img.get("src") else ""

        title = _clean_text(a.get_text() or "")
        if not title:
            # Sometimes title is in alt attribute
            title = _clean_text(img.get("alt") if img else "")

        price = None
        # Attempt to find price in close context
        parent = a.parent
        if parent:
            price_candidate = parent.get_text(" ", strip=True)
            # find something like 12,34 or 12.34
            m = re.search(r"(\d+[\.,]\d{1,2})", price_candidate)
            if m:
                price = _parse_price_to_float(m.group(1))

        if not title or price is None or not image_url:
            continue

        products.append(
            {
                "title": title,
                "price": price,
                "image_url": image_url,
                "images": _unique_keep_order([image_url]),
                "seo_title": None,
                "seo_description": None,
                "product_url": _abs_url(href) or None,
            }
        )

    return products


def _dedupe_products(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    out: List[Dict[str, Any]] = []

    for p in products:
        key = (p.get("product_url") or "", p.get("title") or "")
        if key in seen:
            continue
        seen.add(key)
        out.append(p)

    return out


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Parse HTML and output JSON for /admin/temporary-products/import"
    )
    parser.add_argument("html_path", help="Path to input HTML")
    parser.add_argument(
        "modo",
        nargs="?",
        default="listado",
        choices=["listado", "detalle"],
        help="Included for compatibility with the runner",
    )
    parser.add_argument("--title", help="Unused; compatibility only")
    args = parser.parse_args()

    html = _read_file(args.html_path)
    soup = BeautifulSoup(html, "html.parser")

    products = _extract_from_cards(soup)
    if not products:
        products = _extract_aliexpress_listing(soup)
    if not products:
        products = _extract_fallback(soup)

    products = _dedupe_products(products)

    # The importer ignores unknown keys; we keep only what it validates
    importable = []
    for p in products:
        importable.append(
            {
                "title": p["title"],
                "price": p["price"],
                "image_url": p["image_url"],
                "seo_title": p.get("seo_title"),
                "seo_description": p.get("seo_description"),
                "images": p.get("images") or [],
            }
        )

    payload: Dict[str, Any] = {"products": importable}
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
