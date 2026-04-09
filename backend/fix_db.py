from app.database import engine
from sqlalchemy import text

def update_schema():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo VARCHAR"))
            conn.commit()
            print("Esquema actualizado: 'email' en companies y 'cargo' en users.")
        except Exception as e:
            print(f"Error al actualizar la tabla: {e}")

if __name__ == "__main__":
    update_schema()
