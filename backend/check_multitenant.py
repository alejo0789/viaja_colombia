from app.database import engine
from sqlalchemy import text

def diagnostic():
    with engine.connect() as connection:
        print("--- REVISIÓN DE USUARIOS DASHBOARD ---")
        users = connection.execute(text("SELECT id, email, nombre, rol, empresa_cliente_id FROM usuarios")).fetchall()
        for u in users:
            print(f"User: {u.nombre} | Email: {u.email} | Rol: {u.rol} | Empresa_ID: {u.empresa_cliente_id}")
        
        print("\n--- REVISIÓN DE EMPRESAS ---")
        companies = connection.execute(text("SELECT id, nombre FROM companies")).fetchall()
        for c in companies:
            print(f"Company ID: {c.id} | Name: {c.nombre}")
            
        print("\n--- REVISIÓN DE EMPLEADOS (USUARIOS WHATSAPP) ---")
        employees = connection.execute(text("SELECT id, nombre, empresa_id FROM users")).fetchall()
        for e in employees:
            print(f"Employee: {e.nombre} | Empresa_ID: {e.empresa_id}")

        print("\n--- REVISIÓN DE SERVICIOS ---")
        services = connection.execute(text("SELECT id, empresa_id, estado FROM services")).fetchall()
        print(f"Total servicios: {len(services)}")
        for s in services:
             print(f"Servicio ID: {s.id} | Empresa_ID: {s.empresa_id} | Estado: {s.estado}")

if __name__ == "__main__":
    diagnostic()
