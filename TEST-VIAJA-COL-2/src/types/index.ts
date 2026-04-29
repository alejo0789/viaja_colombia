export type SolicitudEstado =
  | "pendiente_autorizacion"
  | "autorizada"
  | "asignada"
  | "en_curso"
  | "finalizada"
  | "cancelada"

export type VehiculoEstado = "activo" | "inactivo" | "mantenimiento"

export type ConductorEstado = "activo" | "inactivo"

export type AlertaNivel = "info" | "warning" | "critical"

export type EmpleadoEstado = "activo" | "inactivo"

export interface Solicitud {
  id: string
  empresa_cliente_id: string
  empleado_id: string
  direccion_recogida: string
  direccion_destino: string
  fecha_servicio: string
  hora_servicio: string
  tipo_servicio_id: string
  estado: SolicitudEstado
  observaciones?: string
  created_at: string
  empleado_nombre: string
  tipo_servicio_nombre: string
}

export interface Vehiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  año: number
  capacidad: number
  estado: VehiculoEstado
  tipo: string
  // Nuevos campos
  tipo_vehiculo?: string
  ciudad?: string
  propietario?: string
  cedula_propietario?: string
  fecha_matricula?: string
  soat_vencimiento?: string
  tecnomecanica_vencimiento?: string
  polizas_vencimiento?: string
  todo_riesgo_vencimiento?: string
  tarjeta_operacion_vencimiento?: string
  empresa_afiliada?: string
}

export interface Conductor {
  id: string
  usuario_id: string
  nombre: string
  cedula: string
  telefono: string
  licencia_vigencia: string
  estado: ConductorEstado
  vehiculo_asignado_id?: string
}

export interface Alerta {
  id: string
  tipo: string
  mensaje: string
  solicitud_id?: string
  nivel: AlertaNivel
  leida: boolean
  resuelta: boolean
  created_at: string
}

export interface TipoServicio {
  id: string
  nombre: string
  tarifa_base: number
  tiempo_base_minutos: number
  bloque_adicional_minutos: number
  empresa_transportista_id: string
}

export interface EmpleadoAutorizado {
  id: string
  empresa_cliente_id: string
  nombre: string
  cedula: string
  cargo: string
  telefono_whatsapp: string
  email: string
  estado: EmpleadoEstado
  limite_servicios_mensual: number
  servicios_usados_mes: number
}

export interface Asignacion {
  id: string
  solicitud_id: string
  conductor_id: string
  vehiculo_id: string
  hora_inicio_real?: string
  hora_fin_real?: string
  km_recorridos?: number
  tarifa_total?: number
  observaciones?: string
}

export interface DashboardStats {
  total_solicitudes: number
  vehiculos_activos: number
  conductores_activos: number
  alertas_activas: number
  solicitudes_por_estado: {
    pendiente_autorizacion: number
    autorizada: number
    asignada: number
    en_curso: number
    finalizada: number
    cancelada: number
  }
}
