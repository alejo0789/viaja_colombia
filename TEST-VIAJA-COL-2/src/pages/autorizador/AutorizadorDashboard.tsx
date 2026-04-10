// ============================================================
// Autorizador Dashboard — Rol 4
// Archivo: src/pages/autorizador/AutorizadorDashboard.tsx
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { autorizadorAPI, reportesAPI } from '@/services/api';
import { useRealtimeSolicitudes } from '@/hooks/useRealtimeSolicitudes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, CheckCircle, XCircle, DollarSign, Clock, TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const AutorizadorDashboard = () => {
  useRealtimeSolicitudes(['autorizador-stats', 'autorizador-solicitudes']);

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['autorizador-stats', desde, hasta],
    queryFn: () => autorizadorAPI.getEstadisticas({ desde, hasta }),
  });

  const stats = statsData?.resumen;
  const graficas = statsData?.graficas;

  const cards = [
    { title: 'Total Servicios', value: stats?.total_servicios || 0, icon: FileText, color: 'text-blue-600' },
    { title: 'Autorizados', value: stats?.servicios_autorizados || 0, icon: CheckCircle, color: 'text-green-600' },
    { title: 'Rechazados', value: stats?.servicios_rechazados || 0, icon: XCircle, color: 'text-red-600' },
    { title: 'Pendientes', value: stats?.servicios_pendientes || 0, icon: Clock, color: 'text-amber-600' },
    { title: 'Costo Total', value: `$${(stats?.costo_total || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
    { title: 'Finalizados', value: stats?.servicios_finalizados || 0, icon: TrendingUp, color: 'text-purple-600' },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Cargando estadísticas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-[#1B3A5C]">Dashboard - Autorizador</h1>
            <p className="text-gray-500 text-sm">Monitorea el uso y estado de tus servicios de transporte.</p>
        </div>
        
        {/* Filtros de Fecha */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 ml-1">DESDE</span>
                <Input 
                    type="date" 
                    value={desde} 
                    onChange={(e) => setDesde(e.target.value)} 
                    className="h-8 border-none focus-visible:ring-0 text-xs py-0"
                />
            </div>
            <div className="w-px h-8 bg-gray-100 mx-1"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 ml-1">HASTA</span>
                <Input 
                    type="date" 
                    value={hasta} 
                    onChange={(e) => setHasta(e.target.value)} 
                    className="h-8 border-none focus-visible:ring-0 text-xs py-0"
                />
            </div>
            { (desde || hasta) && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setDesde(''); setHasta(''); }}
                    className="text-xs text-red-500 hover:bg-red-50"
                >
                    Limpiar
                </Button>
            )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Tendencia */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart3 className="text-blue-600" />
                Uso Mensual (Últimos 3 meses)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficas?.tendencia || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="servicios" fill="#1B3A5C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de Distribución */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <PieIcon className="text-amber-600" />
                Estado de Autorizaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graficas?.distribucion || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(graficas?.distribucion || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutorizadorDashboard;
