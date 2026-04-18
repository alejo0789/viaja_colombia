from fastapi import FastAPI, Depends, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
import json
import logging
import secrets
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from . import models, schemas, database, auth, whatsapp
from .database import engine, get_db

# Crear tablas si no existen
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created or already exist.")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

app = FastAPI(title="ViajaColombia API", description="API para servicio de transporte B2B vía WhatsApp")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a ViajaColombia Transporte API"}

# --- AUTH ROUTES ---

@app.post("/api/auth/login")
async def login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email", "").lower().strip()
    password = payload.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email y contraseña requeridos")

    try:
        user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.email == email).first()
    except Exception as e:
        logger.error(f"Database query error: {e}")
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if user.estado != "activo":
        raise HTTPException(status_code=403, detail="Usuario inactivo. Contacta al administrador.")

    if not auth.verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # Convert rol integer to string for frontend
    role_map = {1: "ADMIN", 2: "CONDUCTOR", 4: "AUTORIZADOR"}
    role_str = role_map.get(user.rol, "ADMIN")

    token_payload = {
        "userId": str(user.id),
        "rol": role_str,
        "empresaClienteId": user.empresa_cliente_id,
        "empresaTransportistaId": user.empresa_transportista_id,
    }

    access_token = auth.create_access_token(token_payload)
    refresh_token = auth.create_refresh_token({"userId": str(user.id)})

    # Audit log
    new_log = models.LogAuditoria(usuario_id=user.id, accion="LOGIN", tabla_afectada="usuarios")
    db.add(new_log)
    db.commit()

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "nombre": user.nombre,
            "rol": role_str,
            "empresaClienteId": user.empresa_cliente_id,
            "empresaTransportistaId": user.empresa_transportista_id,
        }
    }

@app.get("/api/auth/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing auth header")
    
    token = auth_header.replace("Bearer ", "")
    payload = auth.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("userId")
    user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    role_map = {1: "ADMIN", 2: "CONDUCTOR", 4: "AUTORIZADOR"}
        
    return {
        "id": str(user.id),
        "email": user.email,
        "nombre": user.nombre,
        "rol": role_map.get(user.rol, "ADMIN"),
        "empresaClienteId": user.empresa_cliente_id,
        "empresaTransportistaId": user.empresa_transportista_id,
        "created_at": user.created_at
    }

@app.post("/api/auth/refresh")
async def refresh_token_route(payload: dict, db: Session = Depends(get_db)):
    refresh_token = payload.get("refreshToken")
    if not refresh_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Refresh token requerido")
    
    decoded = auth.decode_token(refresh_token)
    if not decoded:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    
    user_id = decoded.get("userId")
    user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.id == int(user_id)).first()
    
    if not user or user.estado != "activo":
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Usuario no válido")

    token_payload = {
        "userId": str(user.id),
        "rol": user.rol,
        "empresaClienteId": user.empresa_cliente_id,
        "empresaTransportistaId": user.empresa_transportista_id,
    }
    
    new_access_token = auth.create_access_token(token_payload)
    return {"accessToken": new_access_token}

@app.post("/api/auth/forgot-password")
async def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email", "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email requerido")
    
    user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.email == email).first()
    if not user:
        # Don't reveal if user exists or not for security, but in this case we'll just say ok
        return {"message": "Si el email existe, se ha enviado un enlace de recuperación"}
    
    # Generate token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now() + timedelta(hours=1)
    db.commit()
    
    # In a real app, send email here. For now, log it.
    logger.info(f"RESET TOKEN for {email}: {token}")
    
    return {"message": "Si el email existe, se ha enviado un enlace de recuperación", "debug_token": token}

