-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE rol_usuario AS ENUM ('admin_transportista', 'conductor', 'autorizador', 'pasajero');
CREATE TYPE estado_solicitud AS ENUM ('pendiente_autorizacion', 'autorizada', 'rechazada', 'asignada', 'en_curso', 'finalizada', 'cancelada');
CREATE TYPE estado_general AS ENUM ('activo', 'inactivo', 'mantenimiento');
CREATE TYPE tipo_alerta AS ENUM ('tiempo_excedido', 'inconsistencia_datos', 'sin_asignar', 'sin_confirmar_inicio', 'retraso_inicio', 'duracion_inusual', 'nueva_solicitud');

-- Empresas clientes (companies that hire transportation)
CREATE TABLE empresas_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  nit VARCHAR(20) UNIQUE NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(100),
  estado estado_general DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empresa transportista (the transport company that runs the app)
CREATE TABLE empresa_transportista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  nit VARCHAR(20) UNIQUE NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(100),
  whatsapp_admin VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios (all system users with JWT auth)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  telefono_whatsapp VARCHAR(20),
  rol rol_usuario NOT NULL,
  empresa_cliente_id UUID REFERENCES empresas_clientes(id),
  empresa_transportista_id UUID REFERENCES empresa_transportista(id),
  estado estado_general DEFAULT 'activo',
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empleados autorizados (passengers who can request services via WhatsApp)
CREATE TABLE empleados_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_cliente_id UUID NOT NULL REFERENCES empresas_clientes(id),
  nombre VARCHAR(150) NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  cargo VARCHAR(100),
  telefono_whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  limite_servicios_mensual INTEGER DEFAULT 10,
  servicios_usados_mes INTEGER DEFAULT 0,
  estado estado_general DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_cliente_id, cedula)
);

-- Conductores
CREATE TABLE conductores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  nombre VARCHAR(150) NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  telefono_whatsapp VARCHAR(20) NOT NULL,
  licencia VARCHAR(50),
  categoria_licencia VARCHAR(10),
  licencia_vigencia DATE,
  estado estado_general DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehiculos
CREATE TABLE vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa VARCHAR(10) UNIQUE NOT NULL,
  marca VARCHAR(50),
  modelo VARCHAR(50),
  anio INTEGER,
  capacidad INTEGER DEFAULT 4,
  tipo VARCHAR(50) DEFAULT 'sedan',
  color VARCHAR(30),
  conductor_asignado_id UUID REFERENCES conductores(id),
  estado estado_general DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de servicio con tarifas
CREATE TABLE tipos_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tarifa_base NUMERIC(12,2) NOT NULL,
  tiempo_max_incluido_min INTEGER NOT NULL,
  costo_bloque_extra NUMERIC(12,2) NOT NULL,
  bloque_extra_min INTEGER NOT NULL,
  recargo_nocturno_pct NUMERIC(5,2) DEFAULT 30,
  recargo_festivo_pct NUMERIC(5,2) DEFAULT 20,
  hora_inicio_nocturno TIME DEFAULT '20:00',
  hora_fin_nocturno TIME DEFAULT '06:00',
  empresa_transportista_id UUID REFERENCES empresa_transportista(id),
  estado estado_general DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitudes de servicio
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud SERIAL NOT NULL,
  empleado_id UUID NOT NULL REFERENCES empleados_autorizados(id),
  empresa_cliente_id UUID NOT NULL REFERENCES empresas_clientes(id),
  tipo_servicio_id UUID NOT NULL REFERENCES tipos_servicio(id),
  direccion_recogida TEXT NOT NULL,
  direccion_destino TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_programada TIME NOT NULL,
  estado estado_solicitud DEFAULT 'pendiente_autorizacion',
  observaciones TEXT,
  autorizado_por UUID REFERENCES usuarios(id),
  fecha_autorizacion TIMESTAMPTZ,
  motivo_rechazo TEXT,
  canal_solicitud VARCHAR(20) DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asignaciones (conductor + vehiculo asignado a solicitud)
CREATE TABLE asignaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL UNIQUE REFERENCES solicitudes(id),
  conductor_id UUID NOT NULL REFERENCES conductores(id),
  vehiculo_id UUID NOT NULL REFERENCES vehiculos(id),
  fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
  hora_inicio_real TIMESTAMPTZ,
  hora_fin_real TIMESTAMPTZ,
  cedula_confirmada VARCHAR(20),
  cedula_valida BOOLEAN DEFAULT FALSE,
  duracion_min INTEGER,
  tiempo_excedido_min INTEGER DEFAULT 0,
  bloques_extra INTEGER DEFAULT 0,
  tarifa_base_aplicada NUMERIC(12,2),
  costo_extra NUMERIC(12,2) DEFAULT 0,
  recargo_aplicado NUMERIC(12,2) DEFAULT 0,
  tarifa_total NUMERIC(12,2),
  alerta_generada BOOLEAN DEFAULT FALSE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas del sistema
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asignacion_id UUID REFERENCES asignaciones(id),
  solicitud_id UUID REFERENCES solicitudes(id),
  tipo tipo_alerta NOT NULL,
  mensaje TEXT NOT NULL,
  datos_adicionales JSONB DEFAULT '{}',
  leida BOOLEAN DEFAULT FALSE,
  resuelta BOOLEAN DEFAULT FALSE,
  resuelta_por UUID REFERENCES usuarios(id),
  fecha_resolucion TIMESTAMPTZ,
  notas_resolucion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp sessions (chatbot state machine)
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono VARCHAR(20) UNIQUE NOT NULL,
  empleado_id UUID REFERENCES empleados_autorizados(id),
  estado_conversacion VARCHAR(50) DEFAULT 'inicio',
  datos_temporales JSONB DEFAULT '{}',
  ultimo_mensaje_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE log_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  accion VARCHAR(100) NOT NULL,
  tabla_afectada VARCHAR(100),
  registro_id UUID,
  datos_nuevos JSONB,
  ip VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_solicitudes_empresa ON solicitudes(empresa_cliente_id);
