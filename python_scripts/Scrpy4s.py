import re
import mysql.connector
from bs4 import BeautifulSoup

# Configuración de la base de datos MySQL
DB_CONFIG = {
    "host": "localhost",
    "user": "root",  # Cambia si es necesario
    "password": "",  # Agrega la contraseña si tienes
    "database": "webpage_db"
}

# Limpieza de precios
def limpiar_precio(precio):
    precio = precio.replace('€', '').replace(',', '.').strip()
    try:
        return float(precio)
    except ValueError:
        return None

# Extraer productos del nuevo HTML generado
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
            print(f"Error al procesar un bloque: {e}")
            continue

    return productos

# Guardar en base de datos
def guardar_en_db(productos):
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
    print(f"Se guardaron {len(productos)} productos en la tabla temporal.")

# Función principal
def main():
    ruta = r"D:\xampp\htdocs\productos_nuevos.html"  # Ajusta si lo necesitas

    try:
        with open(ruta, "r", encoding="utf-8") as file:
            texto_html = file.read()
    except FileNotFoundError:
        print("⚠️ Archivo productos_nuevos.html no encontrado.")
        return

    datos = extraer_datos(texto_html)
    if datos:
        guardar_en_db(datos)
        print("✅ Productos cargados. Visita /select-products para verlos.")
    else:
        print("⚠️ No se encontraron productos para guardar.")

if __name__ == "__main__":
    main()
