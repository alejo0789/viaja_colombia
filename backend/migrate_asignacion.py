"""
Migración: Agrega columnas para asignación + crea tabla vehiculos.
Ejecutar una vez: python migrate_asignacion.py
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()

# Usar SQLAlchemy para crear la tabla nueva (vehiculos) si no existe
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from app import models

print("Creando tablas nuevas (si no existen)...")
models.Base.metadata.create_all(bind=engine)
print("[OK] Tablas sincronizadas via SQLAlchemy")

# Columnas adicionales en tablas existentes (ALTER TABLE IF NOT EXISTS)
import psycopg2, re

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/viajacolombia")

# Parsear la URL manualmente para psycopg2
# Formato: postgresql://user:password@host:port/dbname
import re
match = re.match(
    r'postgresql(?:\+\w+)?://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)',
    DATABASE_URL
)
if not match:
    # Try without port
    match2 = re.match(
        r'postgresql(?:\+\w+)?://([^:]+):([^@]+)@([^/]+)/([^?]+)',
        DATABASE_URL
    )
    if match2:
        user, password, host, dbname = match2.groups()
        port = "5432"
    else:
        raise ValueError(f"No se pudo parsear DATABASE_URL: {DATABASE_URL}")
else:
    user, password, host, port, dbname = match.groups()


conn = psycopg2.connect(
    host=host,
    port=int(port),
    dbname=dbname,
    user=user,
    password=password,
    sslmode="require",
)
conn.autocommit = True
cur = conn.cursor()

migrations = [
    # Cambiar hora_programada a texto para soportar lenguaje natural (ej: "Hoy a las 4pm")
    ("services", "hora_programada", "ALTER TABLE services ALTER COLUMN hora_programada TYPE VARCHAR USING hora_programada::varchar;"),
    # services: campo para el vehículo asignado en texto legible
    ("services", "vehiculo_asignado", "ALTER TABLE services ADD COLUMN IF NOT EXISTS vehiculo_asignado VARCHAR;"),
    # services: código de verificación de 6 dígitos
    ("services", "codigo_verificacion", "ALTER TABLE services ADD COLUMN IF NOT EXISTS codigo_verificacion VARCHAR;"),
    # drivers: número WhatsApp para notificaciones
    ("drivers", "whatsapp", "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS whatsapp VARCHAR;"),
]

for table, column, stmt in migrations:
    try:
        cur.execute(stmt)
        print(f"[OK] {table}.{column}")
    except Exception as e:
        print(f"[ERROR] {table}.{column}: {e}")

cur.close()
conn.close()
print("\n[DONE] Migracion completada.")
