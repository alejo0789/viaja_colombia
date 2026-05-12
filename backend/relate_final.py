from app.database import SessionLocal
from app import models

# Listado final consolidado del usuario
final_data = [
    ("19480188", "WLK776"),
    ("4284853", "FRR443"),
    ("1022387484", "PUM541"),
    ("93355715", "GEU172"),
    ("3100079", "KOL863"),
    ("80920665", "LJT353"),
    ("80920665", "NWO205"),
    ("80920665", "WDR918"),
    ("1013629838", "LZM122"),
    ("1006701509", "JOU599"),
    ("79424584", "JOX149"),
    ("84453973", "WNS666"),
    ("12195427", "JTQ739"),
    ("79879769", "WCX672"),
    ("80023220", "KOK707"),
    ("1127357297", "LGL639"),
    ("79758905", "LLR491"),
    ("1020719060", "PMW859"),
    ("1121942065", "WNS142"),
    ("79424584", "LCN408"),
    ("17648843", "LCN896"),
    ("80268718", "LLO884"),
    ("79685755", "LZO673"),
    ("1077087154", "LUM120"),
    ("80067078", "WNY201"),
    ("79459089", "KNL020"),
    ("19156008", "PRZ003"),
]

def final_relate():
    db = SessionLocal()
    count = 0
    
    for cc, placa in final_data:
        conductor = db.query(models.Conductor).filter(models.Conductor.cedula == cc).first()
        vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa.upper()).first()
        
        if conductor and vehiculo:
            if vehiculo not in conductor.vehiculos:
                conductor.vehiculos.append(vehiculo)
                count += 1
                
    db.commit()
    db.close()
    print(f"Relaciones finales establecidas: {count}")

if __name__ == "__main__":
    final_relate()
