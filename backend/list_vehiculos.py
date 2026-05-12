from app.database import SessionLocal
from app import models

db = SessionLocal()
vehiculos = db.query(models.Vehiculo).all()
print(f"Total vehículos: {len(vehiculos)}")
print("-" * 50)
for v in vehiculos:
    print(f"ID: {v.id} | Placa: {v.placa} | Marca: {v.marca}")
db.close()
