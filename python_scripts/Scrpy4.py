import re
from bs4 import BeautifulSoup

def limpiar_texto(texto):
    texto = re.sub(r'[^\x00-\x7F]+', '', texto)
    return texto.strip()

def extraer_datos(texto_html):
    soup = BeautifulSoup(texto_html, 'html.parser')
    productos = []

    # Recorre todos los productos dentro de su contenedor
    contenedores = soup.find_all('div', class_='_2FypS')

    for contenedor in contenedores:
        try:
            producto = {}

            # 🔗 Link del producto
            enlace = contenedor.find('a', class_='_3mPKP')
            if enlace and enlace.get('href'):
                producto['link'] = 'https:' + enlace['href']

            # 🖼 Imagen
            img_tag = contenedor.find('img', class_='_2EGeS')
            if img_tag and img_tag.get('src'):
                producto['imagen'] = 'https:' + img_tag['src']
            else:
                producto['imagen'] = ''

            # 🏷 Título
            titulo_tag = contenedor.find('h3', class_='yB6en')
            if titulo_tag:
                producto['titulo'] = limpiar_texto(titulo_tag.get_text())
            else:
                producto['titulo'] = 'Sin título'

            # 💰 Precio
            precio_div = contenedor.find('div', class_='_3Mpbo')
            if precio_div:
                precio = ''.join(span.get_text() for span in precio_div.find_all('span'))
                producto['precio'] = limpiar_texto(precio.replace('€', '').replace(',', '.'))

            # 💸 Precio tachado (opcional)
            precio_tachado = contenedor.find('div', class_='_3DRNh')
            if precio_tachado:
                producto['precio_original'] = limpiar_texto(precio_tachado.get_text())
            else:
                producto['precio_original'] = ''

            # ⭐ Valoración (ej: 4.8)
            rating_span = contenedor.find('span', class_='_2L2Tc')
            producto['valoracion'] = rating_span.get_text().strip() if rating_span else ''

            # 🔢 Ventas
            vendidos_span = contenedor.find('span', class_='DUuR2')
            producto['vendidos'] = vendidos_span.get_text().strip() if vendidos_span else ''

            productos.append(producto)

        except Exception as e:
            print(f"Error procesando producto: {e}")
            continue

    return productos

def guardar_datos_en_html(datos):
    ruta = r'D:\xampp\htdocs\\'
    archivo_html = ruta + 'productos_nuevos.html'

    with open(archivo_html, 'w', encoding='utf-8') as file:
        file.write("<html><head><meta charset='utf-8'><title>Productos Extraídos</title></head><body>")
        for producto in datos:
            file.write("<div style='margin-bottom: 20px;'>")
            file.write(f"<img src='{producto['imagen']}' width='150'><br>")
            file.write(f"<strong>{producto['titulo']}</strong><br>")
            file.write(f"Precio: {producto['precio']} €<br>")
            if producto.get('precio_original'):
                file.write(f"<span style='text-decoration:line-through;color:gray;'>{producto['precio_original']}</span><br>")
            if producto.get('valoracion'):
                file.write(f"Valoración: {producto['valoracion']}<br>")
            if producto.get('vendidos'):
                file.write(f"Vendidos: {producto['vendidos']}<br>")
            if producto.get('link'):
                file.write(f"<a href='{producto['link']}'>Ver producto</a><br>")
            file.write("</div>")
        file.write("</body></html>")

    print(f"Guardado en {archivo_html}")

def main():
    html = input("Introduce el HTML copiado del navegador:\n")
    datos = extraer_datos(html)
    if datos:
        guardar_datos_en_html(datos)
    else:
        print("No se encontraron productos.")

if __name__ == "__main__":
    main()
