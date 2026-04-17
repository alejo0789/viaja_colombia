import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://")
engine = create_engine(database_url)

with engine.connect() as conn:
    session = conn.execute(text("SELECT whatsapp_number, paso_actual, datos_temporales FROM wa_sessions WHERE whatsapp_number LIKE '%3153404327%'")).fetchone()
    if session:
        print(f"Session: {session.whatsapp_number}, Paso: {session.paso_actual}")
        print(f"Datos: {session.datos_temporales}")
    else:
        print("Session not found")
