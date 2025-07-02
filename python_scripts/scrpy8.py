import sys
import re
import mysql.connector
from bs4 import BeautifulSoup

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "webpage_db"
}

def limpiar_precio(precio):
    precio = precio.replace('€', '').replace(',', '.').strip()
    try:
        return float(precio)
    except ValueError:
        return None

def extraer_datos(texto_html):
    soup = BeautifulSoup(texto_html, 'html.parser')
    productos = []

    bloques = soup.find_all('div', style=lambda value: value and 'margin-bottom: 20px' in value)

    for bloque in bloques:
        try:
            img = bloque.find('img')
            imagen = img['src'] if img and img.get('src') else ''
            titulo_tag = bloque.find('strong')
            titulo = titulo_tag.get_text(strip=True) if titulo_tag else ''
            precio_match = re.search(r"Precio: ([\d\.,]+)", bloque.get_text())
            precio = limpiar_precio(precio_match.group(1)) if precio_match else None

            if imagen and titulo and precio is not None:
                productos.append({
                    'titulo': titulo,
                    'imagen': imagen,
                    'precio': precio
                })
        except Exception as e:
            print(f"Error al procesar un bloque: {e}", file=sys.stderr)
            continue

    return productos

def guardar_en_db(productos):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        insert_query = """
        INSERT INTO temporary_products (title, price, image_url) VALUES (%s, %s, %s)
        """
        for producto in productos:
            cursor.execute(insert_query, (producto['titulo'], producto['precio'], producto['imagen']))
        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ Se guardaron {len(productos)} productos en la base de datos.")
    except Exception as db_error:
        print(f"❌ Error al guardar en DB: {db_error}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Ruta de archivo no proporcionada.", file=sys.stderr)
        sys.exit(1)

    ruta = sys.argv[1]
    try:
        with open(ruta, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception as e:
        print(f"❌ Error leyendo archivo: {e}", file=sys.stderr)
        sys.exit(1)

    datos = extraer_datos(html)
    if datos:
        guardar_en_db(datos)
    else:
        print("⚠️ No se encontraron productos.")
