import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Clock,
  User,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { conductorAPI } from '@/services/api';
import { toast } from 'sonner';
import type { Solicitud } from '@/types';

interface ServiceDetailData extends Solicitud {
  asignacion_id: string;
  hora_inicio_real?: string;
  hora_fin_real?: string;
  km_recorridos?: number;
  tarifa_total?: number;
  observaciones?: string;
}

// Mock data for fallback
const MOCK_SERVICE_DETAIL: ServiceDetailData = {
  id: '1',
  asignacion_id: 'asig-001',
  empresa_cliente_id: 'emp-1',
  empleado_id: 'emp-1',
  empleado_nombre: 'Juan Pérez García',
  direccion_recogida: 'Carrera 7 #45-32, Bogotá',
  direccion_destino: 'Av. Suba #120-45, Bogotá',
  fecha_servicio: new Date().toISOString().split('T')[0],
  hora_servicio: '09:00',
  tipo_servicio_id: 'tipo-1',
  tipo_servicio_nombre: 'Ejecutivo',
  estado: 'asignada',
  created_at: new Date().toISOString(),
  observaciones: 'Cliente VIP - Llegada flexible',
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [cedula, setCedula] = useState('');
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [kmRecorridos, setKmRecorridos] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const { data: servicio = MOCK_SERVICE_DETAIL, isLoading, error } = useQuery({
    queryKey: ['servicio', id],
    queryFn: async () => {
      try {
        return await conductorAPI.getServicio(id!);
      } catch (err) {
        console.error('Error fetching servicio:', err);
        return MOCK_SERVICE_DETAIL;
      }
    },
    enabled: !!id,
  });

  const startServiceMutation = useMutation({
    mutationFn: async (cedula_pasajero: string) => {
      return await conductorAPI.iniciarServicio({
        asignacion_id: servicio.asignacion_id,
        cedula_pasajero,
      });
    },
    onSuccess: () => {
      toast.success('Servicio iniciado correctamente');
      setStartDialogOpen(false);
      setCedula('');
      // Refetch service
      setTimeout(() => navigate('/conductor'), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al iniciar el servicio');
    },
  });

  const finishServiceMutation = useMutation({
    mutationFn: async () => {
      return await conductorAPI.finalizarServicio(servicio.asignacion_id);
    },
    onSuccess: (data) => {
      toast.success('Servicio finalizado correctamente');
      setFinishDialogOpen(false);
      setKmRecorridos('');
      setObservaciones('');
      setTimeout(() => navigate('/conductor'), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al finalizar el servicio');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A5C]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto md:max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <p className="text-red-600 text-center">Error cargando el servicio</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="p-4 max-w-md mx-auto md:max-w-2xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/conductor')}
          className="p-0 h-auto"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Detalle del Servicio</h2>
          <p className="text-sm text-gray-600">{servicio.hora_servicio}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <Badge className="bg-[#1B3A5C]">{getEstadoLabel(servicio.estado)}</Badge>
      </div>

      {/* Passenger Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User size={20} />
            Información del Pasajero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Nombre</p>
            <p className="font-medium text-gray-900">{servicio.empleado_nombre}</p>
          </div>
        </CardContent>
      </Card>

      {/* Route Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin size={20} />
            Ruta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <div className="flex-1">
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-1">Punto de Recogida</p>
                <p className="text-sm font-medium text-gray-900">
                  {servicio.direccion_recogida}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Destino</p>
                <p className="text-sm font-medium text-gray-900">
                  {servicio.direccion_destino}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Details Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase size={20} />
            Detalles del Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tipo de Servicio</p>
              <p className="font-medium text-gray-900">{servicio.tipo_servicio_nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Hora Programada</p>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Clock size={16} />
                {servicio.hora_servicio}
              </p>
            </div>
          </div>
          {servicio.observaciones && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">
                {servicio.observaciones}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline - Service Status */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="relative flex flex-col items-center">
                <div className="w-4 h-4 bg-[#1B3A5C] rounded-full mt-1.5"></div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-medium text-gray-900">Asignada</p>
                <p className="text-xs text-gray-500">Servicio asignado a su cuenta</p>
              </div>
            </div>

            {servicio.estado === 'en_curso' && (
              <div className="flex gap-3 items-start">
                <div className="relative flex flex-col items-center">
                  <div className="w-4 h-4 bg-[#1B3A5C] rounded-full mt-1.5"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-gray-900">En curso</p>
                  <p className="text-xs text-gray-500">
                    {servicio.hora_inicio_real || 'En proceso'}
                  </p>
                </div>
              </div>
            )}

            {servicio.estado === 'finalizada' && (
              <div className="flex gap-3 items-start">
                <div className="relative flex flex-col items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mt-1.5"></div>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-gray-900">Finalizada</p>
                  <p className="text-xs text-gray-500">Servicio completado</p>
                  {servicio.tarifa_total && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      Tarifa: ${servicio.tarifa_total.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {servicio.estado === 'asignada' && (
          <Button
            className="w-full bg-[#1B3A5C] hover:bg-blue-900 text-white text-base h-12"
            onClick={() => setStartDialogOpen(true)}
          >
            <CheckCircle size={18} className="mr-2" />
            Iniciar Servicio
          </Button>
        )}

        {servicio.estado === 'en_curso' && (
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white text-base h-12"
            onClick={() => setFinishDialogOpen(true)}
          >
            <CheckCircle size={18} className="mr-2" />
            Finalizar Servicio
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/conductor')}
        >
          Volver a Servicios
        </Button>
      </div>

      {/* Start Service Dialog - Cedula Confirmation */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cédula del Pasajero</DialogTitle>
            <DialogDescription>
              Ingresa el número de cédula del pasajero para iniciar el servicio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Número de cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              maxLength={20}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#1B3A5C]"
              onClick={() => startServiceMutation.mutate(cedula)}
              disabled={!cedula || startServiceMutation.isPending}
            >
              {startServiceMutation.isPending && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}
              Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Service Dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Servicio</DialogTitle>
            <DialogDescription>
              Completa la información para finalizar el servicio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Kilómetros Recorridos
              </label>
              <Input
                type="number"
                placeholder="Ej: 15.5"
                value={kmRecorridos}
                onChange={(e) => setKmRecorridos(e.target.value)}
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Observaciones (Opcional)
              </label>
              <Input
                placeholder="Notas sobre el servicio"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600"
              onClick={() => finishServiceMutation.mutate()}
              disabled={!kmRecorridos || finishServiceMutation.isPending}
            >
              {finishServiceMutation.isPending && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
