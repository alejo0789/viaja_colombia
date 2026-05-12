from app.database import SessionLocal
from app import models

db = SessionLocal()
conductores = db.query(models.Conductor).all()
print(f"Total conductores: {len(conductores)}")
print("-" * 50)
for c in conductores:
    print(f"ID: {c.id} | Nombre: {c.nombre} | Tel: {c.telefono} | CC: {c.cedula}")
db.close()
