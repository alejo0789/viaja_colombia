import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Truck,
  Users,
  AlertCircle,
  TrendingUp,
  Clock,
  MapPin,
  FilterX,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { mockSolicitudes, mockAlertas, mockStats } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { useQuery } from '@tanstack/react-query';
import { useRealtimeSolicitudes } from '@/hooks/useRealtimeSolicitudes';

export default function Dashboard() {
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7));
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Tiempo real cada 10s
  useRealtimeSolicitudes(['admin-stats', 'admin-solicitudes-recent', 'admin-empresas']);

  // Cargar Empresas para el filtro
  const { data: empresasData } = useQuery({
    queryKey: ['admin-empresas'],
    queryFn: () => adminAPI.getEmpresas(),
  });
  const empresas = empresasData || [];

  // Parámetros de filtro
  const queryParams = {
    empresa: filterEmpresa !== 'all' ? filterEmpresa : undefined,
    mes: filterMes || undefined,
    desde: filterDesde || undefined,
    hasta: filterHasta || undefined,
  };

  // Cargar Estadísticas
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats', filterEmpresa, filterMes, filterDesde, filterHasta],
    queryFn: () => adminAPI.getStats(queryParams),
  });
  const stats = statsData || {
    totalSolicitudes: 0,
    vehiculosActivos: 0,
    conductoresActivos: 0,
    alertasActivas: 0,
    solicitudesPorEmpresa: []
  };

  // Cargar Solicitudes Recientes
  const { data: solicitudesData } = useQuery({
    queryKey: ['admin-solicitudes-recent', filterEmpresa, filterMes, filterDesde, filterHasta],
    queryFn: () => adminAPI.getSolicitudes(queryParams),
  });
  const recentSolicitudes = (solicitudesData?.data || []).slice(0, 5);

  const statCards = [
    {
      title: 'Solicitudes',
      value: stats.totalSolicitudes,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Vehículos',
      value: stats.vehiculosActivos,
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Conductores',
      value: stats.conductoresActivos,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Alertas',
      value: stats.alertasActivas,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 font-medium">Panel de control administrativo en tiempo real</p>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-4 md:p-6 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Empresa</label>
              <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {empresas.map(emp => (
                    <SelectItem key={emp.id} value={emp.nombre}>{emp.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Mes</label>
              <div className="relative">
                <Input 
                  type="month" 
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 pl-10"
                  value={filterMes} 
                  onChange={(e) => {
                      setFilterMes(e.target.value);
                      if (e.target.value) {
                          setFilterDesde('');
                          setFilterHasta('');
                      }
                  }} 
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Desde</label>
              <Input 
                type="date" 
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                value={filterDesde} 
                onChange={(e) => {
                    setFilterDesde(e.target.value);
                    if (e.target.value) setFilterMes('');
                }} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Hasta</label>
              <Input 
                type="date" 
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                value={filterHasta} 
                onChange={(e) => {
                    setFilterHasta(e.target.value);
                    if (e.target.value) setFilterMes('');
                }} 
              />
            </div>

            <Button 
                variant="outline" 
                className="h-11 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                onClick={() => {
                    setFilterEmpresa('all');
                    setFilterMes('');
                    setFilterDesde('');
                    setFilterHasta('');
                }}
            >
                <FilterX size={16} className="mr-2" />
                Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden border-slate-200 shadow-sm rounded-2xl hover:shadow-md transition-all group">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] md:text-xs uppercase font-bold text-slate-400 mb-1 tracking-wider">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                    <Icon className={`${stat.color} h-5 w-5 md:h-6 md:w-6`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Solicitudes */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900">Solicitudes Recientes</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs hover:bg-blue-50 rounded-lg">
                  Ver todas <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentSolicitudes.length > 0 ? recentSolicitudes.map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="flex items-start justify-between p-4 md:p-5 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="font-bold text-slate-400 text-xs">#{solicitud.id}</span>
                        <StatusBadge estado={solicitud.estado} />
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate mb-0.5">{solicitud.empresa || "Sin Empresa"}</p>
                      <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
                        <Users size={12} /> {solicitud.empleado}
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded-lg w-fit">
                          <MapPin size={12} className="text-blue-500" />
                          <span className="truncate max-w-[120px] md:max-w-none">{solicitud.origen}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded-lg w-fit">
                          <MapPin size={12} className="text-green-500" />
                          <span className="truncate max-w-[120px] md:max-w-none">{solicitud.destino}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-bold">
                        {solicitud.tipo_servicio}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        {solicitud.fecha}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-slate-400 italic">No hay solicitudes recientes.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          {/* Solicitudes por Empresa */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Empresas con más flujo</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {stats?.solicitudesPorEmpresa && stats.solicitudesPorEmpresa.length > 0 ? (
                  stats.solicitudesPorEmpresa.map((emp: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white hover:border-blue-200 transition-colors">
                      <span className="font-bold text-slate-700 text-sm truncate max-w-[150px]">{emp.empresa}</span>
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg px-2.5">
                        {emp.count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">No hay datos por el momento</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Alertas Activas</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border-l-4 shadow-sm ${
                        alert.nivel === 'critical'
                          ? 'bg-red-50 border-red-500'
                          : alert.nivel === 'warning'
                            ? 'bg-amber-50 border-amber-500'
                            : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          size={20}
                          className={
                            alert.nivel === 'critical'
                              ? 'text-red-600'
                              : alert.nivel === 'warning'
                                ? 'text-amber-600'
                                : 'text-blue-600'
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{alert.mensaje}</p>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(alert.fecha).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <CheckCircle2 size={32} className="text-green-500/30 mb-2" />
                    <p className="text-sm font-medium italic">Sistema sin alertas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper icons that were missing
const CheckCircle2 = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
