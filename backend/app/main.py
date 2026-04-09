from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from . import models, schemas, database, auth
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

# --- ADMIN ROUTES ---

@app.get("/api/admin/dashboard")
async def get_admin_dashboard(db: Session = Depends(get_db)):
    # En un sistema real, haríamos conteos reales en la BD
    total_solicitudes = db.query(models.Servicio).count()
    vehiculos_activos = db.query(models.Conductor).count() # O tabla vehiculos si existiera
    conductores_activos = db.query(models.Conductor).count()
    alertas_activas = db.query(models.LogAuditoria).filter(models.LogAuditoria.accion == "ALERTA").count()

    return {
        "totalSolicitudes": total_solicitudes,
        "vehiculosActivos": vehiculos_activos,
        "conductoresActivos": conductores_activos,
        "alertasActivas": alertas_activas,
        "stats": {
            "completados": db.query(models.Servicio).filter(models.Servicio.estado == "COMPLETADO").count(),
            "pendientes": db.query(models.Servicio).filter(models.Servicio.estado == "PENDIENTE").count(),
            "cancelados": db.query(models.Servicio).filter(models.Servicio.estado == "CANCELADO").count()
        }
    }

@app.get("/api/admin/solicitudes")
async def get_admin_solicitudes(estado: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Servicio)
    if estado:
        query = query.filter(models.Servicio.estado == estado)
    
    solicitudes = query.order_by(models.Servicio.created_at.desc()).limit(50).all()
    
    # Formatear para el frontend
    result = []
    for s in solicitudes:
        result.append({
            "id": f"SOL-{s.id}",
            "empleado_nombre": "Usuario WhatsApp", # Asumimos nombre genérico si no lo tenemos
            "origen": s.direccion_origen,
            "destino": s.direccion_destino,
            "estado": s.estado,
            "fecha": s.created_at.strftime("%Y-%m-%d %H:%M"),
            "tipo_servicio": "Estándar"
        })
    return result

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
    # Buscamos si ya existe por whatsapp
    supervisor = models.Supervisor(
        nombre=data.get("nombre"),
        whatsapp=data.get("whatsapp"),
        empresa_id=data.get("empresa_id")
    )
    db.add(supervisor)
    db.commit()
    db.refresh(supervisor)
    return supervisor

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
    for key, value in data.items():
        setattr(supervisor, key, value)
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
async def n8n_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Este endpoint recibe los datos en bruto de Meta (vía n8n).
    Responde con un JSON indicando a n8n qué hacer a continuación.
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
    
    if msg_type == "text":
        text = msg_data.get("text", {}).get("body", "").strip()
    else:
        text = "" # Podremos agregar soporte para botones acá luego
        
    if not phone or not text:
        return {"status": "ignored", "reason": "Mensaje sin texto o número telefónico"}
    
    # Normalizar número de teléfono (asume Colombia como principal)
    raw_phone = phone.replace("+", "")
    local_phone = raw_phone[2:] if raw_phone.startswith("57") and len(raw_phone) == 12 else raw_phone
    
    # Buscar usuario solicitante
    usuario = db.query(models.Usuario).filter(
        (models.Usuario.whatsapp == raw_phone) | 
        (models.Usuario.whatsapp == local_phone) |
        (models.Usuario.whatsapp == f"57{local_phone}") |
        (models.Usuario.whatsapp == f"+57{local_phone}")
    ).first()
    
    if not usuario:
        # Si no es usuario, podría ser un supervisor respondiendo una autorización
        supervisor = db.query(models.Supervisor).filter(
            (models.Supervisor.whatsapp == raw_phone) | 
            (models.Supervisor.whatsapp == local_phone) |
            (models.Supervisor.whatsapp == f"57{local_phone}") |
            (models.Supervisor.whatsapp == f"+57{local_phone}")
        ).first()
        if supervisor:
            return handle_supervisor_message(supervisor, text, db)
            
        return {"action": "send_message", "phone": phone, "message": "No estás registrado en el sistema. Contacta al supervisor de tu empresa."}
        
    return handle_user_session(usuario, text, db)

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
        db.commit()
        return {"action": "send_message", "phone": usuario.whatsapp, "message": "Proceso cancelado. Escribe 'Hola' para empezar de nuevo."}
        
    # Máquina de estados
    if paso == "INICIO":
        response_msg = "Hola 👋 Bienvenido a ViajaColombia. Por favor dime tu dirección de *recogida*:"
        session.paso_actual = "PEDIR_ORIGEN"
        
    elif paso == "PEDIR_ORIGEN":
        datos = session.datos_temporales.copy() if hasattr(session.datos_temporales, 'copy') else {}
        datos["origen"] = text
        session.datos_temporales = datos
        response_msg = "¡Entendido! Ahora dime tu dirección de *destino final*:"
        session.paso_actual = "PEDIR_DESTINO"
        
    elif paso == "PEDIR_DESTINO":
        datos = session.datos_temporales.copy() if hasattr(session.datos_temporales, 'copy') else {}
        datos["destino"] = text
        session.datos_temporales = datos
        response_msg = "Perfecto. Por último, dime la *fecha y hora programada* (ejemplo: 'Hoy a las 4pm' o '25 de Oct a las 08:00'):"
        session.paso_actual = "PEDIR_HORA"
        
    elif paso == "PEDIR_HORA":
        datos = session.datos_temporales.copy() if hasattr(session.datos_temporales, 'copy') else {}
        datos["hora"] = text
        session.datos_temporales = datos
        
        origen = datos.get('origen', 'No especificado')
        destino = datos.get('destino', 'No especificado')
        hora = datos.get('hora', text)
        
        response_msg = f"Revisemos tu solicitud:\n📍 Origen: {origen}\n🏁 Destino: {destino}\n⏰ Fecha/Hora: {hora}\n\nResponde *SI* para confirmar o *CANCELAR* para abortar."
        session.paso_actual = "CONFIRMAR_SERVICIO"
        
    elif paso == "CONFIRMAR_SERVICIO":
        if text.lower() in ["si", "sí", "s", "ok", "confirmar"]:
            datos = session.datos_temporales
            # Crear el servicio en estado PENDIENTE
            nuevo_servicio = models.Servicio(
                usuario_id=usuario.id,
                empresa_id=usuario.empresa_id,
                direccion_origen=datos.get("origen", "Desconocido"),
                direccion_destino=datos.get("destino", "Desconocido"),
                hora_programada=datetime.now(), # TO DO: En un sistema real usaríamos IA/NLP (o dialogflow) para parsear el string de "hora" a datetime
                estado="PENDIENTE"
            )
            db.add(nuevo_servicio)
            
            # Resetear sesion
            session.paso_actual = "INICIO"
            session.datos_temporales = {}
            db.commit()
            
            # Buscar supervisor de la empresa
            supervisor = db.query(models.Supervisor).filter(models.Supervisor.empresa_id == usuario.empresa_id).first()
            if supervisor:
                db.refresh(nuevo_servicio)
                hora_str = datos.get('hora', 'No especificado')
                msg_supervisor = f"🔔 *Nuevo servicio solicitado*\nUsuario: {usuario.nombre}\n📍 Origen: {nuevo_servicio.direccion_origen}\n🏁 Destino: {nuevo_servicio.direccion_destino}\n⏰ Fecha/Hora: {hora_str}\n\n¿Autoriza este servicio? Responda: *AUTORIZAR {nuevo_servicio.id}* o *RECHAZAR {nuevo_servicio.id}*"
                
                # Devolvemos una instrucción en formato array a n8n para que procese automáticamente a 2 destinatarios
                return [
                    {"action": "send_message", "phone": usuario.whatsapp, "message": "Tu solicitud ha sido enviada al supervisor para su autorización. Te notificaremos pronto."},
                    {"action": "send_message", "phone": supervisor.whatsapp, "message": msg_supervisor}
                ]
            else:
                response_msg = "Solicitud guardada en sistema, pero no encontramos supervisor asignado para esta empresa."
        else:
            response_msg = "No reconocimos tu respuesta. Responde *SI* para confirmar o *CANCELAR*."
            
    # Guardar estado de la base de datos
    if db.is_modified(session):
        db.commit()
        
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
            
            return {
                "action": "notify_multi",
                "supervisor_msg": {"phone": supervisor.whatsapp, "message": f"Servicio {servicio_id} AUTORIZADO ✅. El administrador de ViajaColombia ha sido notificado."},
                "user_msg": {"phone": usuario.whatsapp, "message": "🎉 ¡Tu servicio ha sido autorizado por el supervisor! Pronto asignaremos un conductor."},
                # Podríamos también notificar al administrador aquí mismo si hay un número de admin
            }
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
            
            return {
                "action": "notify_multi",
                "supervisor_msg": {"phone": supervisor.whatsapp, "message": f"Servicio {servicio_id} RECHAZADO ❌."},
                "user_msg": {"phone": usuario.whatsapp, "message": "Lo sentimos, tu solicitud de servicio no fue autorizada por el supervisor."}
            }
        except IndexError:
            return {"action": "send_message", "phone": supervisor.whatsapp, "message": "Formato incorrecto. Usa: RECHAZAR [numero]"}
        
    return {"action": "send_message", "phone": supervisor.whatsapp, "message": "Comando de supervisor no reconocido. (Usa: AUTORIZAR [num] o RECHAZAR [num])"}
