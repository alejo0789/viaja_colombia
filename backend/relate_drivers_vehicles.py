from app.database import SessionLocal
from app import models

associations = [
    ("79424584", "JQX149"),
    ("1121942065", "WNS142"),
    ("84453973", "WNO866"),
    ("12195427", "JTQ739"),
    ("79879769", "WCX872"),
    ("80023220", "KOK707"),
    ("17648843", "LCN596"),
    ("1127357297", "LGL639"),
    ("80268718", "LLQ684"),
    ("79758905", "LLR491"),
    ("1020719060", "PMW859"),
    ("19156008", "PRZ003"),
]

def relate():
    db = SessionLocal()
    count = 0
    errors = []
    
    for cc, placa in associations:
        conductor = db.query(models.Conductor).filter(models.Conductor.cedula == cc).first()
        vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa).first()
        
        if not conductor:
            errors.append(f"Conductor con CC {cc} no encontrado")
            continue
        if not vehiculo:
            errors.append(f"Vehículo con placa {placa} no encontrado")
            continue
            
        # Relacionar si no están ya relacionados
        if vehiculo not in conductor.vehiculos:
            conductor.vehiculos.append(vehiculo)
            count += 1
            
    db.commit()
    db.close()
    
    print(f"Relaciones creadas: {count}")
    if errors:
        print("Errores:")
        for err in errors:
            print(f"- {err}")

if __name__ == "__main__":
    relate()
