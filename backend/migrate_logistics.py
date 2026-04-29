"""
Migración: Agregar columnas de logística/transporte de materiales a la tabla services.
Ejecutar UNA sola vez: python migrate_logistics.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    """
    ALTER TABLE services
    ADD COLUMN IF NOT EXISTS tipo_servicio VARCHAR DEFAULT 'PASAJERO';
    """,
    """
    ALTER TABLE services
    ADD COLUMN IF NOT EXISTS descripcion_material TEXT;
    """,
    """
    ALTER TABLE services
    ADD COLUMN IF NOT EXISTS fotos_inicio JSON;
    """,
    """
    ALTER TABLE services
    ADD COLUMN IF NOT EXISTS fotos_fin JSON;
    """,
]

def run():
    with engine.connect() as conn:
        for sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"[OK]: {sql.strip()[:60]}")
            except Exception as e:
                print(f"[WARN]: {e}")

if __name__ == "__main__":
    run()
    print("\nMigracion de logistica completada.")
