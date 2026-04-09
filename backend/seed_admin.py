from app.database import SessionLocal
from app import models, auth

def seed():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.email == "admin@viajacolombia.com").first()
        if not admin:
            new_admin = models.UsuarioDashboard(
                email="admin@viajacolombia.com",
                password_hash=auth.get_password_hash("admin12345"),
                nombre="Administrador Sistema",
                rol=1, # Admin
                estado="activo"
            )
            db.add(new_admin)
            db.commit()
            print("Admin user created: admin@viajacolombia.com / admin12345")
        else:
            print("Admin user already exists.")
            
    except Exception as e:
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
