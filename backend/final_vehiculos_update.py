import csv
import io
from app.database import SessionLocal
from app import models

csv_data = """PLACA,MODELO,MARCA,TIPO VEHICULO,CIUDAD,PROPIETARIO,CEDULA,FECHA MATRICULA,SOAT,TECNOMECANICA,POLIZAS,TODO RIESGO,TARJETA OPERACIÓN,EMPRESA AFILIADA
JOX149,2021,RENAULT,DUSTER,VILLAVICENCIO,LUIS CARLOS ROLDAN,86086488,30/11/2020,25-nov/2026,27-nov/2026,12-nov/2026,X,27-dic/2026,TRANSPORTES NUEVO BOLIVAR SAS
WNS142,2016,RENAULT,DUSTER,BOGOTA,INDIRA ROLDAN HIDALGO,40430780,28/11/2015,18-nov/2026,08-ene/2027,25-feb/2026,X,29-may/2026,VIAJES Y RUTAS DE COLOMBIA SAS
WNS666,2016,RENAULT,DUSTER,BOGOTA,MARIA ELISA GUIZA,28427934,24/12/2015,20-may/2026,23-may/2026,16-jul/2026,X,05-abr/2026,CONSULTORIAS TRANSPORTES Y SOLUCIONES YA
JTQ739,2022,RENAULT,DUSTER,BOGOTA,JHON ROJAS,12195427,20/05/2021,10-jun/2026,13-jun/2026,31-may/2026,X,23-ene/2028,TRANSPORTES LUXURY CAR PREMIUM SAS
WCX672,2014,RENAULT,DUSTER,BOGOTA,JHON HERNANDO FANDIÑO,79879769,21/04/2014,21-mar/2026,13-jul/2026,08-feb/2027,X,02-mar/2028,CONEXION SEDET COLOMBIA S.A.S.
KOK707,2022,RENAULT,DUSTER,BOGOTA,PEDRO MOSOS,80023220,30/07/2021,31-jul/2026,04-ago/2026,25-jun/2026,X,12-ago/2027,EMPRESA DE TRANSPORTE ESPECIAL TRANSPORTES DORADO VIP
LCN408,2022,RENAULT,DUSTER,VILLAVICENCIO,JHON CHARRY,86085868,24/03/2022,25-mar/2026,23-mar/2026,21-oct/2025,X,30-mar/2026,EMPRESA DE TRANSPORTE SKY TRANS SAS
LCN896,2023,RENAULT,DUSTER,VILLAVICENCIO,VICTOR NIÑO LOPEZ,80523687,21/04/2022,15-abr/2026,02-may/2026,21-oct/2026,X,11-may/2026,EMPRESA DE TRANSPORTE SKY TRANS SAS
LGL639,2023,RENAULT,DUSTER,VILLAVICENCIO,DIEGO ARMANDO WANDURRAGA,1098725593,13/07/2022,12-jul/2026,10-jul/2026,24-feb/2027,22-jul/2026,27-ago/2026,EFFECTRANS GRUPO EMPRESARIAL SAS
LLO884,2023,RENAULT,DUSTER,VILLAVICENCIO,JAIRO PULIDO MANCERA,80268718,26/08/2022,25-ago/2026,27-ago/2026,04-may/2026,X,12-sep/2026,LEGALITY TRANSPORT SAS
LZO673,2024,RENAULT,DUSTER,BOGOTA,JOSE MIGUEL BUELVAS DIAZ,18145975,22/09/2023,25-sep/2025,N/A,28-feb/2026,X,02-nov/2025,EMPRESA DE TRANSPORTE ESPECIAL PESCAITO TOURS S.A.S
LLR491,2024,RENAULT,DUSTER,BOGOTA,MARISOL VARGAS SANCHEZ,52276482,19/01/2024,18-ene/2027,19-ene/2027,16-nov/2026,X,19-feb/2028,TUKAN EXPRESS SAS
LUM120,2024,RENAULT,DUSTER,BOGOTA,JHAN CARLOS GALLARDO PEINADO,1077090226,31/01/2023,30-ene/2026,03-feb/2026,20-ene/2026,,20-mar/2027,ENTRE DESTINOS SAS
PMW859,2026,RENAULT,DUSTER,BOGOTA,EXCELINO ALBEN URREGO,3214322,11/04/2025,07-abr/2026,11-abr/2027,18-abr/2026,X,16-abr/2027,TRANSPORTE ESPECIAL EL CARIBEÑO S.A.S.
WNY201,2016,RENAULT,DUSTER,BOGOTA,CRISTIAN CAMILO REY ROA,1022433563,6/02/2016,05-feb/2025,28-ene/2025,22-ene/2025,x,02-jun/2025,ZAVI TOURS S.A.S
KNL020,,,,BOGOTA,,,,,,,,,,
PRZ003,2026,RENAULT,DUSTER,BOGOTA,JOSE GUSTAVO OCHOA DAZA,19156008,27/06/2025,20-jun/2026,27-jun/2027,16-jun/2026,08-jul/2026,05-jul/2027,EMPRESA DE TRANSPORTES ROYAL PASS SAS"""

