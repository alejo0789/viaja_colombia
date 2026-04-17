import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("No DATABASE_URL found in .env")
    exit(1)

# Fix for postgres:// vs postgresql://
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(database_url)

with engine.connect() as conn:
    try:
        print("Checking if column 'area' exists in table 'supervisors'...")
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='supervisors' AND column_name='area';
        """)).fetchone()
        
        if not result:
            print("Column 'area' not found. Adding it...")
            conn.execute(text("ALTER TABLE supervisors ADD COLUMN area VARCHAR;"))
            conn.commit()
            print("Column 'area' added successfully.")
        else:
            print("Column 'area' already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