@app.post("/api/auth/reset-password")
async def reset_password(payload: dict, db: Session = Depends(get_db)):
    token = payload.get("token")
    new_password = payload.get("password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token y nueva contraseña requeridos")
    
    user = db.query(models.UsuarioDashboard).filter(
        models.UsuarioDashboard.reset_token == token,
        models.UsuarioDashboard.reset_token_expires > datetime.now()
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    user.password_hash = auth.get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

# --- ADMIN ROUTES ---

@app.get("/api/admin/dashboard")
async def get_admin_dashboard(
    request: Request,
    empresa: str = None,
    mes: str = None,
    desde: str = None,
    hasta: str = None,
    db: Session = Depends(get_db)):

    from sqlalchemy import func, extract
    from datetime import datetime
    
    # Multi-tenant filtering based on user role
    auth_header = request.headers.get("Authorization")
    user_id = None
    user_empresa_id = None
    is_admin = True

    if auth_header:
        token = auth_header.replace("Bearer ", "")
        payload = auth.decode_token(token)
        if payload:
            role_str = payload.get("rol")
            user_empresa_id = payload.get("empresaClienteId")
            is_admin = role_str == "ADMIN"

    # Base filters for all queries
    filters = []
    
    # If not admin, FORCE filter by their company
    if not is_admin and user_empresa_id:
        filters.append(models.Servicio.empresa_id == user_empresa_id)
    elif empresa and empresa != "all":
        filters.append(models.Empresa.nombre == empresa)
        
    if mes and mes != "all":
        try:
            year, month = map(int, mes.split("-"))
            filters.append(extract('year', models.Servicio.created_at) == year)
            filters.append(extract('month', models.Servicio.created_at) == month)
        except ValueError:
            pass
            
    if desde:
        try:
            filters.append(models.Servicio.created_at >= datetime.strptime(desde, "%Y-%m-%d"))
        except:
            pass
    
    if hasta:
        try:
            hasta_date = datetime.strptime(hasta, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            filters.append(models.Servicio.created_at <= hasta_date)
        except:
            pass

    q_servicios = db.query(models.Servicio)
    if filters:
        # Check if we need to join Empresa (only if filtering by company name)
        # Note: in Python SQLAlchemy, we check binary expressions
        try:
            q_servicios = q_servicios.join(models.Empresa, isouter=True).filter(*filters)
        except:
            q_servicios = q_servicios.filter(*filters)
        
    total_solicitudes = q_servicios.count()

    # Drivers and alerts (Admins see all, Supervisors might see only relevant but for now keeping them general or filtering if needed)
    vehiculos_activos = db.query(models.Conductor).count()
    conductores_activos = db.query(models.Conductor).count()
    alertas_activas = db.query(models.LogAuditoria).filter(models.LogAuditoria.accion == "ALERTA").count()

    q_agrupadas = db.query(models.Empresa.nombre, func.count(models.Servicio.id)).join(
        models.Servicio, models.Empresa.id == models.Servicio.empresa_id
    )
    
    # We must apply the time/empresa filters to grouped query as well
    if filters:
        q_agrupadas = q_agrupadas.filter(*filters)
        
    sol_emp_raw = q_agrupadas.group_by(models.Empresa.nombre).order_by(func.count(models.Servicio.id).desc()).limit(10).all()
    solicitudes_por_empresa = [{"empresa": r[0], "count": r[1]} for r in sol_emp_raw]

    # Filters for status (also applying base filters so it matches active time window)
    q_status = db.query(models.Servicio)
    if filters:
        q_status = q_status.join(models.Empresa, isouter=True).filter(*filters)

    return {
        "totalSolicitudes": total_solicitudes,
        "vehiculosActivos": vehiculos_activos,
        "conductoresActivos": conductores_activos,
        "alertasActivas": alertas_activas,
        "stats": {
            "completados": q_status.filter(models.Servicio.estado == "COMPLETADO").count(),
            "pendientes": q_status.filter(models.Servicio.estado == "PENDIENTE").count(),
            "cancelados": q_status.filter(models.Servicio.estado == "CANCELADO").count()
        },
        "solicitudesPorEmpresa": solicitudes_por_empresa
    }

@app.get("/api/admin/solicitudes")
async def get_admin_solicitudes(
    request: Request, 
    estado: str = None, 
    empresa: str = None,
    mes: str = None,
    desde: str = None,
    hasta: str = None,
    page: int = 1, 
    size: int = 20, 
    db: Session = Depends(get_db)
):
    auth_header = request.headers.get("Authorization")
    user_empresa_id = None
    role_str = "ADMIN"
    is_admin = True

    if auth_header:
        token = auth_header.replace("Bearer ", "")
        payload = auth.decode_token(token)
        if payload:
            role_str = payload.get("rol")
            user_empresa_id = payload.get("empresaClienteId")
            is_admin = role_str == "ADMIN"

    query = db.query(models.Servicio)
    
    # Base filters
    filters = []

    # Force filter if not admin
    if not is_admin and user_empresa_id:
        filters.append(models.Servicio.empresa_id == user_empresa_id)
    elif empresa and empresa != "all":
        # Check if empresa is ID (search by ID) or Name (search by join)
        if empresa.isdigit():
            filters.append(models.Servicio.empresa_id == int(empresa))
        else:
            query = query.join(models.Empresa)
            filters.append(models.Empresa.nombre == empresa)
        
    if estado:
        if "," in estado:
            state_list = [s.strip().upper() for s in estado.split(",")]
            filters.append(models.Servicio.estado.in_(state_list))
        else:
            filters.append(models.Servicio.estado == estado.upper())

    if mes and mes != "all":
        try:
            logger.info(f"DEBUG Filter: applying month filter for {mes}")
            year, month = map(int, mes.split("-"))
            filters.append(extract('year', models.Servicio.created_at) == year)
            filters.append(extract('month', models.Servicio.created_at) == month)
        except Exception as e:
            logger.error(f"DEBUG Error: failed to parse mes '{mes}': {e}")
            pass
            
    if desde:
        try:
            logger.info(f"DEBUG Filter: applying desde {desde}")
            filters.append(models.Servicio.created_at >= datetime.strptime(desde, "%Y-%m-%d"))
        except Exception as e:
            logger.error(f"DEBUG Error: failed to parse desde '{desde}': {e}")
            pass
    
    if hasta:
        try:
            logger.info(f"DEBUG Filter: applying hasta {hasta}")
            hasta_date = datetime.strptime(hasta, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            filters.append(models.Servicio.created_at <= hasta_date)
        except Exception as e:
            logger.error(f"DEBUG Error: failed to parse hasta '{hasta}': {e}")
            pass

    if filters:
        logger.info(f"DEBUG Filter: applying {len(filters)} filters to query")
        query = query.filter(*filters)
    
    total = query.count()
    logger.info(f"DEBUG Result: {total} solicitudes found after filtering")
    solicitudes = query.order_by(models.Servicio.created_at.desc()).offset((page - 1) * size).limit(size).all()
    
    # Formatear para el frontend con datos reales de base de datos
    result = []
    for s in solicitudes:
        empresa_nombre = s.empresa.nombre if s.empresa else "Empresa N/A"
        empleado_nombre = s.usuario.nombre if s.usuario else "Desconocido"
        
        # Fecha en que fue creado el registro y hora a la que fue programado
        fecha_creacion = s.created_at.strftime("%b %d, %I:%M %p") if s.created_at else "No disp."
        
        # Conductor y vehículo asignado
        conductor_nombre = s.conductor.nombre if s.conductor else "Sin asignar"
        vehiculo_placa = s.vehiculo_asignado or "Sin asignar"
        
        result.append({
            "id": f"SOL-{s.id}",
            "original_id": s.id,
            "empresa": empresa_nombre,
            "empleado": empleado_nombre,
            "origen": s.direccion_origen,
            "destino": s.direccion_destino,
            "estado": s.estado,
            "fecha": fecha_creacion,
            "hora_programada": s.hora_programada or "Por confirmar",
            "hora_inicio": s.hora_inicio.strftime("%b %d, %H:%M") if s.hora_inicio else "N/A",
            "hora_fin": s.hora_fin.strftime("%b %d, %H:%M") if s.hora_fin else "N/A",
            "hora_inicio_raw": s.hora_inicio.isoformat() if s.hora_inicio else None,
            "hora_fin_raw": s.hora_fin.isoformat() if s.hora_fin else None,
            "duracion": f"{int((s.hora_fin - s.hora_inicio).total_seconds() / 60)} min" if s.hora_inicio and s.hora_fin else "N/A",
            "tipo_servicio": "Corporativo",
            "conductor": conductor_nombre,
            "placa": vehiculo_placa
        })
        
    return {
        "data": result,
        "total": total,
        "page": page,
        "size": size
    }

    return result

@app.get("/api/admin/usuarios-dashboard")
async def get_dashboard_users(db: Session = Depends(get_db)):
    # Hacemos un join con Empresa para traer el nombre
    results = db.query(
        models.UsuarioDashboard,
        models.Empresa.nombre.label("empresa_nombre")
    ).outerjoin(
        models.Empresa, 
        models.UsuarioDashboard.empresa_cliente_id == models.Empresa.id
    ).all()
    
    role_map = {1: "ADMIN", 2: "CONDUCTOR", 4: "AUTORIZADOR"}
    return [{
        "id": u.id,
        "nombre": u.nombre,
        "email": u.email,
        "rol": role_map.get(u.rol, "ADMIN"),
        "rol_id": u.rol,
        "estado": u.estado,
        "empresa_cliente_id": u.empresa_cliente_id,
        "empresa_nombre": empresa_nombre or "Viaja Colombia",
        "created_at": u.created_at
    } for u, empresa_nombre in results]

@app.post("/api/admin/usuarios-dashboard")
async def create_dashboard_user(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email", "").lower().strip()
    if db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.email == email).first():
        throw_http_err(400, "El email ya está registrado")
    
    new_user = models.UsuarioDashboard(
        email=email,
        nombre=payload.get("nombre"),
        password_hash=auth.get_password_hash(payload.get("password", "ViajaCol2024*")),
        rol=payload.get("rol", 1),
        estado="activo",
        empresa_cliente_id=payload.get("empresa_cliente_id")
    )
    db.add(new_user)
    db.commit()
    return {"message": "Usuario creado exitosamente"}

@app.patch("/api/admin/usuarios-dashboard/{user_id}")
async def update_dashboard_user(user_id: int, payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.id == user_id).first()
    if not user:
        throw_http_err(404, "Usuario no encontrado")
        
    if "nombre" in payload: user.nombre = payload["nombre"]
    if "email" in payload: user.email = payload["email"].lower().strip()
    if "rol" in payload: user.rol = payload["rol"]
    if "estado" in payload: user.estado = payload["estado"]
    if "empresa_cliente_id" in payload: user.empresa_cliente_id = payload["empresa_cliente_id"]
    if "password" in payload and payload["password"]:
        user.password_hash = auth.get_password_hash(payload["password"])
        
    db.commit()
    return {"message": "Usuario actualizado"}

@app.delete("/api/admin/usuarios-dashboard/{user_id}")
async def delete_dashboard_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.id == user_id).first()
    if not user:
        throw_http_err(404, "Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado"}

def throw_http_err(code: int, detail: str):
    from fastapi import HTTPException
    raise HTTPException(status_code=code, detail=detail)

# ---------------------------------------------------------------------------
# CONDUCTORES (admin)
# ---------------------------------------------------------------------------

@app.get("/api/admin/conductores")
async def get_conductores(db: Session = Depends(get_db)):
    """Retorna todos los conductores registrados con sus vehículos asignados."""
    conductores = db.query(models.Conductor).all()
    return [
        {
            "id": c.id,
            "nombre": c.nombre,
            "telefono": c.telefono,
            "whatsapp": c.whatsapp,
            "vehiculos": [
                {"id": v.id, "placa": v.placa, "marca": v.marca, "modelo": v.modelo}
                for v in c.vehiculos
            ],
            "disponible": c.disponible,
            "en_servicio": c.en_servicio,
        }
        for c in conductores
    ]

@app.post("/api/admin/conductores")
async def create_conductor(data: dict, db: Session = Depends(get_db)):
    """Crea un nuevo conductor en la base de datos."""
    telefono = data.get("telefono", "")
    whatsapp_raw = data.get("whatsapp") or telefono
    whatsapp_normalizado = normalizar_telefono_co(whatsapp_raw)
    
    conductor = models.Conductor(
        nombre=data.get("nombre"),
        telefono=telefono,
        whatsapp=whatsapp_normalizado,
        disponible=True,
        en_servicio=False,
    )
    
    # Asignar vehículos si se proporcionan IDs
    if "vehiculos_ids" in data:
        vehiculos = db.query(models.Vehiculo).filter(models.Vehiculo.id.in_(data["vehiculos_ids"])).all()
        conductor.vehiculos = vehiculos

    db.add(conductor)
    db.commit()
    db.refresh(conductor)
    return {"id": conductor.id, "message": "Conductor creado exitosamente"}

@app.patch("/api/admin/conductores/{conductor_id}")
async def update_conductor(conductor_id: int, data: dict, db: Session = Depends(get_db)):
    conductor = db.query(models.Conductor).filter(models.Conductor.id == conductor_id).first()
    if not conductor:
        throw_http_err(404, "Conductor no encontrado")
        
    for key, value in data.items():
        if key == "vehiculos_ids":
            vehiculos = db.query(models.Vehiculo).filter(models.Vehiculo.id.in_(value)).all()
            conductor.vehiculos = vehiculos
        elif hasattr(conductor, key):
            setattr(conductor, key, value)
            
    db.commit()
    db.refresh(conductor)
    return conductor

@app.post("/api/admin/conductores/{conductor_id}/toggle-vehiculo")
async def toggle_conductor_vehiculo(conductor_id: int, payload: dict, db: Session = Depends(get_db)):
    """Asigna o remueve un vehículo de un conductor."""
    vehiculo_id = payload.get("vehiculo_id")
    if not vehiculo_id:
        throw_http_err(400, "vehiculo_id es requerido")
        
    conductor = db.query(models.Conductor).filter(models.Conductor.id == conductor_id).first()
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()
    
    if not conductor or not vehiculo:
        throw_http_err(404, "Conductor o Vehículo no encontrado")
        
    if vehiculo in conductor.vehiculos:
        conductor.vehiculos.remove(vehiculo)
        msg = "Vehículo removido del conductor"
    else:
        conductor.vehiculos.append(vehiculo)
        msg = "Vehículo asignado al conductor"
        
    db.commit()
    return {"message": msg, "conductor_id": conductor_id, "vehiculo_id": vehiculo_id}

@app.patch("/api/admin/conductores/{conductor_id}/toggle-status")
async def toggle_conductor_status(conductor_id: int, db: Session = Depends(get_db)):
    conductor = db.query(models.Conductor).filter(models.Conductor.id == conductor_id).first()
    if not conductor:
        throw_http_err(404, "Conductor no encontrado")
    conductor.disponible = not conductor.disponible
    db.commit()
    return {"id": conductor.id, "disponible": conductor.disponible}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# ASIGNACION DE SERVICIO
# ---------------------------------------------------------------------------

def normalizar_telefono_co(numero: str) -> str:
    """
    Normaliza un numero colombiano para la API de WhatsApp.
    - Quita espacios, guiones y el caracter '+'
    - Si ya empieza con 57 y tiene 12 digitos, lo deja igual
    - Si solo tiene 10 digitos (numero local), agrega el prefijo 57
    """
    if not numero:
        return numero
    n = numero.strip().replace(" ", "").replace("-", "").replace("+", "")
    # Ya tiene codigo de pais Colombia
    if n.startswith("57") and len(n) == 12:
        return n
    # Numero local de 10 digitos -> agrega 57
    if len(n) == 10:
        return f"57{n}"
    # Otro formato: devolver como esta
    return n

@app.post("/api/admin/asignar-servicio")
async def asignar_servicio(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Asigna un conductor a una solicitud de transporte.
    - Genera un código de verificación de 6 dígitos.
    - Notifica al pasajero vía WhatsApp con el código, vehículo y conductor.
    - Notifica al conductor con los detalles del servicio.
    """
    solicitud_id = payload.get("solicitudId")
    conductor_id = payload.get("conductorId")
    vehiculo_payload = payload.get("vehiculo", "").strip()
    placa_payload = payload.get("placa", "").strip()

    if not solicitud_id or not conductor_id:
        throw_http_err(400, "solicitudId y conductorId son requeridos")

    # Convertir a entero si viene como string
    try:
        solicitud_id = int(str(solicitud_id).replace("SOL-", ""))
        conductor_id = int(conductor_id)
    except (ValueError, TypeError):
        throw_http_err(400, "IDs inválidos")

    servicio = db.query(models.Servicio).filter(models.Servicio.id == solicitud_id).first()
    if not servicio:
        throw_http_err(404, "Servicio no encontrado")

    conductor = db.query(models.Conductor).filter(models.Conductor.id == conductor_id).first()
    if not conductor:
        throw_http_err(404, "Conductor no encontrado")

    # Generar código de verificación de 6 dígitos
    codigo = f"{secrets.randbelow(1000000):06d}"

    # Construir descripcion del vehiculo (prioriza el del payload, fallback al conductor)
    if vehiculo_payload and placa_payload:
        vehiculo_desc = f"{vehiculo_payload} ({placa_payload.upper()})"
        placa_final = placa_payload.upper()
        vehiculo_final = vehiculo_payload
    elif conductor.vehiculo and conductor.placa:
        vehiculo_desc = f"{conductor.vehiculo} ({conductor.placa})"
        placa_final = conductor.placa
        vehiculo_final = conductor.vehiculo
    else:
        vehiculo_desc = "Por confirmar"
        placa_final = ""
        vehiculo_final = ""

    # Actualizar el servicio
    servicio.conductor_id = conductor.id
    servicio.vehiculo_asignado = vehiculo_desc
    servicio.estado = "ASIGNADO"
    servicio.codigo_verificacion = codigo
    db.commit()
    db.refresh(servicio)

    # Obtener datos del pasajero
    usuario = db.query(models.Usuario).filter(models.Usuario.id == servicio.usuario_id).first()
    hora_str = servicio.hora_programada or "Por confirmar"

    # ----- Mensaje al PASAJERO -----
    if usuario and usuario.whatsapp:
        msg_pasajero = (
            f"\U0001f697 *Tu servicio ha sido asignado - ViajaColombia*\n\n"
            f"Hola {usuario.nombre}, tu solicitud de transporte está lista.\n\n"
            f"\U0001f4cd *Recogida:* {servicio.direccion_origen}\n"
            f"\U0001f3c1 *Destino:* {servicio.direccion_destino}\n"
            f"\u23f0 *Fecha / Hora:* {hora_str}\n\n"
            f"\U0001f68c *Vehículo:* {vehiculo_final} \u2014 Placa *{placa_final}*\n"
            f"\U0001f464 *Conductor:* {conductor.nombre} ({conductor.telefono})\n\n"
            f"\U0001f511 *Código de verificación: {codigo}*\n"
            f"Presenta este código al conductor cuando llegue a recogerte."
        )
        background_tasks.add_task(whatsapp.send_whatsapp_text, usuario.whatsapp, msg_pasajero)


    # ----- Mensaje al CONDUCTOR (Usando Plantilla asignacion_servicio) -----
    raw_tel = conductor.whatsapp or conductor.telefono
    conductor_wa = normalizar_telefono_co(raw_tel) if raw_tel else None
    if conductor_wa:
        pasajero_nombre = usuario.nombre if usuario else "N/A"
        pasajero_tel = usuario.whatsapp if usuario else "N/A"
        
        # Preparar componentes para la plantilla asignacion_servicio
        # {{1}}: Conductor
        # {{2}}: Automóvil (Marca Modelo Placa)
        # {{3}}: Usuario (Pasajero)
        # {{4}}: Teléfono Pasajero
        # {{5}}: Recoger en (Origen)
        # {{6}}: Hacia (Destino)
        # {{7}}: Programado para (Hora)
        
        template_components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": conductor.nombre},
                    {"type": "text", "text": f"{vehiculo_final} - {placa_final}"},
                    {"type": "text", "text": pasajero_nombre},
                    {"type": "text", "text": pasajero_tel},
                    {"type": "text", "text": servicio.direccion_origen},
                    {"type": "text", "text": servicio.direccion_destino},
                    {"type": "text", "text": hora_str}
                ]
            }
        ]
        
        background_tasks.add_task(
            whatsapp.send_whatsapp_template, 
            conductor_wa, 
            "asignacion_servicio", 
            template_components,
            "en" # La plantilla fue creada en English segun el usuario
        )

    logger.info(
        f"Servicio #{servicio.id} asignado al conductor #{conductor.id} "
        f"({conductor.nombre}) con código {codigo}"
    )

    return {
        "message": "Servicio asignado exitosamente",
        "servicio_id": servicio.id,
        "conductor": conductor.nombre,
        "vehiculo": servicio.vehiculo_asignado,
        "codigo_verificacion": codigo,
        "estado": servicio.estado,
    }

# ---------------------------------------------------------------------------
# VEHICULOS (flota)
# ---------------------------------------------------------------------------

@app.get("/api/admin/vehiculos")
async def get_vehiculos(db: Session = Depends(get_db)):
    """Retorna todos los vehículos registrados en la flota."""
    vehiculos = db.query(models.Vehiculo).all()
    return [
        {
            "id": v.id,
            "placa": v.placa,
            "marca": v.marca,
            "modelo": v.modelo,
            "anio": v.anio,
            "capacidad": v.capacidad,
            "tipo_servicio": v.tipo_servicio,
            "estado": v.estado,
        }
        for v in vehiculos
    ]

@app.post("/api/admin/vehiculos")
async def create_vehiculo(data: dict, db: Session = Depends(get_db)):
    """Registra un nuevo vehículo en la flota."""
    placa = (data.get("placa") or "").strip().upper()
    if not placa:
        throw_http_err(400, "La placa es obligatoria")

    existing = db.query(models.Vehiculo).filter(models.Vehiculo.placa == placa).first()
    if existing:
        throw_http_err(400, f"Ya existe un vehículo con la placa {placa}")

    vehiculo = models.Vehiculo(
        placa=placa,
        marca=data.get("marca", ""),
        modelo=data.get("modelo", ""),
        anio=data.get("año") or data.get("anio"),
        capacidad=data.get("capacidad"),
        tipo_servicio=data.get("tipo_servicio", "Estándar"),
        estado=data.get("estado", "activo"),
    )
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)
    return {"id": vehiculo.id, "message": "Vehículo registrado exitosamente"}

@app.patch("/api/admin/vehiculos/{vehiculo_id}")
async def update_vehiculo(vehiculo_id: int, data: dict, db: Session = Depends(get_db)):
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()
    if not vehiculo:
        throw_http_err(404, "Vehículo no encontrado")
    for key, value in data.items():
        if key == "placa" and value:
            value = value.strip().upper()
        if key == "año":
            key = "anio"
        if hasattr(vehiculo, key):
            setattr(vehiculo, key, value)
    db.commit()
    db.refresh(vehiculo)
    return {"id": vehiculo.id, "message": "Vehículo actualizado"}

@app.delete("/api/admin/vehiculos/{vehiculo_id}")
async def delete_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()
    if not vehiculo:
        throw_http_err(404, "Vehículo no encontrado")
    db.delete(vehiculo)
    db.commit()
    return {"message": "Vehículo eliminado"}

@app.get("/api/admin/empresas")
async def get_admin_empresas(db: Session = Depends(get_db)):
    empresas = db.query(models.Empresa).all()
    result = []
    for e in empresas:
        # Supervisores
        supervisores = db.query(models.Supervisor).filter(models.Supervisor.empresa_id == e.id).all()
        # count users
        usuarios_count = db.query(models.Usuario).filter(models.Usuario.empresa_id == e.id).count()
        
        result.append({
            "id": e.id,
            "nombre": e.nombre,
            "nit": e.nit,
            "telefono": e.telefono,
            "email": e.email,
            "supervisores": [{
                "id": s.id,
                "nombre": s.nombre,
                "area": s.area,
                "whatsapp": s.whatsapp
            } for s in supervisores],
            "usuarios_count": usuarios_count
        })
    return result

@app.get("/api/admin/empresas/{id}/usuarios")
async def get_company_users_paginated(
    id: int, 
    page: int = 1, 
    search: str = "", 
    size: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(models.Usuario).filter(models.Usuario.empresa_id == id)
    if search:
        search_term = f"%{search}%"
        query = query.filter((models.Usuario.nombre.ilike(search_term)) | (models.Usuario.whatsapp.ilike(search_term)))
    
    total = query.count()
    users = query.offset((page - 1) * size).limit(size).all()
    
    return {
        "usuarios": users,
        "total": total,
        "page": page,
        "size": size
    }

@app.post("/api/admin/empresas")
async def create_admin_empresa(data: dict, db: Session = Depends(get_db)):
    new_empresa = models.Empresa(
        nombre=data.get("nombre"),
        nit=data.get("nit"),
        telefono=data.get("telefono"),
        email=data.get("email")
    )
    db.add(new_empresa)
    db.commit()
    db.refresh(new_empresa)
    return new_empresa

@app.post("/api/admin/supervisores")
async def create_admin_supervisor(data: dict, db: Session = Depends(get_db)):
    # 0. Validar duplicados antes de insertar para dar error limpio
    whatsapp = data.get("whatsapp")
    email = data.get("email", "").lower().strip()
    
    if db.query(models.Supervisor).filter(models.Supervisor.whatsapp == whatsapp).first():
        throw_http_err(400, f"El número de WhatsApp {whatsapp} ya está registrado en otro supervisor")
        
    if email and db.query(models.Supervisor).filter(models.Supervisor.email == email).first():
        throw_http_err(400, f"El email {email} ya está registrado en otro supervisor")

    # 1. Crear el registro de Supervisor (para WhatsApp)
    supervisor = models.Supervisor(
        nombre=data.get("nombre"),
        area=data.get("area"),
        whatsapp=whatsapp,
        empresa_id=data.get("empresa_id"),
        email=email
    )
    
    try:
        db.add(supervisor)
        
        # 2. Crear el acceso al Dashboard (UsuarioDashboard)
        password = data.get("password")
        
        if email and password:
            # Verificar si ya existe el usuario dashboard
            existing_user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.email == email).first()
            if not existing_user:
                new_dashboard_user = models.UsuarioDashboard(
                    email=email,
                    nombre=data.get("nombre"),
                    password_hash=auth.get_password_hash(password),
                    rol=4, # AUTORIZADOR
                    estado="activo",
                    empresa_cliente_id=data.get("empresa_id")
                )
                db.add(new_dashboard_user)
            else:
                # Si ya existe, nos aseguramos que tenga el rol y empresa correcta
                existing_user.rol = 4
                existing_user.empresa_cliente_id = data.get("empresa_id")
                if password:
                    existing_user.password_hash = auth.get_password_hash(password)

        db.commit()
        db.refresh(supervisor)
        return supervisor
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating supervisor: {e}")
        throw_http_err(400, f"Error al crear el supervisor: {str(e)}")

@app.post("/api/admin/usuarios")
async def create_admin_usuario(data: dict, db: Session = Depends(get_db)):
    usuario = models.Usuario(
        nombre=data.get("nombre"),
        whatsapp=data.get("whatsapp"),
        cargo=data.get("cargo"),
        empresa_id=data.get("empresa_id")
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@app.patch("/api/admin/supervisores/{id}")
async def update_admin_supervisor(id: int, data: dict, db: Session = Depends(get_db)):
    supervisor = db.query(models.Supervisor).filter(models.Supervisor.id == id).first()
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado")
    
    old_email = supervisor.email
    
    # Actualizar campos del Supervisor
    for key, value in data.items():
        if key != "password" and hasattr(supervisor, key):
            setattr(supervisor, key, value)
    
    # Sincronizar con el Usuario del Dashboard si existe
    if old_email:
        dashboard_user = db.query(models.UsuarioDashboard).filter(models.UsuarioDashboard.email == old_email).first()
        if dashboard_user:
            dashboard_user.nombre = supervisor.nombre
            dashboard_user.email = supervisor.email
            dashboard_user.empresa_cliente_id = supervisor.empresa_id
            
            # Si se envió una nueva contraseña, actualizarla
            if "password" in data and data["password"]:
                dashboard_user.password_hash = auth.get_password_hash(data["password"])
    
    db.commit()
    db.refresh(supervisor)
    return supervisor

@app.delete("/api/admin/supervisores/{id}")
async def delete_admin_supervisor(id: int, db: Session = Depends(get_db)):
    db.query(models.Supervisor).filter(models.Supervisor.id == id).delete()
    db.commit()
    return {"status": "deleted"}

@app.patch("/api/admin/usuarios/{id}")
async def update_admin_usuario(id: int, data: dict, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for key, value in data.items():
        setattr(usuario, key, value)
    db.commit()
    db.refresh(usuario)
    return usuario

@app.delete("/api/admin/usuarios/{id}")
async def delete_admin_usuario(id: int, db: Session = Depends(get_db)):
    db.query(models.Usuario).filter(models.Usuario.id == id).delete()
    db.commit()
    return {"status": "deleted"}

# --- WEBHOOK ROUTES ---
@app.post("/webhook/n8n")
async def n8n_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Este endpoint recibe los datos en bruto de Meta (vía n8n).
    Responde con un JSON status 200 y encola los mensajes de respuesta.
    """
    try:
        payload = await request.json()
    except Exception:
        return {"error": "Invalid JSON"}

    # n8n suele enviar listas con el trigger de WhatsApp
    if isinstance(payload, list):
        if not payload:
            return {"status": "ignored"}
        data = payload[0]
    else:
        data = payload
        
    messages = data.get("messages", [])
    if not messages:
        return {"status": "ignored", "reason": "No messages found (podría ser un cambio de estado)"}
        
    msg_data = messages[0]
    phone = msg_data.get("from")
    msg_type = msg_data.get("type")
    
    # META API Interactive Buttons replies come as 'interactive' type
    if msg_type == "text":
        text = msg_data.get("text", {}).get("body", "").strip()
    elif msg_type == "interactive":
        interactive_data = msg_data.get("interactive", {})
        if interactive_data.get("type") == "button_reply":
            text = interactive_data.get("button_reply", {}).get("id", "").strip()
        else:
            text = ""
    elif msg_type == "button":
        text = msg_data.get("button", {}).get("payload", "").strip()
    else:
        text = "" 
        
    if not phone or not text:
        return {"status": "ignored", "reason": "Mensaje sin texto o número telefónico"}
    
    # Normalizar número de teléfono (asume Colombia como principal)
    raw_phone = phone.replace("+", "")
    local_phone = raw_phone[2:] if raw_phone.startswith("57") and len(raw_phone) == 12 else raw_phone
    
    # Determinar si es comando de supervisor
    text_up = text.upper()
    is_supervisor_cmd = text_up.startswith("AUTORIZAR ") or text_up.startswith("RECHAZAR ")
    
    supervisor = db.query(models.Supervisor).filter(
        (models.Supervisor.whatsapp == raw_phone) | 
        (models.Supervisor.whatsapp == local_phone) |
        (models.Supervisor.whatsapp == f"57{local_phone}") |
        (models.Supervisor.whatsapp == f"+57{local_phone}")
    ).first()

    usuario = db.query(models.Usuario).filter(
        (models.Usuario.whatsapp == raw_phone) | 
        (models.Usuario.whatsapp == local_phone) |
        (models.Usuario.whatsapp == f"57{local_phone}") |
        (models.Usuario.whatsapp == f"+57{local_phone}")
    ).first()

    conductor = db.query(models.Conductor).filter(
        (models.Conductor.whatsapp == raw_phone) | 
        (models.Conductor.whatsapp == local_phone) |
        (models.Conductor.whatsapp == f"57{local_phone}") |
        (models.Conductor.whatsapp == f"+57{local_phone}")
    ).first()

    # Enrutamiento Inteligente
    if is_supervisor_cmd and supervisor:
        result = handle_supervisor_message(supervisor, text, db)
    elif conductor:
        result = handle_conductor_message(conductor, text, db)
    elif usuario:
        # Si no es un comando de supervisor pero está registrado como empleado, le iniciamos el flujo de empleado (pedir viaje)
        result = handle_user_session(usuario, text, db)
    elif supervisor:
        result = {"action": "send_message", "phone": phone, "message": "Eres supervisor pero no estás registrado como empleado. Pide que te agreguen como Empleado para poder pedir transporte."}
    else:
        result = {"action": "send_message", "phone": phone, "message": "No estás registrado en el sistema."}

    # Procesar resultados encolando las tareas a la API de WhatsApp Graph
    if result is None:
        result = []
    elif isinstance(result, dict):
        result = [result]
        
    for item in result:
        if item.get("action") == "send_message":
            background_tasks.add_task(whatsapp.send_whatsapp_text, item["phone"], item["message"])
        elif item.get("action") == "send_interactive":
            buttons = [
                {"id": item["btn1_id"], "title": item["btn1_text"]},
                {"id": item["btn2_id"], "title": item["btn2_text"]}
            ]
            background_tasks.add_task(whatsapp.send_whatsapp_interactive, item["phone"], item["message"], buttons)
        elif item.get("action") == "send_template":
            background_tasks.add_task(
                whatsapp.send_whatsapp_template, 
                item["phone"], 
                item["template_name"], 
                item["components"],
                item.get("language", "es")
            )
            
    return {"status": "processed"}

def handle_user_session(usuario: models.Usuario, text: str, db: Session):
    session = db.query(models.WaSession).filter(models.WaSession.whatsapp_number == usuario.whatsapp).first()
    
    if not session:
        session = models.WaSession(whatsapp_number=usuario.whatsapp, paso_actual="INICIO", datos_temporales={})
        db.add(session)
        db.commit()
        db.refresh(session)
        
    paso = session.paso_actual
    response_msg = ""
    
    # Manejar cancelación global
    if text.lower() == "cancelar":
        session.paso_actual = "INICIO"
        session.datos_temporales = {}
        flag_modified(session, "datos_temporales")
        db.commit()
        return {"action": "send_message", "phone": usuario.whatsapp, "message": "Proceso cancelado. Escribe 'Hola' para empezar de nuevo."}
        
    # Máquina de estados
    if paso == "INICIO":
        response_msg = "Hola 👋 Bienvenido a ViajaColombia. Por favor dime tu dirección de *recogida*:"
        session.paso_actual = "PEDIR_ORIGEN"
        db.commit()
        
    elif paso == "PEDIR_ORIGEN":
        datos = dict(session.datos_temporales or {})
        datos["origen"] = text
        session.datos_temporales = datos
        flag_modified(session, "datos_temporales")
        session.paso_actual = "PEDIR_DESTINO"
        db.commit()
        response_msg = "¡Entendido! Ahora dime tu dirección de *destino final*:"
        
    elif paso == "PEDIR_DESTINO":
        datos = dict(session.datos_temporales or {})
        datos["destino"] = text
        session.datos_temporales = datos
        flag_modified(session, "datos_temporales")
        session.paso_actual = "PEDIR_HORA"
        db.commit()
        response_msg = "Perfecto. Por último, dime la *fecha y hora programada* (ejemplo: 'Hoy a las 4pm' o '25 de Oct a las 08:00'):"
        
    elif paso == "PEDIR_HORA":
        current_datos = dict(session.datos_temporales or {})
        current_datos["hora"] = text
        
        # Buscar supervisores de la empresa para ver si pedimos área ahora
        supervisores = db.query(models.Supervisor).filter(
            models.Supervisor.empresa_id == usuario.empresa_id,
            models.Supervisor.activo == True
        ).all()

        if len(supervisores) > 1:
            session.datos_temporales = current_datos
            flag_modified(session, "datos_temporales")
            session.paso_actual = "PEDIR_AREA"
            db.commit()
            
            areas_list = ""
            for i, s in enumerate(supervisores, 1):
                area_name = (s.area or s.nombre or f"Supervisor {i}").strip()
                areas_list += f"{i}. {area_name}\n"
            
            response_msg = f"Perfecto. Tu empresa tiene varios supervisores. ¿Qué área debe autorizar este viaje?\n\n{areas_list}"
        else:
            if len(supervisores) == 1:
                current_datos["supervisor_id"] = supervisores[0].id
                current_datos["area"] = supervisores[0].area or supervisores[0].nombre
            
            session.datos_temporales = current_datos
            flag_modified(session, "datos_temporales")
            session.paso_actual = "CONFIRMAR_SERVICIO"
            db.commit()
            
            origen = current_datos.get('origen', 'No especificado')
            destino = current_datos.get('destino', 'No especificado')
            hora = current_datos.get('hora', text)
            
            response_msg = f"Revisemos tu solicitud:\n📍 Origen: {origen}\n🏁 Destino: {destino}\n⏰ Fecha/Hora: {hora}\n\nResponde *SI* para confirmar o *CANCELAR* para abortar."
        
    elif paso == "PEDIR_AREA":
        supervisores = db.query(models.Supervisor).filter(
            models.Supervisor.empresa_id == usuario.empresa_id,
            models.Supervisor.activo == True
        ).all()
        
        selected_supervisor = None
        try:
            text_clean = "".join(filter(str.isdigit, text))
            if text_clean:
                opcion = int(text_clean) - 1
                if 0 <= opcion < len(supervisores):
                    selected_supervisor = supervisores[opcion]
            
            if not selected_supervisor:
                # Buscar por nombre
                for s in supervisores:
                    if s.area and s.area.lower() in text.lower():
                        selected_supervisor = s
                        break
            
            if selected_supervisor:
                current_datos = dict(session.datos_temporales or {})
                current_datos["supervisor_id"] = selected_supervisor.id
                current_datos["area"] = selected_supervisor.area or selected_supervisor.nombre
                session.datos_temporales = current_datos
                flag_modified(session, "datos_temporales")
                session.paso_actual = "CONFIRMAR_SERVICIO"
                db.commit()
                
                origen = current_datos.get('origen', 'N/A')
                destino = current_datos.get('destino', 'N/A')
                hora = current_datos.get('hora', 'N/A')
                area = current_datos.get('area', 'N/A')
                
                response_msg = (
                    f"Revisemos tu solicitud:\n"
                    f"📍 Origen: {origen}\n"
                    f"🏁 Destino: {destino}\n"
                    f"⏰ Fecha/Hora: {hora}\n"
                    f"🏢 Área: {area}\n\n"
                    f"Responde *SI* para confirmar o *CANCELAR*."
                )
            else:
                response_msg = "No entendí tu elección. Por favor escribe el número de la opción (ej: 1)."
        except:
            response_msg = "Por favor, ingresa el número de la opción elegida."

    elif paso == "CONFIRMAR_SERVICIO":
        if text.lower() in ["si", "sí", "s", "ok", "confirmar"]:
            datos_finales = dict(session.datos_temporales or {})
            supervisor_id = datos_finales.get("supervisor_id")
            
            if supervisor_id:
                supervisor = db.query(models.Supervisor).filter(models.Supervisor.id == supervisor_id).first()
            else:
                # Fallback por si acaso
                supervisor = db.query(models.Supervisor).filter(
                    models.Supervisor.empresa_id == usuario.empresa_id,
                    models.Supervisor.activo == True
                ).first()
            
            if supervisor:
                return _crear_servicio_y_notificar(usuario, session, supervisor, db)
            else:
                # Crear sin supervisor especifico (el admin lo verá en el dashboard)
                return _crear_servicio_y_notificar(usuario, session, None, db)
        else:
            response_msg = "No reconocimos tu respuesta. Responde *SI* para confirmar o *CANCELAR*."
            
    return {"action": "send_message", "phone": usuario.whatsapp, "message": response_msg}

def _crear_servicio_y_notificar(usuario, session, supervisor, db):
    datos_finales = dict(session.datos_temporales or {})
    
    # Crear el servicio
    nuevo_servicio = models.Servicio(
        usuario_id=usuario.id,
        empresa_id=usuario.empresa_id,
        direccion_origen=datos_finales.get("origen", "Desconocido"),
        direccion_destino=datos_finales.get("destino", "Desconocido"),
        hora_programada=datos_finales.get("hora", "Pronto"),
        estado="PENDIENTE"
    )
    db.add(nuevo_servicio)
    db.commit()
    db.refresh(nuevo_servicio)
    
    # Resetear sesion
    session.paso_actual = "INICIO"
    session.datos_temporales = {}
    flag_modified(session, "datos_temporales")
    db.commit()
    
    hora_str = datos_finales.get('hora', 'No especificado')
    
    # Preparar componentes de la plantilla autorizacion_supervisor
    components = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": str(nuevo_servicio.id)},
                {"type": "text", "text": usuario.nombre},
                {"type": "text", "text": nuevo_servicio.direccion_origen},
                {"type": "text", "text": nuevo_servicio.direccion_destino},
                {"type": "text", "text": hora_str}
            ]
        },
        {
            "type": "button",
            "sub_type": "quick_reply",
            "index": 0,
            "parameters": [{"type": "payload", "payload": f"AUTORIZAR {nuevo_servicio.id}"}]
        },
        {
            "type": "button",
            "sub_type": "quick_reply",
            "index": 1,
            "parameters": [{"type": "payload", "payload": f"RECHAZAR {nuevo_servicio.id}"}]
        }
    ]
    
    area_msg = f" del área {supervisor.area}" if supervisor.area else ""
    return [
        {"action": "send_message", "phone": usuario.whatsapp, "message": f"Tu solicitud ha sido enviada al supervisor{area_msg} para su autorización. Te notificaremos pronto."},
        {
            "action": "send_template", 
            "phone": supervisor.whatsapp, 
            "template_name": "autorizacion_supervisor",
            "components": components,
            "language": "es_CO"
        }
    ]
            
    return {"action": "send_message", "phone": usuario.whatsapp, "message": response_msg}

