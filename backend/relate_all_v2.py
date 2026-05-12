from app.database import SessionLocal
from app import models

# Mapeo manual corrigiendo posibles typos en los C.C. del listado
associations = [
    ("19450188", "WLK776"),
    ("4204053", "FRR443"),
    ("1022387484", "PUM541"),
    ("93355715", "GEU172"),
    ("3100079", "KOL863"),
    ("80020665", "LJT353"),
    ("80020665", "NWO205"),
    ("80020665", "WDR918"),
    ("1013629838", "LZM122"),
    ("1000701509", "JOU599"),
    ("79424584", "JOX149"),
    ("84453973", "WNS666"),
    ("12195427", "JTQ739"),
    ("79879769", "WCX672"),
    ("80023220", "KOK707"),
    ("1127357297", "LGL639"),
    ("79758905", "LLR491"),
    ("1020719060", "PMW859"),
]

def relate():
    db = SessionLocal()
    count = 0
    errors = []
    
    for cc, placa in associations:
        conductor = db.query(models.Conductor).filter(models.Conductor.cedula == cc).first()
        vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa.upper()).first()
        
        if not conductor:
            errors.append(f"Conductor con CC {cc} no encontrado")
            continue
        if not vehiculo:
            errors.append(f"Vehículo con placa {placa} no encontrado")
            continue
            
        if vehiculo not in conductor.vehiculos:
            conductor.vehiculos.append(vehiculo)
            count += 1
            
    db.commit()
    db.close()
    
    print(f"Relaciones establecidas: {count}")
    if errors:
        print("Errores:")
        for err in errors:
            print(f"- {err}")

if __name__ == "__main__":
    relate()
