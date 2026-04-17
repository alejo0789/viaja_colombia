import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://")
engine = create_engine(database_url)

with engine.connect() as conn:
    # 1. Buscar usuario
    user = conn.execute(text("SELECT id, nombre, empresa_id FROM users WHERE whatsapp LIKE '%3153404327%'")).fetchone()
    if user:
        print(f"User found: {user.nombre} (ID: {user.id}, Empresa ID: {user.empresa_id})")
        empresa_id = user.empresa_id
        
        # 2. Buscar supervisores de esa empresa
        supervisors = conn.execute(text("SELECT id, nombre, area, activo FROM supervisors WHERE empresa_id = :eid"), {"eid": empresa_id}).fetchall()
        print(f"\nSupervisors for Empresa {empresa_id}:")
        for s in supervisors:
            print(f"- {s.nombre} (Area: {s.area}, Activo: {s.activo})")
    else:
        print("User not found")
