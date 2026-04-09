// ============================================================
// Autorizador Dashboard — Rol 4
// Archivo: src/pages/autorizador/AutorizadorDashboard.tsx
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { autorizadorAPI, reportesAPI } from '@/services/api';
import { useRealtimeSolicitudes } from '@/hooks/useRealtimeSolicitudes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, DollarSign, Clock, TrendingUp } from 'lucide-react';

const AutorizadorDashboard = () => {
  useRealtimeSolicitudes(['autorizador-stats', 'autorizador-solicitudes']);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['autorizador-stats'],
    queryFn: () => autorizadorAPI.getEstadisticas(),
  });

  const stats = statsData?.resumen;

  const cards = [
    { title: 'Total Servicios', value: stats?.total_servicios || 0, icon: FileText, color: 'text-blue-600' },
    { title: 'Finalizados', value: stats?.servicios_finalizados || 0, icon: CheckCircle, color: 'text-green-600' },
    { title: 'Cancelados', value: stats?.servicios_cancelados || 0, icon: XCircle, color: 'text-red-600' },
    { title: 'Costo Total', value: `$${(stats?.costo_total || 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-600' },
    { title: 'Duración Promedio', value: `${Math.round(stats?.duracion_promedio_min || 0)} min`, icon: Clock, color: 'text-purple-600' },
    { title: 'Costo Excedentes', value: `$${(stats?.costo_excedentes || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-orange-600' },
  ];

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Cargando estadísticas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A5C]">Dashboard - Autorizador</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AutorizadorDashboard;
