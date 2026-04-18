from app.database import SessionLocal
from app import models

def check_states():
    db = SessionLocal()
    try:
        states = db.query(models.Servicio.estado).distinct().all()
        print("Distinct states in DB:")
        for s in states:
            print(f"'{s[0]}'")
    finally:
        db.close()

if __name__ == "__main__":
    check_states()