def handle_supervisor_message(supervisor: models.Supervisor, text: str, db: Session):
    text_up = text.upper()
    if text_up.startswith("AUTORIZAR "):
        # Logica para autorizar servicio especifico
        try:
            servicio_id = int(text_up.split(" ")[1])
            servicio = db.query(models.Servicio).filter(models.Servicio.id == servicio_id, models.Servicio.empresa_id == supervisor.empresa_id).first()
            
            if not servicio:
                return {"action": "send_message", "phone": supervisor.whatsapp, "message": "Servicio no encontrado."}
                
            if servicio.estado != "PENDIENTE":
                return {"action": "send_message", "phone": supervisor.whatsapp, "message": f"Este servicio ya no está pendiente. Estado actual: {servicio.estado}"}
                
            servicio.estado = "AUTORIZADO"
            servicio.supervisor_id = supervisor.id
            db.commit()
            
            # Notificar al usuario que su servicio fue autorizado
            usuario = db.query(models.Usuario).filter(models.Usuario.id == servicio.usuario_id).first()
            
            return [
                {"action": "send_message", "phone": supervisor.whatsapp, "message": f"Servicio #{servicio_id} AUTORIZADO ✅."},
                {"action": "send_message", "phone": usuario.whatsapp, "message": "🎉 ¡Tu servicio ha sido autorizado por el supervisor! Pronto asignaremos un conductor."}
            ]
        except IndexError:
            return {"action": "send_message", "phone": supervisor.whatsapp, "message": "Formato incorrecto. Usa: AUTORIZAR [numero]"}
            
    elif text_up.startswith("RECHAZAR "):
        # Lógica de rechazar
        try:
            servicio_id = int(text_up.split(" ")[1])
            servicio = db.query(models.Servicio).filter(models.Servicio.id == servicio_id, models.Servicio.empresa_id == supervisor.empresa_id).first()
            
            if not servicio:
                return {"action": "send_message", "phone": supervisor.whatsapp, "message": "Servicio no encontrado."}
                
            servicio.estado = "RECHAZADO"
            servicio.supervisor_id = supervisor.id
            db.commit()
            
            usuario = db.query(models.Usuario).filter(models.Usuario.id == servicio.usuario_id).first()
            
            return [
                {"action": "send_message", "phone": supervisor.whatsapp, "message": f"Servicio #{servicio_id} RECHAZADO ❌."},
                {"action": "send_message", "phone": usuario.whatsapp, "message": "Lo sentimos, tu solicitud de servicio no fue autorizada por el supervisor."}
            ]
        except IndexError:
            return {"action": "send_message", "phone": supervisor.whatsapp, "message": "Formato incorrecto. Usa: RECHAZAR [numero]"}
        
    return {"action": "send_message", "phone": supervisor.whatsapp, "message": "Comando de supervisor no reconocido. (Usa: AUTORIZADOR [num] o RECHAZAR [num])"}
    
