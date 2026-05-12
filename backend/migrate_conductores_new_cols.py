import os
from sqlalchemy import text
from app.database import engine

def migrate():
    print("Conectando a la base de datos para añadir nuevas columnas a 'drivers'...")
    new_columns = [
        ("cedula", "VARCHAR"),
        ("fecha_nacimiento", "VARCHAR"),
        ("vacuna_covid", "VARCHAR"),
        ("vacuna_tetano", "VARCHAR"),
        ("vacuna_fiebre_amarilla", "VARCHAR"),
        ("categoria_licencia", "VARCHAR"),
        ("vigencia_licencia", "VARCHAR"),
        ("examenes", "VARCHAR"),
        ("curso_primeros_auxilios", "VARCHAR"),
        ("curso_mecanica_basica", "VARCHAR"),
        ("curso_manejo_extintores", "VARCHAR"),
        ("curso_manejo_defensivo_tp", "VARCHAR"),
        ("curso_manejo_defensivo", "VARCHAR"),
        ("curso_terreno_agreste", "VARCHAR")
    ]
    
    with engine.connect() as connection:
        try:
            for col_name, col_type in new_columns:
                print(f"Añadiendo columna {col_name}...")
                connection.execute(text(f"ALTER TABLE drivers ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
            
            connection.commit()
            print("Base de datos actualizada con éxito.")
        except Exception as e:
            print(f"Error al actualizar: {e}")

if __name__ == "__main__":
    migrate()
