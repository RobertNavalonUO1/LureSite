import re
import os
import sys
import json
import argparse
import copy
import subprocess
from urllib.parse import urlsplit, urlunsplit
from html import escape
from bs4 import BeautifulSoup

# =========================
# Utilidades
# =========================
def limpiar_texto(texto: str) -> str:
    if not texto:
        return ""
    return re.sub(r"\s+", " ", texto).strip()

def absolutizar_src(src: str) -> str:
    if not src:
        return ""
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("/"):
        # si fuera relativo absoluto sin dominio, lo dejamos tal cual
        return src
    return src

def normalizar_titulo(t: str) -> str:
    return limpiar_texto(t or "").casefold()

def es_avif(url: str) -> bool:
    return bool(url) and (".avif" in url.lower())

def quitar_query_fragment(url: str) -> str:
    if not url:
        return url
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))

def normalizar_url_producto(href: str) -> str:
    """
    Devuelve una URL corta tipo:
      https://es.aliexpress.com/item/1234567890.html
    """
    if not href:
        return None
    url = absolutizar_src(href)
    if url.startswith("/item/"):
        url = "https://es.aliexpress.com" + url
    url_sin_q = quitar_query_fragment(url)
    m = re.search(r"(https?://[^/]+/item/\d+\.html)", url_sin_q)
    return m.group(1) if m else url_sin_q

def normalizar_url_imagen(url: str) -> str:
    if not url:
        return None
    return quitar_query_fragment(absolutizar_src(url))

def dedupe_imagenes(lista):
    """
    Normaliza y deduplica imágenes por 'src' (normalizado).
    Acepta strings (URL) o dicts con claves: src, page, original_src.
    Conserva la primera 'original_src' y completa 'page' si estaba vacía.
    """
    res = []
    vistos = {}
    for it in lista:
        if isinstance(it, str):
            raw = it
            src = normalizar_url_imagen(raw)
            if not src or not es_avif(src):
                continue
            if src in vistos:
                if not res[vistos[src]].get("original_src"):
                    res[vistos[src]]["original_src"] = raw
                continue
            res.append({"src": src, "page": None, "original_src": raw})
            vistos[src] = len(res) - 1
        elif isinstance(it, dict):
            raw = it.get("original_src")
            src = normalizar_url_imagen(it.get("src"))
            if not src or not es_avif(src):
                continue
            page = it.get("page")
            if src in vistos:
                i = vistos[src]
                if page and not res[i].get("page"):
                    res[i]["page"] = page
                if raw and not res[i].get("original_src"):
                    res[i]["original_src"] = raw
            else:
                res.append({"src": src, "page": page, "original_src": raw or it.get("src")})
                vistos[src] = len(res) - 1
    return res

def merge_imagenes(existing, new_items):
    base = dedupe_imagenes(existing)
    return dedupe_imagenes(base + list(new_items or []))

# =========================
# IO productos.json / HTML
# =========================
def cargar_productos(out_dir: str):
    path = os.path.join(out_dir, "productos.json")
    if not os.path.exists(path):
        return [], path
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        if not isinstance(data, list):
            data = []
        for p in data:
            if isinstance(p.get("imagenes"), list):
                p["imagenes"] = dedupe_imagenes(p["imagenes"])
        return data, path

