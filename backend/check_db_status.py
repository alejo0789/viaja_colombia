import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def check_db():
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()
    
    # 1. Ver columnas de la tabla services
    print("--- Columnas en tabla 'services' ---")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'services';")
    for row in cur.fetchall():
        print(f"Columna: {row[0]}, Tipo: {row[1]}")
    
    # 2. Ver los últimos 3 servicios para ver qué tienen los campos de hora
    print("\n--- Últimos 3 registros en 'services' ---")
    cur.execute("SELECT id, hora_programada, hora_solicitada_texto FROM services ORDER BY id DESC LIMIT 3;")
    for row in cur.fetchall():
        print(f"ID: {row[0]}, hora_programada: {row[1]}, hora_solicitada_texto: {row[2]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_db()
