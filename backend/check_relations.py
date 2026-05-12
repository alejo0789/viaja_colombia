from app.database import SessionLocal
from app import models

db = SessionLocal()
conductores = db.query(models.Conductor).all()
for d in conductores:
    if d.vehiculos:
        print(f"Conductor: {d.nombre} (CC: {d.cedula}) -> Vehículos: {[v.placa for v in d.vehiculos]}")
db.close()
