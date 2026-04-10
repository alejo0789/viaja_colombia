import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def drop_unique_constraint():
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()
    
    # Buscar el nombre de la restricción unique en la placa
    try:
        cur.execute("""
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'drivers'::regclass 
            AND contype = 'u' 
            AND 'placa' = ANY(
                SELECT attname 
                FROM pg_attribute 
                WHERE attrelid = 'drivers'::regclass 
                AND attnum = ANY(conkey)
            );
        """)
        row = cur.fetchone()
        if row:
            constraint_name = row[0]
            print(f"Eliminando restricción: {constraint_name}")
            cur.execute(f"ALTER TABLE drivers DROP CONSTRAINT {constraint_name};")
            conn.commit()
            print("[OK] Restricción eliminada.")
        else:
            print("[INFO] No se encontró restricción unique en 'placa'.")
            
    except Exception as e:
        print(f"[ERROR] {e}")
        conn.rollback()
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    drop_unique_constraint()
