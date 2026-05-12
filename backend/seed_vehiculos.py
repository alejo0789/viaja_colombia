from app.database import SessionLocal
from app import models

def seed_vehiculos():
    db = SessionLocal()
    
    vehiculos_data = [
        {
            "placa": "QLR094",
            "modelo": "2026",
            "marca": "TOYOTA",
            "tipo_vehiculo": "CAMIONETA PLATON",
            "ciudad": "BOGOTA",
            "propietario": "VIAJA COLOMBIA SAS",
            "cedula_propietario": "804017786",
            "fecha_matricula": "3/01/2026",
            "soat_vencimiento": "30-dic/2026",
            "tecnomecanica_vencimiento": "N/A",
            "polizas_vencimiento": "28-feb/2027",
            "todo_riesgo_vencimiento": "20-abr/2027",
            "tarjeta_operacion_vencimiento": "08-ene/2028",
            "empresa_afiliada": "EMPRESA DE TRANSPORTES GRUPO ARANSUA SAS"
        }
    ]
    
    count = 0
    updated = 0
    
    for data in vehiculos_data:
        placa = data["placa"].upper()
        existing = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa).first()
        
        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
            updated += 1
        else:
            new_v = models.Vehiculo(**data)
            db.add(new_v)
            count += 1
            
    db.commit()
    db.close()
    print(f"Vehículos: {count} creados, {updated} actualizados.")

if __name__ == "__main__":
    seed_vehiculos()
