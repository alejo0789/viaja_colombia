import os
import csv
import io
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def normalizar_telefono_co(numero: str) -> str:
    if not numero:
        return numero
    n = str(numero).strip().replace(" ", "").replace("-", "").replace("+", "")
    if n.startswith("57") and len(n) == 12:
        return n
    if len(n) == 10:
        return f"57{n}"
    return n

csv_data = """CONDUCTOR,C.C,FECHA DE NACIMIENTO,NÚMERO DE CONTACTO,VACUNAS: COVID,VACUNAS: TÉTANO,VACUNAS: FIEBRE AMARILLA,CATEGORÍA LICENCIA,VIGENCIA DE LICENCIA,EXÁMENES,CURSOS: Primeros auxilios,CURSOS: Mecánica básica,CURSOS: Manejo extintores y control de incendios,CURSOS: Teórico práctico,CURSOS: Manejo defensivo,CURSOS: Terreno agreste
OSCAR EDUARDO LATORRE CADENA,80111327,24/10/1983,322 2185894,OK,OK,OK,C2,19-nov/2028,03-mar/2027,24-ene/2027,22-ene/2027,20-ene/2027,10-dic/2026,17-ene/2027,
ERNESTO MORENO LANCHEROS,19450188,5/05/1962,321 4697148,OK,OK,OK,C2,22-oct/2026,X,23-oct/2026,25-oct/2026,X,NO,26-oct/2026,X
SEUDIEL ROJAS ROGILLO,4204053,24/08/1973,311 4120490,OK,OK,OK,C2,22-jun/2027,01-jul/2028,01-nov/2028,01-nov/2028,30-oct/2028,NO,26-oct/2028,NO
JULIAN CAMILO ORTIZ LOZADA,1022387484,31/10/1993,3188288881,OK,X,X,C1,25-sep/2028,25-sep/2028,13-may/2028,13-may/2028,13-may/2028,NO,13-may/2028,NO
JOSE WILLIAM MELO CRUZ,93355715,10/09/1983,315 8284817,OK,OK,OK,C2,29-sep/2028,20-sep/2028,31-may/2028,29-may/2028,27-may/2028,NO,24-may/2028,X
SANTIAGO ROLDAN MENDEZ,3100079,29/08/1971,310 3072795,OK,OK,OK,C2,18-abr/2027,20-nov/2026,25-nov/2026,26-nov/2026,27-nov/2026,07-jun/2026,X,13-jun/2026
LUIS ALBERTO RUBIO,80020665,15/10/1985,312 5307405,OK,OK,OK,C1,10-nov/2028,09-sep/2026,11-nov/2028,12-nov/2028,10-nov/2028,14-nov/2026,X,14-abr/2027
LUIS ALBERTO RUBIO,80020665,15/10/1985,312 5307405,OK,OK,OK,C1,10-nov/2028,09-sep/2028,11-nov/2028,12-nov/2028,10-nov/2028,14-nov/2026,X,14-abr/2027
LUIS ALBERTO RUBIO,80020665,15/10/1985,312 5307405,OK,OK,OK,C1,10-nov/2028,09-sep/2028,11-nov/2028,12-nov/2028,10-nov/2028,14-nov/2026,X,14-abr/2027
LUIS FELIPE MOJOCCOA DIAZ,1013629838,1/02/1992,315 4429849,OK,OK,OK,C2,10-ago/2026,X,X,20-sep/2026,X,X,20-sep/2026,18-sep/2027
WILMAR BARBOSA BARBOSA,1000701509,27/03/1997,3142032960,OK,OK,OK,C2,13-nov/2027,X,30-ene/2027,01-feb/2027,28-ene/2027,13-sep/2027,03-feb/2027,20-abr/2027
PEDRO CAMARGO,79424584,14/08/1967,313 3833469,OK,OK,OK,C2,28-abr/2028,09-ago/2026,14-jul/2026,12-jul/2026,10-jul/2026,18-jul/2026,08-jul/2026,X
ROBER LOPEZ,84453973,10/02/1983,304 4115581,OK,OK,OK,C1,11-jun/2027,27-may/2026,24-may/2026,22-may/2026,20-may/2026,X,17-may/2026,X
JHON JAIR ROJAS MENDEZ,12195427,25/12/1973,318 3908769,OK,X,OK,C1,15-sep/2026,X,X,X,X,X,X,X
JHON HERNANDO FANDIÑO,79879769,3/05/1979,311 8651405,X,X,OK,C2,14-mar/2027,X,X,X,X,X,X,X
PEDRO GUILLERMO MOSOS,80023220,28/07/1979,300 3841667,OK,NO,OK,C1,19-sep/2028,X,09-may/2026,09-may/2026,09-may/2026,X,09-may/2026,X
JOSE LUIS SILVA,1127357297,3/07/1977,310 8538905,OK,OK,OK,C2,07-oct/2028,21-ago/2026,05-mar/2027,07-mar/2027,03-mar/2027,10-mar/2027,NO,NO
LENIN ERNESTO RIVEROS QUEVEDO,79758905,4/06/1977,316 0427440,X,OK,OK,C1,08-ago/2027,X,28-ago/2026,28-ago/2026,16-mar/2027,X,28-ago/2026,14-mar/2027
JHON ALEXANDER MORERA,1020719060,10/09/1986,313 8020288,OK,OK,OK,C2,06-feb/2027,19-nov/2026,16-mar/2027,16-mar/2027,16-mar/2027,X,16-mar/2027,14-mar/2027"""

