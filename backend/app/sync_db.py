from sqlalchemy import text
from database import SessionLocal, engine

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
            
        # 2. Agregar columnas a 'usuarios' (UsuarioDashboard)
        print("Agregando columnas 'telefono' y 'cedula' a la tabla 'usuarios'...")
        try:
            db.execute(text("ALTER TABLE usuarios ADD COLUMN telefono VARCHAR"))
            print("Columna 'telefono' agregada.")
        except Exception as e:
            print(f"Nota: 'telefono' ya existe o hubo error: {e}")
            db.rollback()

        try:
            db.execute(text("ALTER TABLE usuarios ADD COLUMN cedula VARCHAR"))
            print("Columna 'cedula' agregada.")
        except Exception as e:
            print(f"Nota: 'cedula' ya existe o hubo error: {e}")
            db.rollback()

        # 3. Crear tabla de asociación conductor_vehiculo si no existe
        print("Creando tabla de asociación 'conductor_vehiculo'...")
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS conductor_vehiculo (
                    conductor_id INTEGER REFERENCES drivers(id),
                    vehiculo_id INTEGER REFERENCES vehiculos(id),
                    PRIMARY KEY (conductor_id, vehiculo_id)
                )
            """))
            print("Tabla 'conductor_vehiculo' verificada/creada.")
        except Exception as e:
            print(f"Error al crear tabla conductor_vehiculo: {e}")
            db.rollback()
        
        db.commit()
        print("Sincronización manual completada exitosamente.")
    except Exception as e:
        print(f"Error crítico durante la sincronización: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync()
