import os
from sqlalchemy import text
from app.database import engine

def update_db():
    print("Conectando a la base de datos para actualizar esquema...")
    with engine.connect() as connection:
        try:
            print("Añadiendo columna reset_token...")
            connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token VARCHAR"))
            print("Añadiendo columna reset_token_expires...")
            connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE"))
            connection.commit()
            print("Base de datos actualizada con exito.")
        except Exception as e:
            print(f"Error al actualizar: {e}")

if __name__ == "__main__":
    update_db()