CREATE INDEX idx_solicitudes_fecha ON solicitudes(fecha);
CREATE INDEX idx_solicitudes_empleado ON solicitudes(empleado_id);
CREATE INDEX idx_asignaciones_conductor ON asignaciones(conductor_id);
CREATE INDEX idx_asignaciones_solicitud ON asignaciones(solicitud_id);
CREATE INDEX idx_asignaciones_vehiculo ON asignaciones(vehiculo_id);
CREATE INDEX idx_alertas_resuelta ON alertas(resuelta, leida);
CREATE INDEX idx_alertas_asignacion ON alertas(asignacion_id);
CREATE INDEX idx_alertas_solicitud ON alertas(solicitud_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_empresa_cliente ON usuarios(empresa_cliente_id);
CREATE INDEX idx_usuarios_empresa_transportista ON usuarios(empresa_transportista_id);
CREATE INDEX idx_whatsapp_telefono ON whatsapp_sessions(telefono);
CREATE INDEX idx_empleados_whatsapp ON empleados_autorizados(telefono_whatsapp);
CREATE INDEX idx_empleados_cedula ON empleados_autorizados(cedula);
CREATE INDEX idx_empleados_empresa ON empleados_autorizados(empresa_cliente_id);
CREATE INDEX idx_conductores_usuario ON conductores(usuario_id);
CREATE INDEX idx_conductores_cedula ON conductores(cedula);
CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX idx_vehiculos_conductor ON vehiculos(conductor_asignado_id);
CREATE INDEX idx_tipos_servicio_empresa ON tipos_servicio(empresa_transportista_id);
CREATE INDEX idx_log_auditoria_usuario ON log_auditoria(usuario_id);

-- Seed: empresa transportista base
INSERT INTO empresa_transportista (nombre, nit, direccion, telefono, email, whatsapp_admin)
VALUES ('VIAJA COL S.A.S.', '900123456-7', 'Cra 7 #125-50, Bogotá', '+(57) 601 234-5678', 'admin@viajacol.com', '+573001234567');

-- Seed: tipos de servicio base
INSERT INTO tipos_servicio (nombre, descripcion, tarifa_base, tiempo_max_incluido_min, costo_bloque_extra, bloque_extra_min, recargo_nocturno_pct, recargo_festivo_pct, hora_inicio_nocturno, hora_fin_nocturno, empresa_transportista_id)
SELECT 'Urbano', 'Servicio de transporte dentro del área metropolitana', 50000, 59, 8000, 20, 30, 20, '20:00'::TIME, '06:00'::TIME, id FROM empresa_transportista LIMIT 1;

INSERT INTO tipos_servicio (nombre, descripcion, tarifa_base, tiempo_max_incluido_min, costo_bloque_extra, bloque_extra_min, recargo_nocturno_pct, recargo_festivo_pct, hora_inicio_nocturno, hora_fin_nocturno, empresa_transportista_id)
SELECT 'Intermunicipal', 'Servicio de transporte entre municipios', 120000, 120, 15000, 30, 30, 20, '20:00'::TIME, '06:00'::TIME, id FROM empresa_transportista LIMIT 1;

INSERT INTO tipos_servicio (nombre, descripcion, tarifa_base, tiempo_max_incluido_min, costo_bloque_extra, bloque_extra_min, recargo_nocturno_pct, recargo_festivo_pct, hora_inicio_nocturno, hora_fin_nocturno, empresa_transportista_id)
SELECT 'Aeropuerto', 'Servicio de transporte hacia/desde aeropuerto', 80000, 90, 12000, 20, 30, 20, '20:00'::TIME, '06:00'::TIME, id FROM empresa_transportista LIMIT 1;

INSERT INTO tipos_servicio (nombre, descripcion, tarifa_base, tiempo_max_incluido_min, costo_bloque_extra, bloque_extra_min, recargo_nocturno_pct, recargo_festivo_pct, hora_inicio_nocturno, hora_fin_nocturno, empresa_transportista_id)
SELECT 'Ejecutivo', 'Servicio ejecutivo de transporte', 100000, 59, 15000, 20, 30, 20, '20:00'::TIME, '06:00'::TIME, id FROM empresa_transportista LIMIT 1;

-- Seed: admin user (password: admin123 - bcrypt hash)
INSERT INTO usuarios (email, password_hash, nombre, telefono_whatsapp, rol, empresa_transportista_id, estado)
SELECT 'admin@viajacol.com', '$2b$12$LJ3m4ys3Gz8y3BTGP6VPxOzFJ/jZhSxnG9j1FfZFf4G9YW8XhQJfm', 'Administrador VIAJA COL', '+573001234567', 'admin_transportista', id, 'activo'
FROM empresa_transportista LIMIT 1;
