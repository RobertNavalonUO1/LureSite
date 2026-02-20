import sys
import io
import ctypes
import os

# ==============================================
# 🔧 CONFIGURACIÓN DEL ENTORNO EMBEBIDO
# ==============================================

# Forzar salida en UTF-8 (para que no se vean caracteres raros en consola o web)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Ruta absoluta al entorno embebido
embed_path = os.path.join(os.getcwd(), "python_embed", "Lib", "site-packages")

# Insertar en sys.path si no existe
if embed_path not in sys.path:
    sys.path.insert(0, embed_path)

# ==============================================
# 🧱 DEPENDENCIAS DEL SISTEMA
# ==============================================

# Forzar carga de la librería de red (WinSock en Windows)
try:
    ctypes.WinDLL("ws2_32.dll")
except Exception as e:
    print("[ERROR] No se pudo cargar ws2_32.dll:", e)

def safe_print(label, result):
    """Imprime mensajes manejando errores de codificación."""
    try:
        print(f"{label} {result}")
    except Exception:
        print(f"{label} (OK)")

print("[INFO] Verificando entorno Python embebido...\n")

# ==============================================
# 🧩 VERIFICAR MÓDULOS NECESARIOS
# ==============================================

# mysql.connector
try:
    import mysql.connector
    safe_print("[OK] mysql.connector:", "disponible")
except Exception as e:
    print("[ERROR] mysql.connector:", e)

# BeautifulSoup (bs4)
try:
    from bs4 import BeautifulSoup
    safe_print("[OK] BeautifulSoup:", "disponible")
except Exception as e:
    print("[ERROR] BeautifulSoup:", e)

# ==============================================
# 🧪 PRUEBA DE CONEXIÓN MYSQL
# ==============================================

print("\n[INFO] Probando conexión MySQL a 127.0.0.1:3306...")

try:
    import mysql.connector
    conn = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",         # <-- cambia si tu usuario MySQL es distinto
        password="",         # <-- agrega contraseña si aplica
        database="webpage_db"  # <-- cambia al nombre correcto de tu base de datos
    )
    if conn.is_connected():
        safe_print("[OK] Conexión MySQL:", "exitosa")
        conn.close()
    else:
        print("[ERROR] Conexión MySQL: fallida")
except Exception as e:
    print("[ERROR] Conexión MySQL:", e)

# ==============================================
# 🧠 INFORMACIÓN DEL ENTORNO
# ==============================================

print(f"\n[INFO] Ruta del ejecutable de Python: {sys.executable}")
print(f"[INFO] Directorio actual: {os.getcwd()}")
print(f"[INFO] Usuario activo: {os.getenv('USERNAME') or os.getenv('USER')}")
print("[INFO] Variables relevantes del entorno:")

for key in ["PATHEXT", "SESSION_PATH", "AWS_USE_PATH_STYLE_ENDPOINT"]:
    print(f"  {key}={os.getenv(key)}")

# ==============================================
# 📋 EXTRA OPCIONAL: Mostrar sys.path (depuración)
# ==============================================
print("\n[DEBUG] Rutas de búsqueda de módulos (sys.path):")
for p in sys.path:
    print("  -", p)