def guardar_productos(productos, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "productos.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, indent=4)
    print(f"[OK] JSON: {path}")
    return path

def regenerar_html(productos, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    archivo_html = os.path.join(out_dir, "productos_ordenados.html")
    with open(archivo_html, "w", encoding="utf-8") as file:
        file.write("<!DOCTYPE html>\n<html lang='es'>\n<head>\n<meta charset='UTF-8'>\n")
        file.write("<title>Productos Ordenados</title>\n<style>\n")
        file.write("""
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Noto Sans', Arial; margin: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
            .card { border: 1px solid #eee; border-radius: 12px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
            .header { display:flex; align-items:flex-start; gap:12px; }
            .thumb { width: 120px; height: 120px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; padding: 6px; background:#fff; }
            .titulo { font-size: 15px; color: #333; margin: 0 0 6px 0; }
            .precios { margin-top: 6px; }
            .precio { font-size: 16px; color: #E5533D; font-weight: 600; margin-right: 10px; }
            .precio-original { font-size: 13px; color: #888; text-decoration: line-through; }
            .galeria { display:flex; flex-wrap: wrap; gap:8px; margin-top: 12px; }
            .galeria a { display:block; }
            .galeria img { width: 90px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e5e5; }
            .img-links { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e5e5e5; font-size: 12px; line-height: 1.4; word-break: break-all; }
            .img-links div { margin-bottom: 4px; }
            .img-links a { color: #444; text-decoration: none; }
            .img-links a:hover { text-decoration: underline; }
            .img-links .index { color: #999; margin-right: 6px; font-size: 11px; }
            .placeholder { width: 120px; height: 120px; background: #f5f5f5; border: 1px dashed #ccc; border-radius: 8px; display:flex; align-items:center; justify-content:center; color:#888; }
            .url-prod { font-size:12px; color:#3366cc; word-break: break-all; }
            .orig { font-size:11px; color:#777; word-break: break-all; }
        """)
        file.write("</style>\n</head>\n<body>\n<h1>Productos extraídos</h1>\n<div class='grid'>\n")

        for p in productos:
            file.write("<div class='card'>\n")
            file.write("<div class='header'>\n")
            if p.get("imagen"):
                file.write(f"  <img class='thumb' src='{p['imagen']}' alt='producto' />\n")
            else:
                file.write("  <div class='placeholder'>Sin imagen</div>\n")
            file.write("<div>\n")
            titulo = p.get('titulo','')
            file.write(f"  <h3 class='titulo'>{titulo}</h3>\n")
            if p.get("url"):
                file.write(f"  <div class='url-prod'><a href='{p['url']}' target='_blank'>{p['url']}</a></div>\n")
            file.write("  <div class='precios'>\n")
            if p.get("precio"):
                file.write(f"    <span class='precio'>{p['precio']}</span>\n")
            if p.get("precio_original"):
                file.write(f"    <span class='precio-original'>{p['precio_original']}</span>\n")
            file.write("  </div>\n</div>\n</div>\n")

            imagenes = p.get("imagenes", [])
            if imagenes:
                file.write("<div class='galeria'>\n")
                for it in imagenes:
                    src = it.get("src")
                    if not src:
                        continue
                    page = it.get("page")
                    original = it.get("original_src") or src
                    safe_src = escape(src, quote=True)
                    safe_original = escape(original)
                    if page:
                        safe_page = escape(page, quote=True)
                        file.write(f'  <a href="{safe_page}" target="_blank" title="{safe_original}"><img src="{safe_src}" alt="galeria" /></a>\n')
                    else:
                        file.write(f'  <img src="{safe_src}" alt="galeria" title="{safe_original}" />\n')
                file.write("</div>\n")
                file.write("<div class='img-links'>\n")
                for idx, it in enumerate(imagenes, start=1):
                    src = it.get("src")
                    original = it.get("original_src") or src
                    href = src or original
                    if not href:
                        continue
                    safe_href = escape(href, quote=True)
                    safe_text = escape(original or href)
                    file.write(f'  <div><span class="index">#{idx:02d}</span><a href="{safe_href}" target="_blank">{safe_text}</a></div>\n')
                file.write("</div>\n")

            file.write("</div>\n")

        file.write("</div>\n</body>\n</html>\n")

    print(f"[OK] HTML: {archivo_html}")
    return archivo_html

# =========================
# Extracción tarjetas/listados
# =========================
def extraer_producto_desde_contenedor(container) -> dict:
    # URL del producto (corta)
    a = container if container.name == "a" else container.select_one("a.productContainer")
    url_prod = normalizar_url_producto(a.get("href")) if a and a.has_attr("href") else None

    # Imagen principal (solo .avif)
    imagen = None
    imagen_original = None
    imagenes_list = []

    img_tag = container.select_one(".AIC-MI-container img.AIC-MI-img")
    if img_tag and img_tag.get("src"):
        raw = img_tag.get("src")
        src_abs = normalizar_url_imagen(raw)
        if es_avif(src_abs):
            imagen = src_abs
            imagen_original = raw
            imagenes_list.append({"src": src_abs, "page": url_prod, "original_src": raw})

    # Título
    title_el = container.select_one(".AIC-TA-multi-icon-title")
    titulo = limpiar_texto(title_el.get_text()) if title_el else None

    # Precio actual
    price_el = container.select_one(".AIC4-PI-price-text")
    precio = limpiar_texto(price_el.get_text()) if price_el else None

    # Precio original (opcional)
    price_ori_el = container.select_one(".AIC4-PI-ori-price-text")
    precio_original = limpiar_texto(price_ori_el.get_text()) if price_ori_el else None

    if (titulo or precio or imagen):
        data = {
            "titulo": titulo,
            "url": url_prod,
            "imagen": imagen,
            "imagen_original": imagen_original,
            "precio": precio,
            "precio_original": precio_original,
            "imagenes": dedupe_imagenes(imagenes_list),
            "videos": []
        }
        return data
    return {}

def extraer_datos_listado(texto_html: str):
    """
    1) a.productContainer (clásico)
    2) a[href*="/item/"] (genérico)
    Imágenes: solo .avif. Por cada <img> guarda {src(normalizado), page(url corta), original_src(crudo)}
    """
    soup = BeautifulSoup(texto_html, "html.parser")
    productos = []

    # 1) Estructura clásica
    contenedores = soup.select("a.productContainer")
    if contenedores:
        for c in contenedores:
            p = extraer_producto_desde_contenedor(c)
            if p:
                productos.append(p)

    # 2) Genérico (Just for you, etc.)
    anchors = soup.select('a[href*="/item/"]')
    for a in anchors:
        url_prod = normalizar_url_producto(a.get("href"))

        # Título
        title_el = a.select_one("h3.yB6en")
        titulo = None
        if title_el:
            titulo = limpiar_texto(title_el.get_text())
        else:
            el_con_title = a.select_one('[title]')
            if el_con_title and el_con_title.has_attr("title"):
                titulo = limpiar_texto(el_con_title["title"])
            else:
                txt = limpiar_texto(a.get_text())
                if len(txt) >= 10 and "Similar items" not in txt and "See preview" not in txt:
                    titulo = txt

        # Precio
        precio = None
        price_wrap = a.select_one("div._3Mpbo")
        if price_wrap:
            spans = [limpiar_texto(s.get_text()) for s in price_wrap.select("span")]
            if spans:
                precio = limpiar_texto("".join(spans))

        # Precio original
        precio_original = None
        tachado = a.select_one("div._3DRNh span")
        if tachado:
            precio_original = limpiar_texto(tachado.get_text())

        # Imágenes (solo .avif) dentro del anchor
        imagen = None
        imagen_original = None
        imagenes_list = []
        for img in a.find_all("img"):
            raw = img.get("src")
            if not raw:
                continue
            src_abs = normalizar_url_imagen(raw)
            if es_avif(src_abs) and any(host in src_abs for host in ("aliexpress-media.com", "alicdn.com")):
                if not imagen:
                    imagen = src_abs
                    imagen_original = raw
                imagenes_list.append({"src": src_abs, "page": url_prod, "original_src": raw})

        if titulo or precio or imagen:
            data = {
                "titulo": titulo,
                "url": url_prod,
                "imagen": imagen,
                "imagen_original": imagen_original,
                "precio": precio,
                "precio_original": precio_original,
                "imagenes": dedupe_imagenes(imagenes_list),
                "videos": []
            }
            productos.append(data)

    # Dedup por título
    vistos = set()
    unicos = []
    for p in productos:
        key = normalizar_titulo(p.get("titulo", ""))
        if key and key not in vistos:
            vistos.add(key)
            unicos.append(p)
    return unicos

# =========================
# Extracción galería/slider
# =========================
def extraer_media_galeria(html_galeria: str, page_url: str = None):
    """
    Solo imágenes .avif. Devuelve lista con {src(normalizado), page, original_src}.
    """
    soup = BeautifulSoup(html_galeria, "html.parser")
    imagenes = []

    # Slider prioritario
    sliders = soup.select(".slider--wrap--dfLgmYD")
    for slider in sliders:
        for img in slider.select("img"):
            raw = img.get("src")
            if not raw:
                continue
            src_abs = normalizar_url_imagen(raw)
            if es_avif(src_abs):
                imagenes.append({"src": src_abs, "page": page_url, "original_src": raw})

    # Fallback si no hubo slider
    if not imagenes:
        for img in soup.find_all("img"):
            raw = img.get("src")
            if not raw:
                continue
            src_abs = normalizar_url_imagen(raw)
            if es_avif(src_abs) and any(host in src_abs for host in ("aliexpress-media.com", "alicdn.com")):
                imagenes.append({"src": src_abs, "page": page_url, "original_src": raw})

    # Videos (sin cambios)
    videos = []
    poster = None
    video_tag = soup.select_one("video")
    if video_tag:
        poster = normalizar_url_imagen(video_tag.get("poster") or "")
        for s in video_tag.select("source"):
            src = s.get("src")
            if src:
                videos.append(normalizar_url_imagen(src))

    imagenes = dedupe_imagenes(imagenes)
    # dedupe videos
    vset, vres = set(), []
    for v in videos:
        if v and v not in vset:
            vset.add(v)
            vres.append(v)

    return {"imagenes": imagenes, "videos": vres, "poster": poster}

# =========================
# Fusión de datos
# =========================
def fusionar_media_en_productos(productos: list, titulo_objetivo: str, media: dict):
    if not productos or not media:
        return False

    idx_obj = None
    if titulo_objetivo:
        key = normalizar_titulo(titulo_objetivo)
        for i, p in enumerate(productos):
            if normalizar_titulo(p.get("titulo")) == key:
                idx_obj = i
                break
    elif len(productos) == 1:
        idx_obj = 0

    if idx_obj is None:
        return False

    p = productos[idx_obj]
    p.setdefault("imagenes", [])
    p.setdefault("videos", [])

    # Si las imágenes de galería no traen page, intenta completar con p["url"]
    imgs = []
    for it in media.get("imagenes", []):
        imgs.append({
            "src": it.get("src"),
            "page": it.get("page") or p.get("url"),
            "original_src": it.get("original_src")
        })

    p["imagenes"] = merge_imagenes(p["imagenes"], imgs)

    if not p.get("imagen") and p["imagenes"]:
        p["imagen"] = p["imagenes"][0]["src"]
        if not p.get("imagen_original"):
            p["imagen_original"] = p["imagenes"][0].get("original_src")

    # vídeos
    vset = set(p["videos"])
    for v in media.get("videos", []):
        if v and v not in vset:
            p["videos"].append(v)
            vset.add(v)

    poster = media.get("poster")
    if poster and "video_poster" not in p:
        p["video_poster"] = poster

    return True

# =========================
# Impresión de src por producto (nuevo)
# =========================
def imprimir_srcs_por_producto(productos_extraidos):
    """
    Imprime en consola, para cada producto extraído del HTML actual (no del JSON previo),
    los 'src' EXACTOS tal y como venían en el HTML (original_src), únicamente de imágenes .avif.
    """
    print("\n[LISTA DE SRCS POR ENLACE /item/ ENCONTRADO]\n")
    for p in productos_extraidos:
        url = p.get("url") or "(sin url)"
        titulo = p.get("titulo") or "(sin título)"
        print(f"- URL: {url}")
        print(f"  Título: {titulo}")
        imgs = p.get("imagenes") or []
        if not imgs:
            print("  (sin imágenes .avif)")
            continue
        for it in imgs:
            # cae al original si existe; si no, imprime el normalizado
            print(f"  src: {it.get('original_src') or it.get('src')}")
        print("")

# =========================
# Entrada
# =========================
def leer_html_stdin_interactivo(prompt: str) -> str:
    print(prompt)
    print("(Termina con una línea vacía, o Ctrl+Z + Enter en Windows)")
    lineas = []
    while True:
        try:
            linea = input()
        except EOFError:
            break
        if linea.strip() == "":
            break
        lineas.append(linea)
    return "\n".join(lineas)



def solicitar_modo():
    print()
    print("Selecciona un modo de operacion:")
    print("  1) Extraer tarjetas del listado / slider")
    print("  2) Anadir imagenes a un producto existente (detalle)")
    while True:
        opcion = input("Opcion [1]: ").strip()
        if opcion in ("", "1"):
            return "listado"
        if opcion == "2":
            return "detalle"
        print("[WARN] Opcion no valida. Escribe 1 o 2.")


def preguntar_subida_bd() -> bool:
    print()
    print("¿Quieres subir ahora los productos a la tabla temporary_products?")
    while True:
        opcion = input("Subir a BD [s/N]: ").strip().lower()
        if opcion in ("", "n", "no"):
            return False
        if opcion in ("s", "si", "sí", "y", "yes"):
            return True
        print("[WARN] Opcion no valida. Responde s o n.")


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
            print("[ERROR] No se encontró el comando 'php' en el PATH.")
            return False
        except Exception as exc:
            print(f"[ERROR] Falló la ejecución del comando de importación: {exc}")
            return False

        if result.stdout:
            print(result.stdout.strip())
        if result.stderr:
            print(result.stderr.strip())

        if result.returncode != 0:
            print(f"[ERROR] La importación terminó con código {result.returncode}.")
            return False

        print("[OK] Productos subidos a la base de datos temporal.")
        return True
    except Exception as exc:
        print(f"[ERROR] Error inesperado durante la subida a BD: {exc}")
        return False


def ejecutar_modo_listado(args, productos):
    prompt = "Pega el HTML (listado y/o slider en el mismo bloque):"
    html = leer_html_stdin_interactivo(prompt)
    if not html.strip():
        mensaje = "[ERROR] No se recibio HTML."
        print(mensaje)
        return {"ok": False, "mensaje": mensaje, "fatal": True}

    productos_extraidos = extraer_datos_listado(html)
    if args.print_srcs:
        imprimir_srcs_por_producto(productos_extraidos)

    cambios = False

    for nuevo in productos_extraidos:
        key_nuevo = normalizar_titulo(nuevo.get("titulo"))
        if not key_nuevo:
            continue
        idx = None
        for i, existente in enumerate(productos):
            if normalizar_titulo(existente.get("titulo")) == key_nuevo:
                idx = i
                break
        if idx is None:
            productos.append({
                "titulo": nuevo.get("titulo"),
                "url": nuevo.get("url"),
                "imagen": nuevo.get("imagen"),
                "imagen_original": nuevo.get("imagen_original"),
                "precio": nuevo.get("precio"),
                "precio_original": nuevo.get("precio_original"),
                "imagenes": dedupe_imagenes(nuevo.get("imagenes", [])),
                "videos": []
            })
            cambios = True
        else:
            p = productos[idx]
            before = json.dumps(p, ensure_ascii=False, sort_keys=True)
            if not p.get("url") and nuevo.get("url"):
                p["url"] = nuevo["url"]
            if not p.get("imagen") and nuevo.get("imagen"):
                p["imagen"] = nuevo["imagen"]
                if nuevo.get("imagen_original"):
                    p["imagen_original"] = nuevo["imagen_original"]
            if not p.get("precio") and nuevo.get("precio"):
                p["precio"] = nuevo["precio"]
            if not p.get("precio_original") and nuevo.get("precio_original"):
                p["precio_original"] = nuevo["precio_original"]
            p.setdefault("imagenes", [])
            p["imagenes"] = merge_imagenes(p["imagenes"], dedupe_imagenes(nuevo.get("imagenes", [])))
            after = json.dumps(p, ensure_ascii=False, sort_keys=True)
            if before != after:
                cambios = True

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
                print(f"[INFO] Galeria fusionada con: '{target_title}'")
            else:
                print(f"[WARN] No se pudo asociar la galeria al titulo: '{target_title}'")
        else:
            print('[WARN] Hay imagenes de galeria, pero no se pudo determinar un unico producto destino. Usa --title "Titulo exacto" para asociarlas.')

    return {
        "ok": True,
        "cambios": cambios,
        "extraidos": len(productos_extraidos),
        "fusion": fusion_ok
    }


def ejecutar_modo_detalle(args, productos):
    prompt = "Pega el HTML del detalle (titulo + slider/galeria) para anadir imagenes:"
    html = leer_html_stdin_interactivo(prompt)
    if not html.strip():
        mensaje = "[ERROR] No se recibio HTML."
        print(mensaje)
        return {"ok": False, "mensaje": mensaje, "fatal": True}

    soup = BeautifulSoup(html, "html.parser")

    titulo = args.title or None
    if not titulo:
        title_el = soup.select_one("h1[data-pl='product-title']") or soup.select_one("h1")
        if title_el:
            titulo = limpiar_texto(title_el.get_text())

    if not titulo:
        mensaje = "[ERROR] No se encontro un titulo en el HTML ni se proporciono --title."
        print(mensaje)
        return {"ok": False, "mensaje": mensaje}

    key = normalizar_titulo(titulo)
    producto_obj = None
    for p in productos:
        if normalizar_titulo(p.get("titulo")) == key:
            producto_obj = p
            break

    if producto_obj is None:
        mensaje = f"[WARN] No se encontro un producto guardado con el titulo: '{titulo}'"
        print(mensaje)
        candidatos = [pr.get("titulo") for pr in productos if pr.get("titulo")]
        if candidatos:
            print("[INFO] Titulos disponibles (primeros 5):")
            for titulo_disp in candidatos[:5]:
                print(f"  - {titulo_disp}")
        return {"ok": False, "mensaje": mensaje}

    page_url = producto_obj.get("url")
    media = extraer_media_galeria(html, page_url)

    prev_imgs = len(producto_obj.get("imagenes") or [])
    prev_videos = len(producto_obj.get("videos") or [])
    prev_poster = producto_obj.get("video_poster")

    if not media.get("imagenes") and not media.get("videos") and not media.get("poster"):
        print("[WARN] No se detectaron imagenes .avif ni videos en el bloque proporcionado.")

    if not fusionar_media_en_productos(productos, titulo, media):
        mensaje = f"[WARN] No se pudo asociar la galeria al titulo: '{titulo}'"
        print(mensaje)
        return {"ok": False, "mensaje": mensaje}

    nuevas_imgs = max(len(producto_obj.get("imagenes") or []) - prev_imgs, 0)
    nuevas_videos = max(len(producto_obj.get("videos") or []) - prev_videos, 0)
    poster_actual = producto_obj.get("video_poster")
    poster_nuevo = bool(poster_actual) and poster_actual != prev_poster

    if nuevas_imgs > 0:
        print(f"[INFO] Imagenes nuevas agregadas: {nuevas_imgs}")
    else:
        print("[INFO] No se agregaron nuevas imagenes (posiblemente duplicadas).")

    if nuevas_videos > 0:
        print(f"[INFO] Nuevos videos agregados: {nuevas_videos}")

    if poster_nuevo:
        print("[INFO] Poster de video actualizado.")

    return {
        "ok": True,
        "cambios": (nuevas_imgs > 0) or (nuevas_videos > 0) or poster_nuevo,
        "titulo": titulo,
        "imagenes_agregadas": nuevas_imgs,
        "videos_agregados": nuevas_videos,
        "poster_actualizado": poster_nuevo
    }
# =========================
# Main
# =========================
def main():
    parser = argparse.ArgumentParser(
        description="Selecciona por menu si quieres extraer listados o anadir imagenes desde un detalle."
    )
    parser.add_argument("--out", default=os.path.dirname(os.path.abspath(__file__)),
                        help="Carpeta de salida (productos.json / productos_ordenados.html).")
    parser.add_argument("--title", help="Titulo EXACTO para asociar la galeria cuando sea necesario.")
    parser.add_argument("--print-srcs", action="store_true",
                        help="Solo en modo listado: imprime en consola los src originales encontrados.")
    args = parser.parse_args()

    productos, _ = cargar_productos(args.out)

    modo = solicitar_modo()

    estado_inicial = copy.deepcopy(productos)

    if modo == "detalle":
        resultado = ejecutar_modo_detalle(args, productos)
    else:
        resultado = ejecutar_modo_listado(args, productos)

    if not resultado.get("ok", False):
        mensaje = resultado.get("mensaje")
        if mensaje:
            print(mensaje)
        if resultado.get("fatal"):
            sys.exit(1)
        return

    if productos == estado_inicial:
        print("[INFO] No se detectaron cambios en los productos.")
        return

    json_path = guardar_productos(productos, args.out)
    regenerar_html(productos, args.out)
    print(f"[INFO] Productos guardados: {len(productos)}")

    if preguntar_subida_bd():
        subir_productos_a_bd(json_path)
    else:
        print("[INFO] Subida a BD omitida por el usuario.")


if __name__ == "__main__":
    main()

