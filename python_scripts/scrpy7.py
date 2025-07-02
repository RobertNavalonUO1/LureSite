import re
from bs4 import BeautifulSoup

# Función para limpiar el texto y eliminar caracteres no imprimibles
def limpiar_texto(texto):
    texto = re.sub(r'[^\x00-\x7F]+', '', texto)
    return texto.strip()

def extraer_datos(texto_html):
    soup = BeautifulSoup(texto_html, 'html.parser')
    
    producto = {}  # Diccionario para almacenar los datos del producto

    # Extraer el título del producto
    titulo_tag = soup.find('h1', {'data-pl': 'product-title'})
    if titulo_tag:
        producto['titulo'] = limpiar_texto(titulo_tag.get_text())

    # Extraer el precio actual
    precio_actual_tag = soup.find('span', class_='price--currentPriceText--V8_y_b5')
    if precio_actual_tag:
        producto['precio_actual'] = limpiar_texto(precio_actual_tag.get_text())

    # Extraer el precio original
    precio_original_tag = soup.find('span', class_='price--originalText--gxVO5_d')
    if precio_original_tag:
        producto['precio_original'] = limpiar_texto(precio_original_tag.get_text())

    # Extraer el descuento
    descuento_tag = soup.find('span', class_='price--discount--Y9uG2LK')
    if descuento_tag:
        producto['descuento'] = limpiar_texto(descuento_tag.get_text())

    # Extraer la valoración del producto
    valoracion_tag = soup.find('strong')
    if valoracion_tag:
        producto['valoracion'] = limpiar_texto(valoracion_tag.get_text())

    # Extraer el número de valoraciones
    valoraciones_tag = soup.find('a', class_='reviewer--reviews--cx7Zs_V')
    if valoraciones_tag:
        producto['valoraciones'] = limpiar_texto(valoraciones_tag.get_text())

    # Extraer el número de vendidos
    vendidos_tag = soup.find('span', class_='reviewer--sold--ytPeoEy')
    if vendidos_tag:
        producto['vendidos'] = limpiar_texto(vendidos_tag.get_text())

    # Extraer los colores disponibles y si están agotados
    colores = []
    imagenes = []
    for color_tag in soup.find_all('div', class_='sku-item--image--jMUnnGA'):
        clases = color_tag.get('class', [])
        color = color_tag.get('alt')
        agotado = 'sku-item--soldOut--YJfuCGq' in clases
        img_tag = color_tag.find('img', src=True)
        imagen = img_tag['src'] if img_tag and not agotado else ''
        if color and not any(c['nombre'] == color for c in colores):  # Evitar duplicados
            colores.append({'nombre': color, 'agotado': agotado, 'imagen': imagen})
        if imagen:
            imagenes.append(imagen)
    
    producto['colores'] = colores
    producto['imagenes'] = imagenes
    
    return producto

# Función para guardar los datos en un archivo HTML
def guardar_datos_en_html(datos):
    ruta = r'D:\xamppp\htdocs\\'  # Ruta donde se guardarán los archivos
    archivo_html = ruta + 'producto_detalle.html'

    with open(archivo_html, 'w', encoding='utf-8') as file:
        file.write("<!DOCTYPE html>\n")
        file.write("<html lang='es'>\n")
        file.write("<head>\n")
        file.write("<meta charset='UTF-8'>\n")
        file.write("<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n")
        file.write("<title>Detalle del Producto</title>\n")
        file.write("<style>\n")
        file.write("""
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
            }
            .imagenes {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 20px;
            }
            .imagenes img {
                width: 150px;
                height: auto;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 5px;
            }
            .detalles {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            .detalle {
                background: #f1f1f1;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }
            .detalle .titulo {
                font-size: 16px;
                color: #555;
                margin-bottom: 10px;
            }
            .detalle .valor {
                font-size: 18px;
                color: #333;
                font-weight: bold;
            }
            .colores {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 20px;
            }
            .color {
                background: #e0e0e0;
                padding: 10px;
                border-radius: 8px;
                font-size: 14px;
                color: #333;
            }
        """)
        file.write("</style>\n")
        file.write("</head>\n")
        file.write("<body>\n")
        file.write("<div class='container'>\n")
        
        # Mostrar el título del producto
        file.write(f"<h1>{datos['titulo']}</h1>\n")
        
        # Mostrar las imágenes del producto
        file.write("<div class='imagenes'>\n")
        for imagen in datos['imagenes']:
            file.write(f"<img src='{imagen}' alt='Imagen del producto' />\n")
        file.write("</div>\n")
        
        # Mostrar los detalles del producto (precios, descuento, valoración, etc.)
        file.write("<div class='detalles'>\n")
        file.write("<div class='detalle'>\n")
        file.write("<div class='titulo'>Precio Actual</div>\n")
        file.write(f"<div class='valor'>{datos['precio_actual']}</div>\n")
        file.write("</div>\n")
        file.write("<div class='detalle'>\n")
        file.write("<div class='titulo'>Precio Original</div>\n")
        file.write(f"<div class='valor'>{datos['precio_original']}</div>\n")
        file.write("</div>\n")
        file.write("<div class='detalle'>\n")
        file.write("<div class='titulo'>Descuento</div>\n")
        file.write(f"<div class='valor'>{datos['descuento']}</div>\n")
        file.write("</div>\n")
        file.write("<div class='detalle'>\n")
        file.write("<div class='titulo'>Valoración</div>\n")
        file.write(f"<div class='valor'>{datos['valoracion']}</div>\n")
        file.write("</div>\n")
        file.write("<div class='detalle'>\n")
        file.write("<div class='titulo'>Valoraciones</div>\n")
        file.write(f"<div class='valor'>{datos['valoraciones']}</div>\n")
        file.write("</div>\n")
        file.write("<div class='detalle'>\n")
        file.write("<div class='titulo'>Vendidos</div>\n")
        file.write(f"<div class='valor'>{datos['vendidos']}</div>\n")
        file.write("</div>\n")
        file.write("</div>\n")
        
        # Mostrar los colores disponibles
        file.write("<div class='colores'>\n")
        for color in datos['colores']:
            file.write(f"<div class='color'>{color}</div>\n")
        file.write("</div>\n")
        
        file.write("</div>\n")  # Cierre del contenedor
        file.write("</body>\n")
        file.write("</html>\n")
    print(f"Datos guardados en '{archivo_html}'.")

# Función principal para ejecutar el proceso
def main():
    texto_html = input("Introduce el texto HTML del producto: ")
    datos_extraidos = extraer_datos(texto_html)
    if datos_extraidos:
        guardar_datos_en_html(datos_extraidos)
    else:
        print("No se pudieron extraer los datos.")

if __name__ == "__main__":
    main()