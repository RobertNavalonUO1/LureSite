import os
import sys
import json
import argparse
import copy
import io
import subprocess
import re
import tempfile
from urllib.parse import urlsplit, urlunsplit
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# =========================
# Utilidades
# =========================
def limpiar_texto(texto: str) -> str:
    if not texto:
        return ""
    return " ".join(texto.replace("\xa0", " ").split())

def absolutizar_src(src: str) -> str:
    if not src:
        return ""
    src = src.strip()
    if src.startswith("//"):
        return "https:" + src
    return src

def normalizar_titulo(t: str) -> str:
    return limpiar_texto(t).lower() if t else ""

def es_avif(url: str) -> bool:
    return url and url.lower().endswith(".avif")

def quitar_query_fragment(url: str) -> str:
    if not url:
        return ""
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))

def normalizar_url_producto(href: str) -> str:
    return quitar_query_fragment(absolutizar_src(href))

def normalizar_url_imagen(url: str) -> str:
    return quitar_query_fragment(absolutizar_src(url))

def dedupe_imagenes(lista):
    seen = set()
    out = []
    for img in lista or []:
        norm = normalizar_url_imagen(img)
        if norm and norm not in seen:
            seen.add(norm)
            out.append(img)
    return out

def merge_imagenes(existing, new_items):
    return dedupe_imagenes((existing or []) + (new_items or []))


def parece_precio(texto: str) -> bool:
    if not texto:
        return False
    return bool(re.search(r"\d[\d\.,]*\s*(?:€|\$|£)", texto))


def parsear_precio_float(texto: str):
    if not texto:
        return None

    limpio = limpiar_texto(texto)
    limpio = re.sub(r"[^0-9,\.\-]", "", limpio)
    if not limpio:
        return None

    if "," in limpio and "." in limpio:
        limpio = limpio.replace(".", "").replace(",", ".")
    elif "," in limpio:
        limpio = limpio.replace(",", ".")

    try:
        return float(limpio)
    except ValueError:
        return None


def extraer_titulo_anchor(anchor) -> str:
    selectores = [
        "h3",
        "[role='heading'] h3",
        "[class*='title'] h3",
        "[class*='title']",
        "[title]",
        "[aria-label]",
    ]

    for selector in selectores:
        for elemento in anchor.select(selector):
            texto = ""
            if elemento.has_attr("title"):
                texto = limpiar_texto(elemento.get("title"))
            if not texto and elemento.has_attr("aria-label") and not parece_precio(elemento.get("aria-label")):
                texto = limpiar_texto(elemento.get("aria-label"))
            if not texto:
                texto = limpiar_texto(elemento.get_text(" ", strip=True))
            if len(texto) >= 8 and not parece_precio(texto):
                return texto

    for img in anchor.select("img[alt]"):
        alt = limpiar_texto(img.get("alt"))
        if len(alt) >= 8:
            return alt

    return ""


def extraer_precio_anchor(anchor) -> str:
    candidatos = []

    for selector in [
        "[aria-label*='€']",
        "[aria-label*='$']",
        "[aria-label*='£']",
        ".price",
        ".precio",
        "[class*='price']",
    ]:
        for elemento in anchor.select(selector):
            aria_label = limpiar_texto(elemento.get("aria-label", ""))
            texto = aria_label if parece_precio(aria_label) else limpiar_texto(elemento.get_text("", strip=True))
            if parece_precio(texto):
                candidatos.append(texto)

    if not candidatos:
        texto_anchor = limpiar_texto(anchor.get_text(" ", strip=True))
        encontrados = re.findall(r"\d[\d\.,]*\s*(?:€|\$|£)", texto_anchor)
        candidatos.extend(encontrados)

    return limpiar_texto(candidatos[0]) if candidatos else ""


def extraer_precio_original_anchor(anchor) -> str:
    for elemento in anchor.select("[style*='line-through'], s, del, strike"):
        texto = limpiar_texto(elemento.get_text("", strip=True))
        if parece_precio(texto):
            return texto
    return ""


