import csv
import io
from app.database import SessionLocal
from app import models

csv_data = """PLACA,MODELO,MARCA,TIPO VEHICULO,CIUDAD,PROPIETARIO,CEDULA,FECHA MATRICULA,SOAT,TECNOMECANICA,POLIZAS,TODO RIESGO,TARJETA OPERACIÓN,EMPRESA AFILIADA
JQX149,2021,RENAULT,DUSTER,VILLAVICENCIO,LUIS CARLOS ROLDAN,86086498,30/11/2020,25-nov/2026,27-nov/2026,12-nov/2026,X,27-dic/2026,TRANSPORTES NUEVO BOLIVAR SAS
WNS142,2016,RENAULT,DUSTER,BOGOTA,INDIRA ROLDAN HIDALGO,40430780,28/11/2015,18-nov/2026,08-ene/2027,25-feb/2026,X,29-may/2026,VIAJES Y RUTAS DE COLOMBIA SAS
WNO866,2016,RENAULT,DUSTER,BOGOTA,MARIA ELISA GUIZA,28427934,24/12/2015,20-may/2026,23-may/2026,10-jul/2026,X,05-abr/2026,CONSULTORIAS TRANSPORTES Y SOLUCIONES YA
JTQ739,2022,RENAULT,DUSTER,BOGOTA,JHON ROJAS,12195427,20/05/2021,10-jun/2026,13-jun/2026,31-may/2026,X,23-ene/2028,TRANSPORTES LUXURY CAR PREMIUM SAS
WCX872,2014,RENAULT,DUSTER,BOGOTA,JHON HERNANDO FANDIÑO,79879769,21/04/2014,21-mar/2027,13-jul/2026,08-feb/2027,X,02-mar/2028,CONEXION SEDET COLOMBIA S.A.S.
KOK707,2022,RENAULT,DUSTER,BOGOTA,PEDRO MOSOS,80023220,30/07/2021,31-jul/2026,04-ago/2026,25-jun/2026,X,12-ago/2027,EMPRESA DE TRANSPORTE ESPECIAL TRANSPORTES DORADO VIP
LGM535,2022,RENAULT,DUSTER,VILLAVICENCIO,JHON CHARRY,80831613,07/11/2022,22-ene/2027,X,X,X,31-mar/2026,EMPRESA DE TRANSPORTE SKY TRANS SAS
LCN596,2023,RENAULT,DUSTER,VILLAVICENCIO,VICTOR NIÑO LOPEZ,80523687,21/01/2022,15-abr/2026,02-may/2026,21-oct/2026,X,11-may/2026,EMPRESA DE TRANSPORTE SKY TRANS SAS
LGL639,2023,RENAULT,DUSTER,VILLAVICENCIO,DIEGO ARMANDO WANDURRAGA,1095725593,13/07/2022,12-jul/2026,10-jul/2026,24-feb/2027,22-jul/2026,27-ago/2026,EFFECTRANS GRUPO EMPRESARIAL SAS
LLQ684,2023,RENAULT,DUSTER,VILLAVICENCIO,JAIRO PULIDO MANCERA,80268718,26/08/2022,25-ago/2026,27-ago/2026,04-may/2026,X,12-sep/2026,LEGALITY TRANSPORT SAS
LZT805,2024,RENAULT,DUSTER,BOGOTA,LUIS MATIAS RUEDA,1014264624,12/03/2024,X,N/A,16-nov/2026,X,18-feb/2026,EMPRESA DE TRANSPORTE ESPECIAL EL TREBOL
LLR491,2024,RENAULT,DUSTER,BOGOTA,MARISOL VARGAS SANCHEZ,52278482,19/01/2024,18-ene/2027,19-ene/2027,18-nov/2026,X,19-feb/2028,TUKAN EXPRESS SAS
LTM731,2024,RENAULT,DUSTER,BOGOTA,EMPRESA DISTRITAL MARCA VIRTUAL,901518115,24/04/2024,23-abr/2027,23-abr/2027,16-nov/2026,X,20-may/2027,ENTRE EXTREMOS SAS
PMW859,2026,RENAULT,DUSTER,BOGOTA,EXCELINO ALBEN URREGO,3214322,11/04/2025,07-abr/2026,11-abr/2027,18-abr/2026,X,16-abr/2027,TRANSPORTE ESPECIAL EL CARIBEÑO S.A.S
WWX451,2025,RENAULT,DUSTER,BOGOTA,LUIS GUILLERMO PINZON,80031804,15/12/2025,14-dic/2026,14-dic/2027,14-dic/2026,X,16-dic/2027,CAMA TOURS S.A.S
PRZ003,2026,RENAULT,DUSTER,BOGOTA,JOSE GUSTAVO OCHOA DAZA,19156008,27/08/2025,20-jun/2026,27-jun/2027,18-jun/2026,06-jul/2026,05-jul/2027,EMPRESA DE TRANSPORTES ROYAL PASS SAS"""

def seed():
    db = SessionLocal()
    reader = csv.DictReader(io.StringIO(csv_data))
    
    count = 0
    updated = 0
    
    for row in reader:
        placa = row['PLACA'].strip().upper()
        if not placa: continue
        
        data = {
            "placa": placa,
            "modelo": row['MODELO'].strip(),
            "marca": row['MARCA'].strip(),
            "tipo_vehiculo": row['TIPO VEHICULO'].strip(),
            "ciudad": row['CIUDAD'].strip(),
            "propietario": row['PROPIETARIO'].strip(),
            "cedula_propietario": row['CEDULA'].strip(),
            "fecha_matricula": row['FECHA MATRICULA'].strip(),
            "soat_vencimiento": row['SOAT'].strip(),
            "tecnomecanica_vencimiento": row['TECNOMECANICA'].strip(),
            "polizas_vencimiento": row['POLIZAS'].strip(),
            "todo_riesgo_vencimiento": row['TODO RIESGO'].strip(),
            "tarjeta_operacion_vencimiento": row['TARJETA OPERACIÓN'].strip(),
            "empresa_afiliada": row['EMPRESA AFILIADA'].strip()
        }
        
        existing = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa).first()
        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
            updated += 1
        else:
            new_v = models.Vehiculo(**data)
            db.add(new_v)
            count += 1
            
    db.commit()
    db.close()
    print(f"Vehículos: {count} creados, {updated} actualizados.")

if __name__ == "__main__":
    seed()
