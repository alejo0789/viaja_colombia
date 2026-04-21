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

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
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

  const COLORS = [
    '#10b981', // Finalizados (Emerald)
    '#f59e0b', // Pendientes (Amber)
    '#3b82f6', // Por Asignar (Blue)
    '#8b5cf6', // En Curso (Violet)
    '#ef4444', // Rechazados (Red)
  ];

  if (isStatsLoading) {
    return <div className="p-6 text-center text-gray-500">Cargando estadísticas...</div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-black text-[#1B3A5C] tracking-tight">Dashboard del Autorizador</h1>
            <p className="text-gray-500 text-sm font-medium">Gestiona y monitorea tus solicitudes de transporte asignadas.</p>
        </div>
        
        {/* Filtros de Fecha */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col px-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desde</span>
                <Input 
                    type="date" 
                    value={desde} 
                    onChange={(e) => setDesde(e.target.value)} 
                    className="h-8 border-none focus-visible:ring-0 text-xs py-0 font-bold"
                />
            </div>
            <div className="w-px h-8 bg-gray-100 mx-1"></div>
            <div className="flex flex-col px-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hasta</span>
                <Input 
                    type="date" 
                    value={hasta} 
                    onChange={(e) => setHasta(e.target.value)} 
                    className="h-8 border-none focus-visible:ring-0 text-xs py-0 font-bold"
                />
            </div>
            { (desde || hasta) && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setDesde(''); setHasta(''); }}
                    className="text-xs text-red-500 hover:bg-red-50 rounded-xl"
                >
                    Limpiar
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-gray-900">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfica de Tendencia */}
        <Card className="border-none shadow-lg rounded-2xl overflow-hidden min-h-[400px]">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <BarChart3 className="text-blue-600" size={20} />
                Uso Mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficas?.tendencia || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="servicios" fill="#1B3A5C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de Distribución */}
        <Card className="border-none shadow-lg rounded-2xl overflow-hidden min-h-[400px]">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <PieIcon className="text-amber-600" size={20} />
                Estado de Autorizaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graficas?.distribucion || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {(graficas?.distribucion || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default AutorizadorDashboard;
