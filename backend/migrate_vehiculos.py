import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("No DATABASE_URL found in .env")
    exit(1)

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(database_url)

new_columns = [
    "tipo_vehiculo",
    "ciudad",
    "propietario",
    "cedula_propietario",
    "fecha_matricula",
    "soat_vencimiento",
    "tecnomecanica_vencimiento",
    "polizas_vencimiento",
    "todo_riesgo_vencimiento",
    "tarjeta_operacion_vencimiento",
    "empresa_afiliada"
]

with engine.connect() as conn:
    try:
        for col in new_columns:
            print(f"Checking if column '{col}' exists in table 'vehiculos'...")
            result = conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='vehiculos' AND column_name='{col}';
            """)).fetchone()
            
            if not result:
                print(f"Column '{col}' not found. Adding it...")
                conn.execute(text(f"ALTER TABLE vehiculos ADD COLUMN {col} VARCHAR;"))
                print(f"Column '{col}' added successfully.")
            else:
                print(f"Column '{col}' already exists.")
        
        conn.commit()
        print("Migration completed successfully.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