def handle_conductor_message(conductor: models.Conductor, text: str, db: Session):
    session = db.query(models.WaSession).filter(models.WaSession.whatsapp_number == conductor.whatsapp).first()
    if not session:
        session = models.WaSession(whatsapp_number=conductor.whatsapp, paso_actual="INICIO", datos_temporales={})
        db.add(session)
        db.commit()
        db.refresh(session)

    paso = session.paso_actual
    text_clean = "".join(filter(str.isdigit, text))

    # Buscar todos los servicios ASIGNADOS para este conductor
    servicios_asignados = db.query(models.Servicio).filter(
        models.Servicio.conductor_id == conductor.id,
        models.Servicio.estado == "ASIGNADO"
    ).all()

    if paso == "INICIO":
        # Flujo de INICIAR SERVICIO por código
        if len(text_clean) == 6:
            # Buscar el servicio específico que coincida con el código
            servicio_matcheado = next((s for s in servicios_asignados if s.codigo_verificacion == text_clean), None)
            
            if servicio_matcheado:
                servicio_matcheado.estado = "EN_CURSO"
                servicio_matcheado.hora_inicio = datetime.now()
                session.paso_actual = "FINALIZAR_SERVICIO"
                session.datos_temporales = {"servicio_id": servicio_matcheado.id}
                flag_modified(session, "datos_temporales")
                db.commit()
                
                # Notificar al pasajero
                usuario = db.query(models.Usuario).filter(models.Usuario.id == servicio_matcheado.usuario_id).first()
                notif_usuario = {"action": "send_message", "phone": usuario.whatsapp, "message": "🚖 Tu servicio ha iniciado. ¡Buen viaje!"} if usuario else None
                
                res = [{"action": "send_message", "phone": conductor.whatsapp, "message": f"Servicio #{servicio_matcheado.id} INICIADO ✅. Al llegar al destino, ingresa los *últimos 4 dígitos de la cédula del pasajero* para completar el viaje."}]
                if notif_usuario: res.append(notif_usuario)
                return res
            else:
                if servicios_asignados:
                    return {"action": "send_message", "phone": conductor.whatsapp, "message": "❌ El código de verificación no coincide con ninguna de tus asignaciones actuales. Por favor verifícalo con el pasajero."}
                # Si no tiene asignados, seguimos para ver si tiene uno en curso

        # Si no mandó código de 6 o no matcheó con nada, vemos si tiene uno EN CURSO para finalizar
        servicio_en_curso = db.query(models.Servicio).filter(
            models.Servicio.conductor_id == conductor.id,
            models.Servicio.estado == "EN_CURSO"
        ).order_by(models.Servicio.created_at.desc()).first()

        if servicio_en_curso:
            session.paso_actual = "FINALIZAR_SERVICIO"
            session.datos_temporales = {"servicio_id": servicio_en_curso.id}
            flag_modified(session, "datos_temporales")
            db.commit()
            return {"action": "send_message", "phone": conductor.whatsapp, "message": f"Tienes el servicio #{servicio_en_curso.id} EN CURSO. Para finalizarlo, ingresa los *últimos 4 dígitos de la cédula del pasajero*."}

        # Si no tiene nada en curso y tiene asignados, listarlos
        if servicios_asignados:
            count = len(servicios_asignados)
            msg = f"Hola 👋, tienes {count} {'servicios asignados' if count > 1 else 'servicio asignado'}:\n\n"
            for s in servicios_asignados:
                msg += f"• *#{s.id}*: {s.direccion_origen} → {s.direccion_destino}\n"
            msg += "\nPor favor ingresa el *código de verificación de 6 dígitos* del servicio que vas a iniciar."
            return {"action": "send_message", "phone": conductor.whatsapp, "message": msg}
        
        return {"action": "send_message", "phone": conductor.whatsapp, "message": "Hola, no tienes servicios asignados pendientes por iniciar en este momento."}

    elif paso == "FINALIZAR_SERVICIO":
        servicio_id = session.datos_temporales.get("servicio_id")
        servicio = db.query(models.Servicio).filter(models.Servicio.id == servicio_id).first()
        
        if not servicio or servicio.estado != "EN_CURSO":
            session.paso_actual = "INICIO"
            session.datos_temporales = {}
            flag_modified(session, "datos_temporales")
            db.commit()
            return {"action": "send_message", "phone": conductor.whatsapp, "message": "No se encontró el servicio en curso. Por favor inicia de nuevo."}

        if len(text_clean) == 4:
            usuario = db.query(models.Usuario).filter(models.Usuario.id == servicio.usuario_id).first()
            cedula_valida = False
            
            if usuario and usuario.cedula:
                if usuario.cedula.endswith(text_clean):
                    cedula_valida = True
            else:
                # Si no hay cédula registrada, permitimos cualquier 4 dígitos como verificación de que el pasajero está presente
                cedula_valida = True 

            if cedula_valida:
                servicio.estado = "COMPLETADO"
                servicio.hora_fin = datetime.now()
                session.paso_actual = "INICIO"
                session.datos_temporales = {}
                flag_modified(session, "datos_temporales")
                db.commit()
                
                # Notificar al pasajero
                notif_usuario = {"action": "send_message", "phone": usuario.whatsapp, "message": "✅ Tu servicio ha finalizado con éxito. ¡Gracias por viajar con nosotros!"} if usuario else None
                
                res = [{"action": "send_message", "phone": conductor.whatsapp, "message": f"Servicio #{servicio.id} FINALIZADO ✅. ¡Buen trabajo!"}]
                if notif_usuario: res.append(notif_usuario)
                return res
            else:
                return {"action": "send_message", "phone": conductor.whatsapp, "message": "❌ Los dígitos no coinciden con la cédula registrada. Por favor verifícalos y envíalos de nuevo."}
        else:
            return {"action": "send_message", "phone": conductor.whatsapp, "message": "Por favor ingresa los *4 últimos dígitos de la cédula del pasajero* para completar el servicio."}

    return {"action": "send_message", "phone": conductor.whatsapp, "message": "Hola, ¿en qué puedo ayudarte?"}

