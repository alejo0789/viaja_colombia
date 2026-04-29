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

with engine.connect() as conn:
    print("Current columns in 'vehiculos' table:")
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='vehiculos';
    """)).fetchall()
    for row in result:
        print(f"- {row[0]}")
