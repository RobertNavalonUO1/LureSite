import sys
import io
import mysql.connector
import ctypes
import os

# Forzar carga de WinSock
try:
    ctypes.WinDLL("ws2_32.dll")
except Exception as e:
    print("[ERROR] No se pudo cargar ws2_32.dll:", e)

# Forzar salida en UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def safe_print(label, result):
    try:
        print(f"{label} {result}")
    except Exception:
        print(f"{label} (OK)")

print("[INFO] Verificando entorno Python embebido...\n")

# Verificar módulos
try:
    import mysql.connector
    safe_print("[OK] mysql.connector:", "disponible")
except Exception as e:
    print("[ERROR] mysql.connector:", e)

try:
    from bs4 import BeautifulSoup
    safe_print("[OK] BeautifulSoup:", "disponible")
except Exception as e:
    print("[ERROR] BeautifulSoup:", e)

print("\n[INFO] Probando conexión MySQL a 127.0.0.1:3306...")

# Verificar conexión a la base de datos
try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="",
        database="webpage_db"
    )
    if conn.is_connected():
        safe_print("[OK] Conexión MySQL:", "exitosa")
        conn.close()
    else:
        print("[ERROR] Conexión MySQL: fallida")
except Exception as e:
    print("[ERROR] Conexión MySQL:", e)

print(f"\n[INFO] Ruta del ejecutable de Python: {sys.executable}")
print(f"[INFO] Usuario activo: {os.getenv('USERNAME') or os.getenv('USER')}")
print("[INFO] Variables relevantes del entorno:")
for key in ["PATHEXT", "SESSION_PATH", "AWS_USE_PATH_STYLE_ENDPOINT"]:
    print(f"  {key}={os.getenv(key)}")
