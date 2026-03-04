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

# Rutas absolutas al entorno embebido (stdlib + site-packages)
cwd = os.getcwd()
python_home = os.path.join(cwd, "python_embed")
candidate_paths = [
    os.path.join(python_home, "Lib"),
    os.path.join(python_home, "Lib", "site-packages"),
    os.path.join(python_home, "site-packages"),
]

for p in candidate_paths:
    if os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

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

print("\n[INFO] Prueba de conexión MySQL (opcional)")
if os.getenv("VERIFY_ENV_MYSQL") == "1":
    print("[INFO] Probando conexión MySQL a 127.0.0.1:3306...")
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv("VERIFY_ENV_MYSQL_HOST", "127.0.0.1"),
            port=int(os.getenv("VERIFY_ENV_MYSQL_PORT", "3306")),
            user=os.getenv("VERIFY_ENV_MYSQL_USER", "root"),
            password=os.getenv("VERIFY_ENV_MYSQL_PASSWORD", ""),
            database=os.getenv("VERIFY_ENV_MYSQL_DATABASE", "webpage_db"),
        )
        if conn.is_connected():
            safe_print("[OK] Conexión MySQL:", "exitosa")
            conn.close()
        else:
            print("[ERROR] Conexión MySQL: fallida")
    except Exception as e:
        print("[ERROR] Conexión MySQL:", e)
else:
    print("[INFO] VERIFY_ENV_MYSQL!=1; se omite la prueba de conexión.")

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
