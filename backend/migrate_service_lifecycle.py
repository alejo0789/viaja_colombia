from sqlalchemy import text
import os
from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("Migrando base de datos...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN cedula VARCHAR;"))
            print("Columna 'cedula' añadida a 'users'")
        except Exception as e:
            print(f"Error añadiendo columna 'cedula': {e}")

        try:
            conn.execute(text("ALTER TABLE services ADD COLUMN hora_inicio TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE services ADD COLUMN hora_fin TIMESTAMP WITH TIME ZONE;"))
            print("Columnas 'hora_inicio' y 'hora_fin' añadidas a 'services'")
        except Exception as e:
            print(f"Error añadiendo columnas de tiempo: {e}")
            
        conn.commit()
    print("Migración completada.")

if __name__ == "__main__":
    migrate()
