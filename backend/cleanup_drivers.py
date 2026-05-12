from app.database import SessionLocal
from app import models

db = SessionLocal()
# Eliminar conductores que no tienen teléfono (fueron insertados por error en la carga anterior)
deleted = db.query(models.Conductor).filter(models.Conductor.telefono == None).delete()
db.commit()
db.close()
print(f"Se eliminaron {deleted} conductores sin teléfono.")
