import sys
import io
import os
import re
from datetime import datetime
import mysql.connector
from mysql.connector import Error
from bs4 import BeautifulSoup

# Forzar salida en UTF-8 para Laravel
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

DB_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "",
    "database": "webpage_db"
}

def limpiar_precio(texto):
    texto = texto.replace('€', '').replace(',', '.').strip()
    try:
        return float(texto)
    except:
        return None

# Extraer productos desde HTML
def extraer_datos(html):
    soup = BeautifulSoup(html, 'html.parser')
    productos = []

    enlaces = soup.find_all('a', class_='_3mPKP', href=True)
    print(f"[DEBUG] Enlaces de producto encontrados: {len(enlaces)}")

    for a in enlaces:
        try:
            link = a['href'].strip()
            if link.startswith('//'):
                link = 'https:' + link

            imagen_tag = a.find('img', class_='product-img')
            imagen = 'https:' + imagen_tag['src'].strip() if imagen_tag and imagen_tag.get('src') else ''

            titulo_tag = a.find('h3', class_='yB6en')
            titulo = titulo_tag.get_text(strip=True) if titulo_tag else ''

            precio_tag = a.find('div', class_='_3Mpbo')
            if precio_tag:
                partes = precio_tag.find_all('span')
                precio_texto = ''.join(p.get_text(strip=True) for p in partes)
                precio = limpiar_precio(precio_texto)
            else:
                precio = None

            if titulo and imagen and precio is not None and link:
                productos.append({
                    'titulo': titulo,
                    'imagen': imagen,
                    'precio': precio,
                    'link': link
                })
                print(f"[PRODUCTO] {titulo} | {precio} € | {imagen} | {link}")
        except Exception as e:
            print(f"[!] Error al procesar producto: {e}", file=sys.stderr)

    return productos

# Guardar en base de datos evitando duplicados por título y link
def guardar_en_db(productos):
    guardados = []
    errores = 0

    try:
        print("[DEBUG] Conectando a la base de datos...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Evitar duplicados por título + link
        consulta_existencia = "SELECT id FROM temporary_products WHERE title = %s AND link = %s"

        query_insert = """
        INSERT INTO temporary_products 
        (title, price, image_url, link, seo_title, seo_description, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
        """

        for p in productos:
            try:
                cursor.execute(consulta_existencia, (p['titulo'], p['link']))
                if cursor.fetchone():
                    print(f"[SKIP] Ya existe: {p['titulo']}")
                    continue

                cursor.execute(query_insert, (
                    p['titulo'],
                    p['precio'],
                    p['imagen'],
                    p['link'],
                    '',  # seo_title
                    ''   # seo_description
                ))
                guardados.append(p)
            except Error as e:
                errores += 1
                print(f"[ERROR] No se pudo insertar '{p['titulo']}': {e}", file=sys.stderr)

        conn.commit()
        cursor.close()
        conn.close()
    except Error as e:
        print(f"[ERROR] Conexión MySQL fallida: {e}", file=sys.stderr)

    print(f"[RESUMEN] Total intentados: {len(productos)}, guardados: {len(guardados)}, errores: {errores}")
    return guardados

# Crear log HTML
def crear_html_log(productos):
    logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage", "app", "logs"))
    os.makedirs(logs_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    ruta = os.path.join(logs_dir, f"productos_guardados_{timestamp}.html")

    with open(ruta, "w", encoding="utf-8") as f:
        f.write("<html><head><meta charset='utf-8'><title>Productos Guardados</title></head><body>")
        f.write("<h2>Productos procesados:</h2>")
        for p in productos:
            f.write("<div style='margin-bottom:20px;'>")
            f.write(f"<a href='{p['link']}' target='_blank'><img src='{p['imagen']}' width='150'></a><br>")
            f.write(f"<strong>{p['titulo']}</strong><br>")
            f.write(f"Precio: {p['precio']} €<br>")
            f.write(f"<a href='{p['link']}' target='_blank'>{p['link']}</a>")
            f.write("</div>")
        f.write("</body></html>")

    print(f"[OK] HTML generado: {ruta}")

# Main
def main():
    if len(sys.argv) < 2:
        print("[ERROR] Debes proporcionar el archivo HTML como argumento.", file=sys.stderr)
        return

    html_path = sys.argv[1]
    if not os.path.exists(html_path):
        print(f"[ERROR] Archivo no encontrado: {html_path}", file=sys.stderr)
        return

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    print(f"[INFO] Archivo leído: {len(html)} caracteres")

    productos = extraer_datos(html)
    print(f"[INFO] Productos encontrados: {len(productos)}")

    if not productos:
        print("[⚠️] No se encontraron productos válidos.")
        return

    guardados = guardar_en_db(productos)
    crear_html_log(guardados)

if __name__ == "__main__":
    main()
