from app.database import SessionLocal
from app import models

placas_to_check = [
    "WLK776", "FRR443", "PUM541", "GEU172", "KOL863", "LJT353", "NWO205", 
    "WDR918", "LZM122", "JOU599", "JOX149", "WNS666", "JTQ739", "WCX672", 
    "KOK707", "LGL639", "LLR491", "PMW859"
]

def check():
    db = SessionLocal()
    print(f"{'PLACA':<10} | {'ESTADO':<15}")
    print("-" * 30)
    for p in placas_to_check:
        exists = db.query(models.Vehiculo).filter(models.Vehiculo.placa == p).first()
        status = "REGISTRADA" if exists else "NO ENCONTRADA"
        print(f"{p:<10} | {status:<15}")
    db.close()

if __name__ == "__main__":
    check()
