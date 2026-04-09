import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Briefcase, RefreshCw } from 'lucide-react';
import { conductorAPI } from '@/services/api';
import type { Solicitud } from '@/types';

// Mock data for fallback
const MOCK_SERVICIOS: (Solicitud & { asignacion_id?: string })[] = [
  {
    id: '1',
    asignacion_id: 'asig-001',
    empresa_cliente_id: 'emp-1',
    empleado_id: 'emp-1',
    direccion_recogida: 'Carrera 7 #45-32, Bogotá',
    direccion_destino: 'Av. Suba #120-45, Bogotá',
    fecha_servicio: new Date().toISOString().split('T')[0],
    hora_servicio: '09:00',
    tipo_servicio_id: 'tipo-1',
    estado: 'asignada',
    observaciones: 'Cliente VIP',
    created_at: new Date().toISOString(),
    empleado_nombre: 'Juan Pérez',
    tipo_servicio_nombre: 'Ejecutivo',
  },
  {
    id: '2',
    asignacion_id: 'asig-002',
    empresa_cliente_id: 'emp-1',
    empleado_id: 'emp-2',
    direccion_recogida: 'Centro Comercial Premium, Calle 83',
    direccion_destino: 'Torre B, Edificio Corporativo',
    fecha_servicio: new Date().toISOString().split('T')[0],
    hora_servicio: '10:30',
    tipo_servicio_id: 'tipo-1',
    estado: 'asignada',
    observaciones: '',
    created_at: new Date().toISOString(),
    empleado_nombre: 'Maria García',
    tipo_servicio_nombre: 'Ejecutivo',
  },
  {
    id: '3',
    asignacion_id: 'asig-003',
    empresa_cliente_id: 'emp-1',
    empleado_id: 'emp-3',
    direccion_recogida: 'Aeropuerto Internacional El Dorado',
    direccion_destino: 'Hotel Intercontinental, Carrera 10',
    fecha_servicio: new Date().toISOString().split('T')[0],
    hora_servicio: '14:00',
    tipo_servicio_id: 'tipo-2',
    estado: 'asignada',
    observaciones: 'Hospedaje incluido',
    created_at: new Date().toISOString(),
    empleado_nombre: 'Carlos López',
    tipo_servicio_nombre: 'Premium',
  },
];

export default function ServiceList() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: servicios = [], isLoading, refetch } = useQuery({
    queryKey: ['servicios-hoy'],
    queryFn: async () => {
      try {
        return await conductorAPI.getServiciosHoy();
      } catch (error) {
        console.error('Error fetching servicios:', error);
        return MOCK_SERVICIOS;
      }
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'asignada':
        return 'default';
      case 'en_curso':
        return 'secondary';
      case 'finalizada':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'asignada':
        return 'Asignada';
      case 'en_curso':
        return 'En curso';
      case 'finalizada':
        return 'Finalizada';
      default:
        return estado;
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto md:max-w-2xl">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Servicios</h2>
          <p className="text-sm text-gray-600">Hoy</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A5C]"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && servicios.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">No hay servicios asignados para hoy</p>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="space-y-4">
        {servicios.map((servicio) => (
          <Card
            key={servicio.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/conductor/servicio/${servicio.id}`)}
          >
            <CardContent className="pt-6">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-gray-500" />
                    <span className="font-semibold text-lg text-gray-900">
                      {servicio.hora_servicio}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{servicio.tipo_servicio_nombre}</p>
                </div>
                <Badge variant={getEstadoBadgeVariant(servicio.estado)}>
                  {getEstadoLabel(servicio.estado)}
                </Badge>
              </div>

              {/* Route */}
              <div className="space-y-3 mb-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Recogida</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {servicio.direccion_recogida}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Destino</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {servicio.direccion_destino}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="mb-4">
                <p className="text-xs text-gray-500">Pasajero</p>
                <p className="text-sm font-medium text-gray-900">{servicio.empleado_nombre}</p>
              </div>

              {/* Action Button */}
              {servicio.estado === 'asignada' && (
                <Button
                  className="w-full bg-[#1B3A5C] hover:bg-blue-900 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/conductor/servicio/${servicio.id}`);
                  }}
                >
                  Iniciar Servicio
                </Button>
              )}

              {servicio.estado === 'en_curso' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/conductor/servicio/${servicio.id}`);
                  }}
                >
                  Finalizar Servicio
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
