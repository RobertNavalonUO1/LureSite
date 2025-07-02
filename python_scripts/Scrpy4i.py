import re
import mysql.connector
from bs4 import BeautifulSoup

# Configuración de la base de datos MySQL
DB_CONFIG = {
    "host": "localhost",
    "user": "root",  # Cambia si es necesario
    "password": "",  # Agrega la contraseña de MySQL si tienes
    "database": "webpage_db"
}

# Función para limpiar el precio y convertirlo en número
def limpiar_precio(precio):
    precio = precio.replace('€', '').replace(',', '.').strip()
    try:
        return float(precio)
    except ValueError:
        return None

# Función para extraer datos del HTML
def extraer_datos(texto_html):
    soup = BeautifulSoup(texto_html, 'html.parser')
    productos = []

    filas = soup.find_all('div', class_='fila')
    for fila in filas:
        try:
            imagen = fila.find('img').get('src')
            titulo = fila.find('span', class_='titulo').text.strip()
            precio = limpiar_precio(fila.find('span', class_='precio').text.strip())

            if imagen and titulo and precio:
                productos.append({'titulo': titulo, 'imagen': imagen, 'precio': precio})
        except AttributeError:
            continue  # Si hay un error en la extracción, pasa al siguiente producto

    return productos

# Función para guardar los datos en MySQL
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
    with open("productos_ordenados.html", "r", encoding="utf-8") as file:
        texto_html = file.read()

    datos_extraidos = extraer_datos(texto_html)
    if datos_extraidos:
        guardar_en_db(datos_extraidos)
        print("Datos guardados. Ahora visita '/migrate-products' en tu Laravel para migrarlos.")
    else:
        print("No se encontraron productos para guardar.")

if __name__ == "__main__":
    main()