def extraer_imagenes_anchor(anchor):
    imagenes = []
    for img in anchor.select("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if not src:
            continue
        src_norm = normalizar_url_imagen(src)
        if not src_norm:
            continue
        if not any(host in src_norm for host in ("aliexpress-media.com", "alicdn.com", "aliexpress.com")):
            continue
        if any(bloqueado in src_norm.lower() for bloqueado in ("/45x60.", "/48x48.", "/60x60.", "/154x64.", "/166x64.", "/702x72.")):
            continue
        imagenes.append(src_norm)
    return dedupe_imagenes(imagenes)


def extraer_producto_desde_anchor(anchor):
    href = anchor.get("href") if anchor and anchor.has_attr("href") else ""
    url = normalizar_url_producto(href)
    titulo = extraer_titulo_anchor(anchor)
    precio = extraer_precio_anchor(anchor)
    precio_original = extraer_precio_original_anchor(anchor)
    imagenes = extraer_imagenes_anchor(anchor)
    imagen = imagenes[0] if imagenes else ""

    if not titulo and not precio and not imagen:
        return None

    return {
        "titulo": titulo,
        "url": url,
        "imagen": imagen,
        "precio": precio,
        "precio_original": precio_original,
        "imagenes": imagenes,
        "videos": []
    }


def serializar_producto_detectado(producto):
    imagenes = dedupe_imagenes(producto.get("imagenes", []))
    imagen_principal = normalizar_url_imagen(producto.get("imagen") or "")
    if imagen_principal and imagen_principal not in imagenes:
        imagenes = [imagen_principal] + imagenes

    return {
        "title": limpiar_texto(producto.get("titulo") or ""),
        "price_text": limpiar_texto(producto.get("precio") or ""),
        "original_price_text": limpiar_texto(producto.get("precio_original") or ""),
        "image_url": imagen_principal or (imagenes[0] if imagenes else ""),
        "images": imagenes,
        "product_url": normalizar_url_producto(producto.get("url") or ""),
    }


def construir_producto_importable(producto):
    detectado = serializar_producto_detectado(producto)
    precio = parsear_precio_float(detectado.get("price_text") or "")

    if not detectado["title"] or precio is None or not detectado["image_url"]:
        return None

    return {
        "title": detectado["title"],
        "price": precio,
        "image_url": detectado["image_url"],
        "images": detectado["images"],
        "seo_title": None,
        "seo_description": None,
        "product_url": detectado["product_url"] or None,
    }


def construir_payload_salida(resultado, hubo_cambios_locales):
    productos_detectados = resultado.get("productos_detectados", []) or []
    detectados = [serializar_producto_detectado(producto) for producto in productos_detectados]

    importables = []
    omitidos_no_importables = 0
    for producto in productos_detectados:
        importable = construir_producto_importable(producto)
        if importable is None:
            omitidos_no_importables += 1
            continue
        importables.append(importable)

    extraidos = resultado.get("extraidos", 0)
    if extraidos == 0:
        summary_text = "No se detectaron productos validos en el HTML recibido."
    else:
        summary_text = (
            f"Se detectaron {extraidos} productos. "
            f"Listos para migrar: {len(importables)}. "
            f"Cambios locales: {'si' if hubo_cambios_locales else 'no'}."
        )

    return {
        "summary_text": summary_text,
        "stats": {
            "detected": extraidos,
            "ready_to_import": len(importables),
            "new": resultado.get("nuevos", 0),
            "updated": resultado.get("actualizados", 0),
            "unchanged": resultado.get("sin_cambios", 0),
            "skipped_without_title": resultado.get("omitidos_sin_titulo", 0),
            "skipped_not_importable": omitidos_no_importables,
            "local_changes": hubo_cambios_locales,
        },
        "detected_products": detectados,
        "products": importables,
    }

# =========================
# IO productos.json / HTML
# =========================
def cargar_productos(out_dir: str):
    productos_path = os.path.join(out_dir, "productos.json")
    if os.path.exists(productos_path):
        with open(productos_path, "r", encoding="utf-8") as f:
            return json.load(f), productos_path
    return [], productos_path

def resolver_directorio_salida(out_dir: str):
    candidatos = []

    if out_dir:
        candidatos.append(out_dir)

    candidatos.append(tempfile.gettempdir())

    for candidato in candidatos:
        if not candidato:
            continue
        try:
            os.makedirs(candidato, exist_ok=True)
            if os.access(candidato, os.W_OK):
                return candidato
        except OSError:
            continue

    raise PermissionError("No hay un directorio de salida escribible disponible.")

def guardar_productos(productos, out_dir: str):
    output_dir = resolver_directorio_salida(out_dir)
    productos_path = os.path.join(output_dir, "productos.json")
    with open(productos_path, "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, indent=2)
    return productos_path

def guardar_lote_importacion(productos, out_dir: str):
    tmp_dir = out_dir if out_dir and os.path.isdir(out_dir) else None
    fd, temp_path = tempfile.mkstemp(prefix="productos_import_", suffix=".json", dir=tmp_dir, text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(productos, f, ensure_ascii=False, indent=2)
        return temp_path
    except Exception:
        try:
            os.close(fd)
        except OSError:
            pass
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise

def regenerar_html(productos, out_dir: str):
    # Opcional: genera un HTML de resumen, puedes omitir si no lo usas
    pass


def preguntar_subida_bd() -> bool:
    print()
    print("¿Quieres subir ahora los productos a la tabla temporary_products?")
    while True:
        try:
            opcion = input("Subir a BD [s/N]: ").strip().lower()
        except EOFError:
            print("[INFO] Entrada no interactiva: se omite subida a BD.")
            return False

        if opcion in ("", "n", "no"):
            return False
        if opcion in ("s", "si", "sí", "y", "yes"):
            return True
        print("[WARN] Opción no válida. Responde s o n.")


def es_interactivo() -> bool:
    return bool(getattr(sys.stdin, "isatty", lambda: False)())


def subir_productos_a_bd(json_path: str) -> bool:
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        artisan_path = os.path.join(project_root, "artisan")

        if not os.path.exists(artisan_path):
            print(f"[ERROR] No se encontró artisan en: {artisan_path}")
            return False

        cmd = [
            "php",
            "artisan",
            "temporary-products:import-json",
            f"--file={json_path}",
        ]

        print("[INFO] Ejecutando importación en Laravel...")
        try:
            result = subprocess.run(
                cmd,
                cwd=project_root,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                check=False,
            )
        except FileNotFoundError:
            mensaje = "[ERROR] No se encontró el comando 'php' en el PATH."
            print(mensaje)
            return {"ok": False, "message": mensaje}
        except Exception as exc:
            mensaje = f"[ERROR] Falló la ejecución del comando de importación: {exc}"
            print(mensaje)
            return {"ok": False, "message": mensaje}

        if result.stdout:
            print(result.stdout.strip())
        if result.stderr:
            print(result.stderr.strip())

        if result.returncode != 0:
            mensaje = f"[ERROR] La importación terminó con código {result.returncode}."
            print(mensaje)
            return {
                "ok": False,
                "message": mensaje,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "returncode": result.returncode,
            }

        print("[OK] Productos subidos a la base de datos temporal.")
        return {
            "ok": True,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode,
        }
    except Exception as exc:
        mensaje = f"[ERROR] Error inesperado durante la subida a BD: {exc}"
        print(mensaje)
        return {"ok": False, "message": mensaje}

# =========================
# Extracción de datos
# =========================
def extraer_datos_listado(html):
    soup = BeautifulSoup(html, "html.parser")
    productos = []

    for prod in soup.select(".product-card, .producto, .item"):
        titulo = limpiar_texto(prod.select_one(".title, .titulo, h2, h3").get_text() if prod.select_one(".title, .titulo, h2, h3") else "")
        url = prod.select_one("a")
        url = url["href"] if url and url.has_attr("href") else ""
        imagen = prod.select_one("img")
        imagen = imagen["src"] if imagen and imagen.has_attr("src") else ""
        precio = limpiar_texto(prod.select_one(".price, .precio").get_text() if prod.select_one(".price, .precio") else "")
        productos.append({
            "titulo": titulo,
            "url": normalizar_url_producto(url),
            "imagen": normalizar_url_imagen(imagen),
            "precio": precio,
            "imagenes": [normalizar_url_imagen(imagen)] if imagen else [],
            "videos": []
        })

    anchors = soup.select("a[href*='/item/']")
    for anchor in anchors:
        producto = extraer_producto_desde_anchor(anchor)
        if producto:
            productos.append(producto)

    vistos = set()
    unicos = []
    for producto in productos:
        key = (
            normalizar_url_producto(producto.get("url") or ""),
            normalizar_titulo(producto.get("titulo") or "")
        )
        if key in vistos:
            continue
        if not key[0] and not key[1]:
            continue
        vistos.add(key)
        unicos.append(producto)
    return unicos

def extraer_media_galeria(html, page_url=None):
    soup = BeautifulSoup(html, "html.parser")
    imagenes = []
    videos = []
    for img in soup.select("img"):
        src = img.get("src")
        if src:
            imagenes.append(normalizar_url_imagen(src))
    for video in soup.select("video source"):
        src = video.get("src")
        if src:
            videos.append(src)
    return {"imagenes": dedupe_imagenes(imagenes), "videos": videos}

def fusionar_media_en_productos(productos, titulo, media):
    key = normalizar_titulo(titulo)
    for p in productos:
        if normalizar_titulo(p.get("titulo")) == key:
            p.setdefault("imagenes", [])
            p["imagenes"] = merge_imagenes(p["imagenes"], media.get("imagenes", []))
            p.setdefault("videos", [])
            p["videos"] = list(set((p["videos"] or []) + (media.get("videos") or [])))
            return True
    return False

# =========================
# Entrada desde archivo
# =========================
def leer_html_desde_archivo(path):
    if not path or not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def ejecutar_modo_listado_web(args, productos):
    html = leer_html_desde_archivo(args.html_path)
    if not html.strip():
        mensaje = "[ERROR] No se recibió HTML."
        return {"ok": False, "mensaje": mensaje, "fatal": True}

    productos_extraidos = extraer_datos_listado(html)
    cambios = False
    nuevos = 0
    actualizados = 0
    sin_cambios = 0
    omitidos_sin_titulo = 0

    for nuevo in productos_extraidos:
        key_nuevo = normalizar_titulo(nuevo.get("titulo"))
        if not key_nuevo:
            omitidos_sin_titulo += 1
            continue
        idx = None
        for i, existente in enumerate(productos):
            if normalizar_titulo(existente.get("titulo")) == key_nuevo:
                idx = i
                break
        if idx is None:
            productos.append(nuevo)
            cambios = True
            nuevos += 1
        else:
            p = productos[idx]
            before = json.dumps(p, ensure_ascii=False, sort_keys=True)
            if not p.get("url") and nuevo.get("url"):
                p["url"] = nuevo["url"]
            if not p.get("imagen") and nuevo.get("imagen"):
                p["imagen"] = nuevo["imagen"]
            if not p.get("precio") and nuevo.get("precio"):
                p["precio"] = nuevo["precio"]
            p.setdefault("imagenes", [])
            p["imagenes"] = merge_imagenes(p["imagenes"], dedupe_imagenes(nuevo.get("imagenes", [])))
            after = json.dumps(p, ensure_ascii=False, sort_keys=True)
            if before != after:
                cambios = True
                actualizados += 1
            else:
                sin_cambios += 1

    page_url_for_media = None
    urls_en_html = list({p.get("url") for p in productos_extraidos if p.get("url")})
    if len(urls_en_html) == 1:
        page_url_for_media = urls_en_html[0]

    media = extraer_media_galeria(html, page_url_for_media)
    fusion_ok = False

    if media.get("imagenes") or media.get("videos"):
        target_title = None

        if args.title:
            target_title = args.title
        elif len(productos_extraidos) == 1 and productos_extraidos[0].get("titulo"):
            target_title = productos_extraidos[0]["titulo"]
        elif not productos_extraidos and len(productos) == 1 and productos[0].get("titulo"):
            target_title = productos[0]["titulo"]

        if target_title:
            if fusionar_media_en_productos(productos, target_title, media):
                fusion_ok = True
                cambios = True

    return {
        "ok": True,
        "cambios": cambios,
        "extraidos": len(productos_extraidos),
        "fusion": fusion_ok,
        "nuevos": nuevos,
        "actualizados": actualizados,
        "sin_cambios": sin_cambios,
        "omitidos_sin_titulo": omitidos_sin_titulo,
        "productos_detectados": productos_extraidos,
    }

def ejecutar_modo_detalle_web(args, productos):
    html = leer_html_desde_archivo(args.html_path)
    if not html.strip():
        mensaje = "[ERROR] No se recibió HTML."
        return {"ok": False, "mensaje": mensaje, "fatal": True}

    soup = BeautifulSoup(html, "html.parser")

    titulo = args.title or None
    if not titulo:
        title_el = soup.select_one("h1[data-pl='product-title']") or soup.select_one("h1")
        if title_el:
            titulo = limpiar_texto(title_el.get_text())

    if not titulo:
        mensaje = "[ERROR] No se encontró un título en el HTML ni se proporcionó --title."
        return {"ok": False, "mensaje": mensaje}

    key = normalizar_titulo(titulo)
    producto_obj = None
    for p in productos:
        if normalizar_titulo(p.get("titulo")) == key:
            producto_obj = p
            break

    if producto_obj is None:
        mensaje = f"[WARN] No se encontró un producto guardado con el título: '{titulo}'"
        return {"ok": False, "mensaje": mensaje}

    page_url = producto_obj.get("url")
    media = extraer_media_galeria(html, page_url)

    prev_imgs = len(producto_obj.get("imagenes") or [])
    prev_videos = len(producto_obj.get("videos") or [])

    if not fusionar_media_en_productos(productos, titulo, media):
        mensaje = f"[WARN] No se pudo asociar la galería al título: '{titulo}'"
        return {"ok": False, "mensaje": mensaje}

    nuevas_imgs = max(len(producto_obj.get("imagenes") or []) - prev_imgs, 0)
    nuevas_videos = max(len(producto_obj.get("videos") or []) - prev_videos, 0)

    return {
        "ok": True,
        "cambios": (nuevas_imgs > 0) or (nuevas_videos > 0),
        "titulo": titulo,
        "imagenes_agregadas": nuevas_imgs,
        "videos_agregados": nuevas_videos
    }

# =========================
# Main para web (no interactivo)
# =========================
def main():
    parser = argparse.ArgumentParser(
        description="Extrae productos o añade imágenes desde HTML recibido por archivo (no interactivo)."
    )
    parser.add_argument("html_path", help="Ruta al archivo HTML de entrada")
    parser.add_argument("modo", choices=["listado", "detalle"], help="Modo de operación: listado o detalle")
    parser.add_argument("--out", default=os.path.dirname(os.path.abspath(__file__)),
                        help="Carpeta de salida (productos.json / productos_ordenados.html).")
    parser.add_argument("--title", help="Título EXACTO para asociar la galería cuando sea necesario.")
    args = parser.parse_args()

    output_dir = resolver_directorio_salida(args.out)
    productos, _ = cargar_productos(output_dir)
    estado_inicial = copy.deepcopy(productos)

    if args.modo == "detalle":
        resultado = ejecutar_modo_detalle_web(args, productos)
    else:
        resultado = ejecutar_modo_listado_web(args, productos)

    if not resultado.get("ok", False):
        mensaje = resultado.get("mensaje")
        if mensaje:
            print(mensaje)
        if resultado.get("fatal"):
            sys.exit(1)
        return

    hubo_cambios_locales = productos != estado_inicial
    extraidos = resultado.get("extraidos", 0)
    payload = construir_payload_salida(resultado, hubo_cambios_locales)
    payload["state_path"] = os.path.join(output_dir, "productos.json")

    if hubo_cambios_locales:
        guardar_productos(productos, output_dir)

    print(payload["summary_text"])
    print(json.dumps(payload, ensure_ascii=False))

if __name__ == "__main__":
    main()