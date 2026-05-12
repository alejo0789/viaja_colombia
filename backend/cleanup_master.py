from app.database import SessionLocal
from app import models

# Listado maestro de placas autorizadas
valid_placas = {
    "WLK776", "FRR443", "PUM541", "GEU172", "KOL863", "LJT353", "NWO205",
    "WDR918", "LZM122", "JOU599", "JOX149", "WNS666", "JTQ739", "WCX672",
    "KOK707", "LGL639", "LLR491", "PMW859", "WNS142", "LCN408", "LCN896",
    "LLO884", "LZO673", "LUM120", "WNY201", "KNL020", "PRZ003"
}

def cleanup():
    db = SessionLocal()
    
    # 1. Eliminar vehículos no autorizados (duplicados, typos, etc.)
    all_v = db.query(models.Vehiculo).all()
    deleted_v = 0
    for v in all_v:
        if v.placa.upper() not in valid_placas:
            # Primero eliminamos sus relaciones en la tabla intermedia
            v.conductores = []
            db.delete(v)
            deleted_v += 1
            
    db.commit()
    print(f"Vehículos eliminados: {deleted_v}")
    
    # 2. Listar vehículos restantes para verificar
    remaining_v = db.query(models.Vehiculo).all()
    print(f"Vehículos en base de datos ({len(remaining_v)}): {[v.placa for v in remaining_v]}")
    
    db.close()

if __name__ == "__main__":
    cleanup()
