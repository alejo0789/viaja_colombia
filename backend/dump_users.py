from app.database import engine
from sqlalchemy import text

def check_users():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT id, email, nombre, rol, estado FROM usuarios"))
        users = result.fetchall()
        print(f"Total usuarios en DB: {len(users)}")
        for u in users:
            print(f"- {u.nombre} ({u.email}) [Rol: {u.rol}, Estado: {u.estado}]")

if __name__ == "__main__":
    check_users()
