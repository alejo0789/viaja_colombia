from app.database import SessionLocal
from app import models

# Mapeo de corrección de C.C. (DB -> Listado Maestro)
cc_updates = {
    "19450188": "19480188",
    "4204053": "4284853",
    "80020665": "80920665",
    "1000701509": "1006701509",
    "52278482": "52276482", # Marisol Vargas
}

# Listado maestro de C.C. autorizadas
valid_cc = {
    "19480188", "4284853", "1022387484", "93355715", "3100079", "80920665",
    "1013629838", "1006701509", "79424584", "84453973", "12195427", "79879769",
    "80023220", "1127357297", "79758905", "1020719060", "1121942065", "17648843",
    "80268718", "79685755", "1077087154", "80067078", "79459089", "19156008",
    "52276482", "80111327", "3222185894", "3214697148", "3114120490" # Agregando algunos que podrían estar por nombre
}

def cleanup_drivers():
    db = SessionLocal()
    
    # 1. Actualizar C.C. incorrectas
    all_d = db.query(models.Conductor).all()
    for d in all_d:
        if d.cedula in cc_updates:
            print(f"Actualizando CC de {d.nombre}: {d.cedula} -> {cc_updates[d.cedula]}")
            d.cedula = cc_updates[d.cedula]
    
    db.commit()
    
    # 2. Eliminar conductores no autorizados
    # Re-obtener lista después de actualizaciones
    all_d = db.query(models.Conductor).all()
    deleted_d = 0
    for d in all_d:
        if d.cedula not in valid_cc:
            # Si el CC no está en la lista, lo eliminamos
            # Pero ojo: algunos podrían no tener CC pero sí nombre. 
            # El usuario dijo "estas son todas las cedulas", así que si no tiene CC o no está en lista, fuera.
            db.delete(d)
            deleted_d += 1
            
    db.commit()
    print(f"Conductores eliminados: {deleted_d}")
    
    # 3. Listar restantes
    remaining_d = db.query(models.Conductor).all()
    print(f"Conductores restantes ({len(remaining_d)}): {[d.nombre for d in remaining_d]}")
    
    db.close()

if __name__ == "__main__":
    cleanup_drivers()
