from app.database import SessionLocal
from app import models

def delete_driver_by_phone(phone):
    db = SessionLocal()
    try:
        # Buscar por telefono
        driver = db.query(models.Conductor).filter(models.Conductor.telefono == phone).first()
        if driver:
            name = driver.nombre
            db.delete(driver)
            db.commit()
            print(f"Driver '{name}' with phone {phone} deleted successfully.")
        else:
            # Intentar por whatsapp solo por si acaso
            driver = db.query(models.Conductor).filter(models.Conductor.whatsapp == phone).first()
            if driver:
                name = driver.nombre
                db.delete(driver)
                db.commit()
                print(f"Driver '{name}' with WhatsApp {phone} deleted successfully.")
            else:
                print(f"No driver found with phone or WhatsApp: {phone}")
    except Exception as e:
        db.rollback()
        print(f"Error deleting driver: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_driver_by_phone("3153404327")
