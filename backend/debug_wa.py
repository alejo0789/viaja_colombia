import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://")
engine = create_engine(database_url)

with engine.connect() as conn:
    # Buscar supervisores de la empresa 1 con sus telefonos
    supervisors = conn.execute(text("SELECT id, nombre, whatsapp, area, activo FROM supervisors WHERE empresa_id = 1")).fetchall()
    print(f"Supervisors for Empresa 1:")
    for s in supervisors:
        print(f"- {s.nombre} (WA: {s.whatsapp}, Area: {s.area}, Activo: {s.activo})")