def seed():
    try:
        db = SessionLocal()
        reader = csv.DictReader(io.StringIO(csv_data))
        
        count = 0
        updated = 0
        
        for row in reader:
            nombre = row['CONDUCTOR'].strip()
            cedula = row['C.C'].strip()
            fecha_nac = row['FECHA DE NACIMIENTO'].strip()
            telefono = row['NÚMERO DE CONTACTO'].strip()
            
            if not telefono:
                print(f"Saltando {nombre} por falta de teléfono")
                continue
                
            # Normalizar teléfono
            whatsapp = normalizar_telefono_co(telefono)
            
            # Buscar si ya existe por teléfono
            existing = db.query(models.Conductor).filter(models.Conductor.telefono == telefono).first()
            
            # Mapeo de campos dinámico
            def get_val(keys):
                for k in keys:
                    if k in row: return row[k]
                return ""

            data_map = {
                "nombre": nombre,
                "cedula": cedula,
                "fecha_nacimiento": fecha_nac,
                "telefono": telefono,
                "whatsapp": whatsapp,
                "vacuna_covid": get_val(['VACUNAS: COVID']),
                "vacuna_tetano": get_val(['VACUNAS: TÉTANO']),
                "vacuna_fiebre_amarilla": get_val(['VACUNAS: FIEBRE AMARILLA']),
                "categoria_licencia": get_val(['CATEGORÍA LICENCIA']),
                "vigencia_licencia": get_val(['VIGENCIA DE LICENCIA']),
                "examenes": get_val(['EXÁMENES']),
                "curso_primeros_auxilios": get_val(['CURSOS: Primeros auxilios']),
                "curso_mecanica_basica": get_val(['CURSOS: Mecánica básica']),
                "curso_manejo_extintores": get_val(['CURSOS: Manejo extintores y control de incendios']),
                "curso_manejo_defensivo_tp": get_val(['CURSOS: Teórico práctico', 'CURSOS: Manejo defensivo T.P.']),
                "curso_manejo_defensivo": get_val(['CURSOS: Manejo defensivo']),
                "curso_terreno_agreste": get_val(['CURSOS: Terreno agreste'])
            }

            if existing:
                for k, v in data_map.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                new_conductor = models.Conductor(**data_map)
                db.add(new_conductor)
                count += 1
            
            db.commit() 
                
        db.close()
        print(f"Inserción completada: {count} nuevos conductores, {updated} actualizados.")
    except Exception as e:
        print(f"ERROR DURANTE SEEDING: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed()
