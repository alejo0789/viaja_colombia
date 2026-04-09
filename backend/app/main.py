from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import json

from . import models, schemas, database
from .database import engine, get_db

# Crear tablas si no existen
models.Base.metadata.create_all(bind=engine)

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
    
    # Buscar usuario solicitante
    usuario = db.query(models.Usuario).filter(models.Usuario.whatsapp == phone).first()
    
    if not usuario:
        # Si no es usuario, podría ser un supervisor respondiendo una autorización
        supervisor = db.query(models.Supervisor).filter(models.Supervisor.whatsapp == phone).first()
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
        session.datos_temporales["origen"] = text
        response_msg = "¡Entendido! Ahora dime tu dirección de *destino final*:"
        session.paso_actual = "PEDIR_DESTINO"
        
    elif paso == "PEDIR_DESTINO":
        session.datos_temporales["destino"] = text
        response_msg = "Perfecto. Por último, dime la *fecha y hora programada* (ejemplo: 'Hoy a las 4pm' o '25 de Oct a las 08:00'):"
        session.paso_actual = "PEDIR_HORA"
        
    elif paso == "PEDIR_HORA":
        session.datos_temporales["hora"] = text
        origen = session.datos_temporales['origen']
        destino = session.datos_temporales['destino']
        hora = session.datos_temporales['hora']
        
        response_msg = f"Revisemos tu solicitud:\n📍 Origen: {origen}\n🏁 Destino: {destino}\n⏰ Fecha/Hora: {hora}\n\nResponde *SI* para confirmar o *CANCELAR* para abortar."
        session.paso_actual = "CONFIRMAR_SERVICIO"
        
    elif paso == "CONFIRMAR_SERVICIO":
        if text.lower() in ["si", "sí", "s", "ok"]:
            # Crear el servicio en estado PENDIENTE
            nuevo_servicio = models.Servicio(
                usuario_id=usuario.id,
                empresa_id=usuario.empresa_id,
                direccion_origen=session.datos_temporales["origen"],
                direccion_destino=session.datos_temporales["destino"],
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
                msg_supervisor = f"🔔 *Nuevo servicio solicitado*\nUsuario: {usuario.nombre}\n📍 Origen: {nuevo_servicio.direccion_origen}\n🏁 Destino: {nuevo_servicio.direccion_destino}\n\n¿Autoriza este servicio? Responda: *AUTORIZAR {nuevo_servicio.id}* o *RECHAZAR {nuevo_servicio.id}*"
                
                # Devolvemos una instrucción múltiple a n8n para enviar a 2 destinatarios
                return {
                    "action": "notify_multi",
                    "user_msg": {"phone": usuario.whatsapp, "message": "Tu solicitud ha sido enviada al supervisor para su autorización. Te notificaremos pronto."},
                    "supervisor_msg": {"phone": supervisor.whatsapp, "message": msg_supervisor}
                }
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
