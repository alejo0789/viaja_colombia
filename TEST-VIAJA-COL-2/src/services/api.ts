import { apiRequest } from '../lib/api';

// ============================================================================
// ADMIN API
// ============================================================================
export const adminAPI = {
  getDashboard: async () => {
    return apiRequest('/api/admin/dashboard');
  },

  getStats: async (filters?: {
    empresa?: string;
    mes?: string;
    desde?: string;
    hasta?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.empresa) params.append('empresa', filters.empresa);
    if (filters?.mes) params.append('mes', filters.mes);
    if (filters?.desde) params.append('desde', filters.desde);
    if (filters?.hasta) params.append('hasta', filters.hasta);
    const query = params.toString();
    return apiRequest(`/api/admin/dashboard${query ? '?' + query : ''}`);
  },

  getSolicitudes: async (filters?: {
    estado?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.desde) params.append('desde', filters.desde);
    if (filters?.hasta) params.append('hasta', filters.hasta);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.size) params.append('size', filters.size.toString());
    const query = params.toString();
    return apiRequest(
      `/api/admin/solicitudes${query ? '?' + query : ''}`
    );
  },

  asignarServicio: async (solicitudId: string, conductorId: string, vehiculoId?: string) => {
    return apiRequest('/api/admin/asignar-servicio', {
      method: 'POST',
      body: JSON.stringify({ solicitudId, conductorId, vehiculoId }),
    });
  },

  getConductores: async (filters?: { estado?: string; empresa?: string }) => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.empresa) params.append('empresa', filters.empresa);
    const query = params.toString();
    return apiRequest(
      `/api/admin/conductores${query ? '?' + query : ''}`
    );
  },

  getVehiculos: async (filters?: { empresa?: string }) => {
    const params = new URLSearchParams();
    if (filters?.empresa) params.append('empresa', filters.empresa);
    const query = params.toString();
    return apiRequest(`/api/admin/vehiculos${query ? '?' + query : ''}`);
  },

  getTiposServicio: async () => {
    return apiRequest('/api/admin/tipos-servicio');
  },

  getAlertas: async () => {
    return apiRequest('/api/admin/alertas');
  },

  getEmpresas: async () => {
    return apiRequest('/api/admin/empresas');
  },

  getEmpresaUsuariosPaginated: async (empresaId: number, page = 1, search = '', size = 10) => {
    return apiRequest(`/api/admin/empresas/${empresaId}/usuarios?page=${page}&search=${search}&size=${size}`);
  },

  createEmpresa: async (data: any) => {
    return apiRequest('/api/admin/empresas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createSupervisor: async (data: any) => {
    return apiRequest('/api/admin/supervisores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createUsuario: async (data: any) => {
    return apiRequest('/api/admin/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSupervisor: async (id: number, data: any) => {
    return apiRequest(`/api/admin/supervisores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteSupervisor: async (id: number) => {
    return apiRequest(`/api/admin/supervisores/${id}`, {
      method: 'DELETE',
    });
  },

  updateUsuario: async (id: number, data: any) => {
    return apiRequest(`/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteUsuario: async (id: number) => {
    return apiRequest(`/api/admin/usuarios/${id}`, {
      method: 'DELETE',
    });
  },

  updateEmpresa: async (
    id: string,
    data: { nombre?: string; tipo?: string; contacto?: string }
  ) => {
    return apiRequest(`/api/admin/empresas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteEmpresa: async (id: string) => {
    return apiRequest(`/api/admin/empresas/${id}`, {
      method: 'DELETE',
    });
  },

  getRankingConductores: async (filtro?: { mes?: string; empresa?: string }) => {
    const params = new URLSearchParams();
    if (filtro?.mes) params.append('mes', filtro.mes);
    if (filtro?.empresa) params.append('empresa', filtro.empresa);
    const query = params.toString();
    return apiRequest(
      `/api/admin/ranking-conductores${query ? '?' + query : ''}`
    );
  },
};

// ============================================================================
// CONDUCTOR API
// ============================================================================
export const conductorAPI = {
  getServiciosHoy: async () => {
    return apiRequest('/api/conductor/servicios-hoy');
  },

  getServicio: async (id: string) => {
    return apiRequest(`/api/conductor/servicios/${id}`);
  },

  getHistorial: async (filtro?: { desde?: string; hasta?: string }) => {
    const params = new URLSearchParams();
    if (filtro?.desde) params.append('desde', filtro.desde);
    if (filtro?.hasta) params.append('hasta', filtro.hasta);
    const query = params.toString();
    return apiRequest(
      `/api/conductor/historial${query ? '?' + query : ''}`
    );
  },

  iniciarServicio: async (servicioId: string) => {
    return apiRequest(`/api/conductor/servicios/${servicioId}/iniciar`, {
      method: 'POST',
    });
  },

  finalizarServicio: async (servicioId: string, datos?: any) => {
    return apiRequest(
      `/api/conductor/servicios/${servicioId}/finalizar`,
      {
        method: 'POST',
        body: JSON.stringify(datos || {}),
      }
    );
  },

  actualizarUbicacion: async (
    servicioId: string,
    latitude: number,
    longitude: number
  ) => {
    return apiRequest(
      `/api/conductor/servicios/${servicioId}/ubicacion`,
      {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
      }
    );
  },
};

// ============================================================================
// AUTORIZADOR API
// ============================================================================
export const autorizadorAPI = {
  getSolicitudes: async (filtro?: {
    estado?: string;
    desde?: string;
    hasta?: string;
  }) => {
    const params = new URLSearchParams();
    if (filtro?.estado) params.append('estado', filtro.estado);
    if (filtro?.desde) params.append('desde', filtro.desde);
    if (filtro?.hasta) params.append('hasta', filtro.hasta);
    const query = params.toString();
    return apiRequest(
      `/api/autorizador/solicitudes${query ? '?' + query : ''}`
    );
  },

  autorizarSolicitud: async (
    solicitudId: string,
    datos?: { comentario?: string }
  ) => {
    return apiRequest(
      `/api/autorizador/solicitudes/${solicitudId}/autorizar`,
      {
        method: 'POST',
        body: JSON.stringify(datos || {}),
      }
    );
  },

  rechazarSolicitud: async (solicitudId: string, razon?: string) => {
    return apiRequest(
      `/api/autorizador/solicitudes/${solicitudId}/rechazar`,
      {
        method: 'POST',
        body: JSON.stringify({ razon: razon || '' }),
      }
    );
  },

  getEstadisticas: async (filtro?: { desde?: string; hasta?: string }) => {
    const params = new URLSearchParams();
    if (filtro?.desde) params.append('desde', filtro.desde);
    if (filtro?.hasta) params.append('hasta', filtro.hasta);
    const query = params.toString();
    return apiRequest(
      `/api/autorizador/estadisticas${query ? '?' + query : ''}`
    );
  },

  getEmpleados: async () => {
    return apiRequest('/api/autorizador/empleados');
  },

  createEmpleado: async (data: {
    nombre: string;
    email: string;
    cargo: string;
  }) => {
    return apiRequest('/api/autorizador/empleados', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateEmpleado: async (
    id: string,
    data: { nombre?: string; cargo?: string }
  ) => {
    return apiRequest(`/api/autorizador/empleados/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteEmpleado: async (id: string) => {
    return apiRequest(`/api/autorizador/empleados/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// REPORTES API
// ============================================================================
export const reportesAPI = {
  getServiciosPorDia: async (filtro?: {
    desde?: string;
    hasta?: string;
    empresa?: string;
  }) => {
    const params = new URLSearchParams();
    if (filtro?.desde) params.append('desde', filtro.desde);
    if (filtro?.hasta) params.append('hasta', filtro.hasta);
    if (filtro?.empresa) params.append('empresa', filtro.empresa);
    const query = params.toString();
    return apiRequest(
      `/api/reportes/servicios-por-dia${query ? '?' + query : ''}`
    );
  },

  getPorTipoServicio: async (filtro?: {
    desde?: string;
    hasta?: string;
  }) => {
    const params = new URLSearchParams();
    if (filtro?.desde) params.append('desde', filtro.desde);
    if (filtro?.hasta) params.append('hasta', filtro.hasta);
    const query = params.toString();
    return apiRequest(
      `/api/reportes/por-tipo-servicio${query ? '?' + query : ''}`
    );
  },

  getExcedentes: async (filtro?: {
    desde?: string;
    hasta?: string;
    empresa?: string;
  }) => {
    const params = new URLSearchParams();
    if (filtro?.desde) params.append('desde', filtro.desde);
    if (filtro?.hasta) params.append('hasta', filtro.hasta);
    if (filtro?.empresa) params.append('empresa', filtro.empresa);
    const query = params.toString();
    return apiRequest(
      `/api/reportes/excedentes${query ? '?' + query : ''}`
    );
  },

  simularTarifa: async (datos: {
    origen: string;
    destino: string;
    tipoServicio: string;
  }) => {
    return apiRequest('/api/reportes/simular-tarifa', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  exportarReporte: async (tipo: string, filtro?: any) => {
    const params = new URLSearchParams();
    params.append('tipo', tipo);
    if (filtro?.desde) params.append('desde', filtro.desde);
    if (filtro?.hasta) params.append('hasta', filtro.hasta);
    if (filtro?.empresa) params.append('empresa', filtro.empresa);
    return apiRequest(`/api/reportes/exportar?${params.toString()}`);
  },
};

// ============================================================================
// PERFIL API
// ============================================================================
export const perfilAPI = {
  getPerfil: async () => {
    return apiRequest('/api/perfil');
  },

  actualizarPerfil: async (datos: {
    nombre?: string;
    email?: string;
    telefono?: string;
  }) => {
    return apiRequest('/api/perfil', {
      method: 'PATCH',
      body: JSON.stringify(datos),
    });
  },

  cambiarPassword: async (passwordActual: string, passwordNueva: string) => {
    return apiRequest('/api/perfil/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
  },
};

// ============================================================================
// NOTIFICACIONES API (WhatsApp via Backend)
// ============================================================================
export const notificacionesAPI = {
  enviarWhatsApp: async (
    telefono: string,
    mensaje: string,
    tipo?: string
  ) => {
    return apiRequest('/api/notificaciones/whatsapp', {
      method: 'POST',
      body: JSON.stringify({ telefono, mensaje, tipo: tipo || 'GENERAL' }),
    });
  },

  getNotificaciones: async () => {
    return apiRequest('/api/notificaciones');
  },

  marcarLeida: async (id: string) => {
    return apiRequest(`/api/notificaciones/${id}/leer`, {
      method: 'POST',
    });
  },
};
