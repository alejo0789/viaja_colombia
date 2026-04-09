import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL no encontrada.")
    exit(1)

print(f"Probando conexión a: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tablas encontradas: {tables}")
    
    if "usuarios" in tables:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, email, rol FROM usuarios"))
            rows = result.fetchall()
            print(f"Usuarios en la tabla: {rows}")
            if not rows:
                print("⚠️ La tabla 'usuarios' está VACÍA.")
    else:
        print("❌ La tabla 'usuarios' NO existe.")

except Exception as e:
    print(f"Error conectando o consultando: {e}")
