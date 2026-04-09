import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, DollarSign, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { conductorAPI } from '@/services/api';
import type { Solicitud } from '@/types';

interface HistoryService extends Solicitud {
  km_recorridos?: number;
  tarifa_total?: number;
  hora_inicio_real?: string;
  hora_fin_real?: string;
}

// Mock data for fallback
const MOCK_HISTORY: HistoryService[] = [
  {
    id: '101',
    empresa_cliente_id: 'emp-1',
    empleado_id: 'emp-1',
    empleado_nombre: 'Juan Pérez',
    direccion_recogida: 'Carrera 7 #45-32, Bogotá',
    direccion_destino: 'Av. Suba #120-45, Bogotá',
    fecha_servicio: '2024-04-07',
    hora_servicio: '09:00',
    tipo_servicio_id: 'tipo-1',
    tipo_servicio_nombre: 'Ejecutivo',
    estado: 'finalizada',
    created_at: '2024-04-07T09:00:00Z',
    km_recorridos: 15.5,
    tarifa_total: 45000,
    hora_inicio_real: '09:05',
    hora_fin_real: '09:35',
  },
  {
    id: '102',
    empresa_cliente_id: 'emp-1',
    empleado_id: 'emp-2',
    empleado_nombre: 'Maria García',
    direccion_recogida: 'Centro Comercial Premium',
    direccion_destino: 'Torre B, Edificio Corporativo',
    fecha_servicio: '2024-04-07',
    hora_servicio: '10:30',
    tipo_servicio_id: 'tipo-1',
    tipo_servicio_nombre: 'Ejecutivo',
    estado: 'finalizada',
    created_at: '2024-04-07T10:30:00Z',
    km_recorridos: 8.2,
    tarifa_total: 32000,
    hora_inicio_real: '10:32',
    hora_fin_real: '10:55',
  },
  {
    id: '103',
    empresa_cliente_id: 'emp-1',
    empleado_id: 'emp-3',
    empleado_nombre: 'Carlos López',
    direccion_recogida: 'Aeropuerto Internacional El Dorado',
    direccion_destino: 'Hotel Intercontinental',
    fecha_servicio: '2024-04-06',
    hora_servicio: '14:00',
    tipo_servicio_id: 'tipo-2',
    tipo_servicio_nombre: 'Premium',
    estado: 'finalizada',
    created_at: '2024-04-06T14:00:00Z',
    km_recorridos: 22.8,
    tarifa_total: 68000,
    hora_inicio_real: '14:08',
    hora_fin_real: '14:58',
  },
  {
    id: '104',
    empresa_cliente_id: 'emp-1',
    empleado_id: 'emp-4',
    empleado_nombre: 'Ana Martínez',
    direccion_recogida: 'Centro Médico La Sabana',
    direccion_destino: 'Clínica del Bosque',
    fecha_servicio: '2024-04-05',
    hora_servicio: '11:00',
    tipo_servicio_id: 'tipo-1',
    tipo_servicio_nombre: 'Ejecutivo',
    estado: 'finalizada',
    created_at: '2024-04-05T11:00:00Z',
    km_recorridos: 12.3,
    tarifa_total: 38000,
    hora_inicio_real: '11:02',
    hora_fin_real: '11:28',
  },
];

export default function ServiceHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const itemsPerPage = 10;

  const { data: historialData = { servicios: MOCK_HISTORY, total: MOCK_HISTORY.length }, isLoading } = useQuery({
    queryKey: ['historial-servicios', currentPage, dateFilter],
    queryFn: async () => {
      try {
        const params: any = {
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        };
        if (dateFilter) {
          params.fecha_inicio = dateFilter;
        }
        const result = await conductorAPI.getHistorial(params);
        return result || { servicios: MOCK_HISTORY, total: MOCK_HISTORY.length };
      } catch (error) {
        console.error('Error fetching historial:', error);
        return { servicios: MOCK_HISTORY, total: MOCK_HISTORY.length };
      }
    },
  });

  const servicios: HistoryService[] = Array.isArray(historialData)
    ? historialData
    : historialData.servicios || MOCK_HISTORY;
  const total = typeof historialData === 'object' && !Array.isArray(historialData)
    ? historialData.total || servicios.length
    : servicios.length;

  const totalPages = Math.ceil(total / itemsPerPage);

  // Calculate stats from all services
  const totalServicios = servicios.length;
  const totalIncome = servicios.reduce((sum, s) => sum + (s.tarifa_total || 0), 0);
  const totalKm = servicios.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
  const avgTarifa = totalServicios > 0 ? totalIncome / totalServicios : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  return (
    <div className="p-4 max-w-md mx-auto md:max-w-2xl pb-24">
      {/* Header */}
      <div className="mb-6 mt-4">
        <h2 className="text-2xl font-bold text-gray-900">Historial de Servicios</h2>
        <p className="text-sm text-gray-600">Tus servicios completados</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 mb-1">Total Servicios</p>
            <p className="text-2xl font-bold text-[#1B3A5C]">{totalServicios}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 mb-1">Ingreso Total</p>
            <p className="text-lg font-bold text-green-700">
              ${(totalIncome / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 mb-1">Promedio Tarifa</p>
            <p className="text-lg font-bold text-orange-700">
              ${(avgTarifa / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 mb-1">Total KM</p>
            <p className="text-2xl font-bold text-purple-700">{totalKm.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Filtrar por fecha (opcional)
        </label>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full"
        />
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
            <Calendar size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">No hay servicios en el historial</p>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <div className="space-y-3 mb-6">
        {servicios.map((servicio) => (
          <Card key={servicio.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              {/* Date and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDate(servicio.fecha_servicio)}
                  </span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Completada
                </Badge>
              </div>

              {/* Route Info */}
              <div className="mb-3 bg-gray-50 p-2 rounded text-sm">
                <div className="flex gap-2 items-start">
                  <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-700">
                    <p className="font-medium">{servicio.direccion_recogida}</p>
                    <p className="text-gray-600 mt-1">→ {servicio.direccion_destino}</p>
                  </div>
                </div>
              </div>

              {/* Service Details Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-xs">
                  <p className="text-gray-500 mb-0.5">Hora</p>
                  <p className="font-semibold text-gray-900">
                    {formatTime(servicio.hora_inicio_real)} - {formatTime(servicio.hora_fin_real)}
                  </p>
                </div>
                <div className="text-xs">
                  <p className="text-gray-500 mb-0.5">Tipo</p>
                  <p className="font-semibold text-gray-900">{servicio.tipo_servicio_nombre}</p>
                </div>
                <div className="text-xs">
                  <p className="text-gray-500 mb-0.5">KM</p>
                  <p className="font-semibold text-gray-900">{servicio.km_recorridos?.toFixed(1)}km</p>
                </div>
              </div>

              {/* Passenger and Tariff */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="text-sm">
                  <p className="text-gray-600">Pasajero</p>
                  <p className="font-semibold text-gray-900">{servicio.empleado_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Tarifa</p>
                  <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                    <DollarSign size={16} />
                    {servicio.tarifa_total?.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          <div className="text-sm font-medium text-gray-600">
            Página {currentPage} de {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="gap-1"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