# --- AUTORIZADOR (SUPERVISOR) ROUTES ---

@app.get("/api/autorizador/estadisticas")
async def get_autorizador_stats(request: Request, desde: str = None, hasta: str = None, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header: throw_http_err(401, "No autorizado")
    
    token = auth_header.replace("Bearer ", "")
    payload = auth.decode_token(token)
    empresa_id = payload.get("empresaClienteId")
    
    if not empresa_id:
        return {"resumen": {"total_servicios": 0, "servicios_finalizados": 0, "servicios_autorizados": 0, "servicios_rechazados": 0, "servicios_pendientes": 0, "costo_total": 0, "duracion_promedio_min": 0, "costo_excedentes": 0}}

    # Base query filtrada por empresa
    q = db.query(models.Servicio).filter(models.Servicio.empresa_id == empresa_id)
    
    # Aplicar filtros de fecha si existen
    from datetime import datetime
    if desde:
        try:
            d_obj = datetime.strptime(desde, "%Y-%m-%d")
            q = q.filter(models.Servicio.created_at >= d_obj)
        except: pass
    if hasta:
        try:
            h_obj = datetime.strptime(hasta, "%Y-%m-%d")
            # Ajustar a final del día
            h_obj = h_obj.replace(hour=23, minute=59, second=59)
            q = q.filter(models.Servicio.created_at <= h_obj)
        except: pass
    
    total = q.count()
    finalizados = q.filter(models.Servicio.estado == "COMPLETADO").count()
    autorizados = q.filter(models.Servicio.estado == "AUTORIZADO").count()
    rechazados = q.filter(models.Servicio.estado == "RECHAZADO").count()
    pendientes = q.filter(models.Servicio.estado == "PENDIENTE").count()
    
    # Histórico de últimos 3 meses
    from datetime import datetime, timedelta
    from sqlalchemy import extract
    
    historico = []
    meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    for i in range(2, -1, -1):
        target_date = datetime.now() - timedelta(days=i*30)
        mes_idx = target_date.month - 1
        conteo = q.filter(
            extract('year', models.Servicio.created_at) == target_date.year,
            extract('month', models.Servicio.created_at) == target_date.month
        ).count()
        historico.append({"mes": meses_nombres[mes_idx], "servicios": conteo})

    return {
        "resumen": {
            "total_servicios": total,
            "servicios_finalizados": finalizados,
            "servicios_autorizados": autorizados,
            "servicios_rechazados": rechazados,
            "servicios_pendientes": pendientes,
            "costo_total": 0,
            "duracion_promedio_min": 0,
            "costo_excedentes": 0
        },
        "graficas": {
            "tendencia": historico,
            "distribucion": [
                {"name": "Autorizados", "value": autorizados},
                {"name": "Rechazados", "value": rechazados},
                {"name": "Pendientes", "value": pendientes}
            ]
        }
    }

@app.get("/api/autorizador/solicitudes")
async def get_autorizador_solicitudes(request: Request, estado: str = None, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    token = auth_header.replace("Bearer ", "")
    payload = auth.decode_token(token)
    empresa_id = payload.get("empresaClienteId")
    
    query = db.query(models.Servicio).filter(models.Servicio.empresa_id == empresa_id)
    
    if estado:
        # Mapeo de estados del frontend a la base de datos
        mapping = {
            "pendiente_autorizacion": "PENDIENTE",
            "autorizada": "AUTORIZADO",
            "rechazada": "RECHAZADO",
            "finalizada": "COMPLETADO",
            "en_curso": "EN CURSO",
            "asignada": "ASIGNADO",
            "cancelada": "CANCELADO"
        }
        db_status = mapping.get(estado, estado.upper())
        query = query.filter(models.Servicio.estado == db_status)
        
    solicitudes = query.order_by(models.Servicio.created_at.desc()).all()
    
    # Formatear para que el frontend lo entienda (espera objeto con llave 'solicitudes')
    result = []
    # Mapeo inverso para la salida
    inverse_mapping = {
        "PENDIENTE": "pendiente_autorizacion",
        "AUTORIZADO": "autorizada",
        "RECHAZADO": "rechazada",
        "COMPLETADO": "finalizada",
        "EN CURSO": "en_curso",
        "ASIGNADO": "asignada",
        "CANCELADO": "cancelada"
    }
    
    for s in solicitudes:
        db_status = s.estado.upper() if s.estado else "PENDIENTE"
        result.append({
            "id": s.id,
            "numero_solicitud": s.id,
            "estado": inverse_mapping.get(db_status, db_status.lower()), 
            "direccion_recogida": s.direccion_origen,
            "direccion_destino": s.direccion_destino,
            "fecha": s.created_at.strftime("%Y-%m-%d") if s.created_at else "",
            "hora_programada": str(s.hora_programada) if s.hora_programada else "Pronto",
            "empleado": {
                "nombre": s.usuario.nombre if s.usuario else "N/A",
                "cargo": s.usuario.cargo if s.usuario else "Empleado"
            },
            "tipo_servicio": {
                "nombre": "Corporativo",
                "tarifa_base": 0
            }
        })
        
    return {"solicitudes": result}

@app.get("/api/autorizador/empleados")
async def get_autorizador_empleados(request: Request, search: str = "", page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header: throw_http_err(401, "No autorizado")
    
    token = auth_header.replace("Bearer ", "")
    payload = auth.decode_token(token)
    if not payload: throw_http_err(401, "Token inválido")
    
    empresa_id = payload.get("empresaClienteId")
    
    # Base query
    query = db.query(models.Usuario).filter(models.Usuario.empresa_id == empresa_id)
    
    # Filtro de búsqueda (nombre o whatsapp)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Usuario.nombre.ilike(search_term)) | 
            (models.Usuario.whatsapp.ilike(search_term))
        )
    
    total = query.count()
    paginated_empleados = query.offset((page - 1) * size).limit(size).all()
    
    # Calcular estadísticas por empleado
    from sqlalchemy import extract
    from datetime import datetime
    ahora = datetime.now()
    
    result = []
    for e in paginated_empleados:
        # Total servicios
        total_servicios = db.query(models.Servicio).filter(models.Servicio.usuario_id == e.id).count()
        
        # Servicios mes actual
        servicios_mes = db.query(models.Servicio).filter(
            models.Servicio.usuario_id == e.id,
            extract('year', models.Servicio.created_at) == ahora.year,
            extract('month', models.Servicio.created_at) == ahora.month
        ).count()
        
        result.append({
            "id": e.id,
            "nombre": e.nombre,
            "whatsapp": e.whatsapp,
            "cargo": e.cargo,
            "activo": e.activo, # Usamos el campo 'activo' del modelo Usuario
            "total_servicios": total_servicios,
            "servicios_mes": servicios_mes
        })
        
    return {"empleados": result, "total": total, "page": page, "size": size}

@app.patch("/api/autorizador/empleados/{empleado_id}/toggle-status")
async def toggle_autorizador_empleado_status(request: Request, empleado_id: int, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    token = auth_header.replace("Bearer ", "")
    payload = auth.decode_token(token)
    empresa_id = payload.get("empresaClienteId")
    
    empleado = db.query(models.Usuario).filter(
        models.Usuario.id == empleado_id, 
        models.Usuario.empresa_id == empresa_id
    ).first()
    
    if not empleado:
        throw_http_err(404, "Empleado no encontrado")
        
    empleado.activo = not empleado.activo
    db.commit()
    db.refresh(empleado)
    
    return {"id": empleado.id, "activo": empleado.activo, "message": "Estado actualizado"}

@app.get("/api/autorizador/empleados/{empleado_id}/servicios")
async def get_autorizador_empleado_servicios(request: Request, empleado_id: int, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    token = auth_header.replace("Bearer ", "")
    payload = auth.decode_token(token)
    empresa_id = payload.get("empresaClienteId")
    
    # Verificar que el empleado pertenece a la empresa
    employee = db.query(models.Usuario).filter(models.Usuario.id == empleado_id, models.Usuario.empresa_id == empresa_id).first()
    if not employee:
        throw_http_err(403, "No tienes permiso para ver este empleado")
        
    servicios = db.query(models.Servicio).filter(models.Servicio.usuario_id == empleado_id).order_by(models.Servicio.created_at.desc()).all()
    
    # Formatear para el modal
    result = []
    for s in servicios:
        result.append({
            "id": s.id,
            "origen": s.direccion_origen,
            "destino": s.direccion_destino,
            "fecha": s.created_at.strftime("%d/%m/%Y %I:%M %p") if s.created_at else "N/A",
            "estado": s.estado
        })
        
    return {"servicios": result}