# Relaciones adicionales C.C -> Placa (de la imagen del usuario)
relations = [
    ("79424584", "JOX149"),
    ("1121942065", "WNS142"),
    ("84453973", "WNS666"),
    ("12195427", "JTQ739"),
    ("79879769", "WCX672"),
    ("80023220", "KOK707"),
    ("79424584", "LCN408"),
    ("17648843", "LCN896"),
    ("1127357297", "LGL639"),
    ("80268718", "LLO884"),
    ("79685755", "LZO673"),
    ("79758905", "LLR491"),
    ("1077087154", "LUM120"),
    ("1020719060", "PMW859"),
    ("80067078", "WNY201"),
    ("79459089", "KNL020"),
    ("19156008", "PRZ003"),
]

def update_and_relate():
    db = SessionLocal()
    reader = csv.DictReader(io.StringIO(csv_data))
    
    v_count = 0
    v_updated = 0
    r_count = 0
    
    # 1. Upsert Vehículos
    for row in reader:
        placa = row['PLACA'].strip().upper()
        if not placa: continue
        
        data = {
            "placa": placa,
            "modelo": row.get('MODELO', '').strip(),
            "marca": row.get('MARCA', '').strip(),
            "tipo_vehiculo": row.get('TIPO VEHICULO', '').strip(),
            "ciudad": row.get('CIUDAD', '').strip(),
            "propietario": row.get('PROPIETARIO', '').strip(),
            "cedula_propietario": row.get('CEDULA', '').strip(),
            "fecha_matricula": row.get('FECHA MATRICULA', '').strip(),
            "soat_vencimiento": row.get('SOAT', '').strip(),
            "tecnomecanica_vencimiento": row.get('TECNOMECANICA', '').strip(),
            "polizas_vencimiento": row.get('POLIZAS', '').strip(),
            "todo_riesgo_vencimiento": row.get('TODO RIESGO', '').strip(),
            "tarjeta_operacion_vencimiento": row.get('TARJETA OPERACIÓN', '').strip(),
            "empresa_afiliada": row.get('EMPRESA AFILIADA', '').strip()
        }
        
        existing = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa).first()
        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
            v_updated += 1
        else:
            new_v = models.Vehiculo(**data)
            db.add(new_v)
            v_count += 1
            
    db.commit()
    
    # 2. Relate
    for cc, placa in relations:
        conductor = db.query(models.Conductor).filter(models.Conductor.cedula == cc).first()
        vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa.upper()).first()
        
        if conductor and vehiculo:
            if vehiculo not in conductor.vehiculos:
                conductor.vehiculos.append(vehiculo)
                r_count += 1
                
    db.commit()
    db.close()
    print(f"Vehículos: {v_count} creados, {v_updated} actualizados.")
    print(f"Relaciones establecidas: {r_count}")

if __name__ == "__main__":
    update_and_relate()
