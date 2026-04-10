import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def check_drivers():
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'drivers';")
    cols = [r[0] for r in cur.fetchall()]
    print(f"Columnas en 'drivers': {cols}")
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_drivers()
