import os
import sys
import json
import argparse
import copy
import subprocess
from urllib.parse import urlsplit, urlunsplit
from bs4 import BeautifulSoup

# =========================
# Utilidades
# =========================
def limpiar_texto(texto: str) -> str:
    if not texto:
        return ""
    return " ".join(texto.replace("\xa0", " ").split())

def absolutizar_src(src: str) -> str:
    return src.strip() if src else ""

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
    return quitar_query_fragment(href)

def normalizar_url_imagen(url: str) -> str:
    return quitar_query_fragment(url)

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

# =========================
# IO productos.json / HTML
# =========================
def cargar_productos(out_dir: str):
    productos_path = os.path.join(out_dir, "productos.json")
    if os.path.exists(productos_path):
        with open(productos_path, "r", encoding="utf-8") as f:
            return json.load(f), productos_path
    return [], productos_path

def guardar_productos(productos, out_dir: str):
    productos_path = os.path.join(out_dir, "productos.json")
    with open(productos_path, "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, indent=2)
    return productos_path

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
    return productos

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
            productos.append(nuevo)
            cambios = True
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
        "fusion": fusion_ok
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

    productos, _ = cargar_productos(args.out)
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

    if productos == estado_inicial:
        print("[INFO] No se detectaron cambios en los productos.")
        return

    json_path = guardar_productos(productos, args.out)
    # regenerar_html(productos, args.out)  # Si quieres generar HTML resumen
    print(f"[INFO] Productos guardados: {len(productos)}")

    if preguntar_subida_bd():
        subir_productos_a_bd(json_path)
    else:
        print("[INFO] Subida a BD omitida por el usuario.")

if __name__ == "__main__":
    main()