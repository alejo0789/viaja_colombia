import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Import models
import sys
sys.path.append(os.getcwd())
from app import models

load_dotenv()

database_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://")
engine = create_engine(database_url)

with Session(engine) as db:
    # Simular logic
    phone = "3153404327"
    usuario = db.query(models.Usuario).filter(models.Usuario.whatsapp == phone).first()
    print(f"Usuario: {usuario.nombre}, Empresa ID: {usuario.empresa_id}")
    
    supervisores = db.query(models.Supervisor).filter(
        models.Supervisor.empresa_id == usuario.empresa_id,
        models.Supervisor.activo == True
    ).all()
    
    print(f"Count: {len(supervisores)}")
    for s in supervisores:
        print(f"- {s.nombre} (Area: {s.area})")
        
    if len(supervisores) > 1:
        print("RESULT: ASK FOR AREA")
    else:
        print("RESULT: NOTIFY DIRECTLY")
