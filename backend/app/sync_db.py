import sys
import os
from sqlalchemy import text
from database import SessionLocal, engine
import models

def sync():
    db = SessionLocal()
    try:
        # 1. Agregar columnas a 'services'
        print("Agregando columnas 'observaciones' y 'precio' a la tabla 'services'...")
        try:
            db.execute(text("ALTER TABLE services ADD COLUMN observaciones VARCHAR"))
            print("Columna 'observaciones' agregada.")
        except Exception as e:
            print(f"Nota: 'observaciones' ya existe o hubo error: {e}")
            db.rollback()

        try:
            db.execute(text("ALTER TABLE services ADD COLUMN precio INTEGER DEFAULT 0"))
            print("Columna 'precio' agregada.")
        except Exception as e:
            print(f"Nota: 'precio' ya existe o hubo error: {e}")
            db.rollback()
            
        # 2. Eliminar columnas viejas de 'drivers' (opcional, pero limpio)
        # No las borramos por ahora por seguridad, pero el código ya no las usa.

        # 3. Crear tabla de asociación conductor_vehiculo si no existe
        print("Creando tabla de asociación 'conductor_vehiculo'...")
        models.Base.metadata.create_all(bind=engine)
        print("Tablas sincronizadas con Base.metadata.create_all")
        
        db.commit()
        print("Sincronización completada exitosamente.")
    except Exception as e:
        print(f"Error crítico durante la sincronización: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync()
