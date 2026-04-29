from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

# Tabla de asociación para la relación Muchos a Muchos entre Conductores y Vehículos
conductor_vehiculo = Table(
    "conductor_vehiculo",
    Base.metadata,
    Column("conductor_id", Integer, ForeignKey("drivers.id"), primary_key=True),
    Column("vehiculo_id", Integer, ForeignKey("vehiculos.id"), primary_key=True),
)

class Vehiculo(Base):
    __tablename__ = "vehiculos"
    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True)
    marca = Column(String)
    modelo = Column(String)
    anio = Column(Integer, nullable=True)
    capacidad = Column(Integer, nullable=True)
    tipo_servicio = Column(String, nullable=True)
    estado = Column(String, default="activo")  # activo, mantenimiento, inactivo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conductores = relationship("Conductor", secondary=conductor_vehiculo, back_populates="vehiculos")


class Empresa(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    nit = Column(String, unique=True, index=True)
    telefono = Column(String)
    email = Column(String, nullable=True)
    activa = Column(Boolean, default=True)
    
    supervisores = relationship("Supervisor", back_populates="empresa")
    usuarios = relationship("Usuario", back_populates="empresa")
    servicios = relationship("Servicio", back_populates="empresa")

class Supervisor(Base):
    __tablename__ = "supervisors"
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("companies.id"))
    nombre = Column(String)
    area = Column(String, nullable=True) # Area name for multi-supervisor companies
    whatsapp = Column(String, unique=True, index=True) # Phone with country code
    email = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    
    empresa = relationship("Empresa", back_populates="supervisores")
    servicios_autorizados = relationship("Servicio", back_populates="supervisor")

class Usuario(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("companies.id"))
    nombre = Column(String)
    whatsapp = Column(String, unique=True, index=True) # Phone with country code
    email = Column(String, nullable=True)
    cargo = Column(String, nullable=True)
    cedula = Column(String, nullable=True) # Last 4 digits or full for verification
    activo = Column(Boolean, default=True)
    
    empresa = relationship("Empresa", back_populates="usuarios")
    servicios = relationship("Servicio", back_populates="usuario")

class Conductor(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    telefono = Column(String, unique=True)
    whatsapp = Column(String, nullable=True)  # Número WhatsApp con código de país
    disponible = Column(Boolean, default=True)
    en_servicio = Column(Boolean, default=False)
    horario_disponibilidad = Column(JSON, nullable=True)
    
    servicios_asignados = relationship("Servicio", back_populates="conductor")
    vehiculos = relationship("Vehiculo", secondary=conductor_vehiculo, back_populates="conductores")

class Servicio(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    empresa_id = Column(Integer, ForeignKey("companies.id"))
    supervisor_id = Column(Integer, ForeignKey("supervisors.id"), nullable=True)
    conductor_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehiculo_asignado = Column(String, nullable=True)  # Placa/descripción del vehículo asignado
    
    direccion_origen = Column(String)
    direccion_destino = Column(String)
    hora_programada = Column(String, nullable=True) # Texto libre: "Hoy 10am", "25 Oct", etc.
    
    estado = Column(String, default="PENDIENTE") # PENDIENTE, AUTORIZADO, RECHAZADO, ASIGNADO, EN_CURSO, COMPLETADO, CANCELADO
    hora_solicitada_texto = Column(String, nullable=True)  # Texto libre que el usuario escribió en WhatsApp
    codigo_verificacion = Column(String, nullable=True)  # Código que el pasajero muestra al conductor
    encuesta_calificacion = Column(Integer, nullable=True)
    encuesta_comentario = Column(String, nullable=True)
    observaciones = Column(String, nullable=True)
    precio = Column(Integer, default=0)
    
    hora_inicio = Column(DateTime(timezone=True), nullable=True)
    hora_fin = Column(DateTime(timezone=True), nullable=True)
    
    es_retorno = Column(Boolean, default=False)
    retorno_de_id = Column(Integer, ForeignKey("services.id"), nullable=True)

    # --- Logística / Transporte de Materiales ---
    tipo_servicio = Column(String, default="PASAJERO")  # PASAJERO, LOGISTICA
    descripcion_material = Column(String, nullable=True)
    fotos_inicio = Column(JSON, nullable=True)   # Lista de URLs Cloudinary al recoger
    fotos_fin = Column(JSON, nullable=True)       # Lista de URLs Cloudinary al entregar

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    usuario = relationship("Usuario", back_populates="servicios")
    empresa = relationship("Empresa", back_populates="servicios")
    supervisor = relationship("Supervisor", back_populates="servicios_autorizados")
    conductor = relationship("Conductor", back_populates="servicios_asignados")

class WaSession(Base):
    __tablename__ = "wa_sessions"
    id = Column(Integer, primary_key=True, index=True)
    whatsapp_number = Column(String, unique=True, index=True)
    paso_actual = Column(String, default="INICIO")
    datos_temporales = Column(JSON, default={})
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class LogAuditoria(Base):
    __tablename__ = "log_auditoria"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, index=True)
    accion = Column(String)
    tabla_afectada = Column(String)
    fecha = Column(DateTime(timezone=True), server_default=func.now())

class UsuarioDashboard(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    nombre = Column(String)
    telefono = Column(String, nullable=True)
    cedula = Column(String, nullable=True)
    rol = Column(Integer) # 1: admin, 2: conductor, 4: autorizador, 5: master_supervisor
    estado = Column(String, default="activo")
    empresa_cliente_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    empresa_transportista_id = Column(Integer, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
