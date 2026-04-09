// ============================================================
// Autorizador Solicitudes — Autorizar/Rechazar servicios
// Archivo: src/pages/autorizador/AutorizadorSolicitudes.tsx
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { autorizadorAPI } from '@/services/api';
import { useRealtimeSolicitudes } from '@/hooks/useRealtimeSolicitudes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, MapPin, User, Calendar } from 'lucide-react';

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente_autorizacion: { label: 'Pendiente', variant: 'secondary' },
  autorizada: { label: 'Autorizada', variant: 'default' },
  rechazada: { label: 'Rechazada', variant: 'destructive' },
  asignada: { label: 'Asignada', variant: 'default' },
  en_curso: { label: 'En Curso', variant: 'default' },
  finalizada: { label: 'Finalizada', variant: 'outline' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
};

const AutorizadorSolicitudes = () => {
  const [filtroEstado, setFiltroEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [solicitudActiva, setSolicitudActiva] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useRealtimeSolicitudes(['autorizador-solicitudes']);

  const { data, isLoading } = useQuery({
    queryKey: ['autorizador-solicitudes', filtroEstado],
    queryFn: () => autorizadorAPI.getSolicitudes(filtroEstado ? { estado: filtroEstado } : {}),
  });

  const autorizarMutation = useMutation({
    mutationFn: (params: { solicitud_id: string; autorizado: boolean; observaciones?: string }) =>
      autorizadorAPI.autorizar(params),
    onSuccess: (_, variables) => {
      toast({
        title: variables.autorizado ? 'Solicitud autorizada' : 'Solicitud rechazada',
        description: `La solicitud ha sido ${variables.autorizado ? 'autorizada' : 'rechazada'} exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['autorizador-solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['autorizador-stats'] });
      setSolicitudActiva(null);
      setObservaciones('');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleAutorizar = (solicitudId: string, autorizado: boolean) => {
    autorizarMutation.mutate({
      solicitud_id: solicitudId,
      autorizado,
      observaciones: observaciones || undefined,
    });
  };

  const solicitudes = data?.solicitudes || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Solicitudes</h1>
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente_autorizacion">Pendientes</option>
          <option value="autorizada">Autorizadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="asignada">Asignadas</option>
          <option value="en_curso">En Curso</option>
          <option value="finalizada">Finalizadas</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-10">Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No hay solicitudes para mostrar.</div>
      ) : (
        <div className="grid gap-4">
          {solicitudes.map((sol: any) => {
            const badge = estadoBadge[sol.estado] || { label: sol.estado, variant: 'outline' as const };
            const isPendiente = sol.estado === 'pendiente_autorizacion';

            return (
              <Card key={sol.id} className={isPendiente ? 'border-amber-300 bg-amber-50/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Solicitud #{sol.numero_solicitud}
                    </CardTitle>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{sol.empleado?.nombre} — {sol.empleado?.cargo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{sol.fecha} a las {sol.hora_programada}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>{sol.direccion_recogida}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span>{sol.direccion_destino}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Tipo: {sol.tipo_servicio?.nombre} — Base: ${Number(sol.tipo_servicio?.tarifa_base || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Datos de asignación si existe */}
                  {sol.asignacion && sol.asignacion.tarifa_total && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">Tarifa total:</span> ${Number(sol.asignacion.tarifa_total).toLocaleString()}
                      {sol.asignacion.tiempo_excedido_min > 0 && (
                        <span className="text-orange-600 ml-2">
                          (+{sol.asignacion.tiempo_excedido_min} min excedido, {sol.asignacion.bloques_extra} bloques extra)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Acciones de autorización */}
                  {isPendiente && (
                    <div className="mt-3 space-y-2">
                      {solicitudActiva === sol.id && (
                        <Input
                          placeholder="Observaciones (opcional)"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                        />
                      )}
                      <div className="flex gap-2">
                        {solicitudActiva === sol.id ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAutorizar(sol.id, true)}
                              disabled={autorizarMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" /> Confirmar Autorización
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAutorizar(sol.id, false)}
                              disabled={autorizarMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" /> Confirmar Rechazo
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSolicitudActiva(null); setObservaciones(''); }}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setSolicitudActiva(sol.id)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Autorizar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSolicitudActiva(sol.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AutorizadorSolicitudes;
