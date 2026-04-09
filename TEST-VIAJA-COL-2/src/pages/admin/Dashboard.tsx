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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { mockSolicitudes, mockAlertas, mockStats } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    totalSolicitudes: 0,
    vehiculosActivos: 0,
    conductoresActivos: 0,
    alertasActivas: 0,
    solicitudesPorEmpresa: []
  });
  const [recentSolicitudes, setRecentSolicitudes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7));
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');

  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch for dropdown companies
    const fetchEmpresas = async () => {
        try {
            const data = await adminAPI.getEmpresas();
            setEmpresas(data || []);
        } catch (e) {
            console.error('Error fetching empresas:', e);
        }
    };
    fetchEmpresas();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = {
            empresa: filterEmpresa !== 'all' ? filterEmpresa : undefined,
            mes: filterMes || undefined,
            desde: filterDesde || undefined,
            hasta: filterHasta || undefined,
        };
        const [statsData, solicitudesData] = await Promise.all([
          adminAPI.getStats(queryParams),
          adminAPI.getSolicitudes(queryParams)
        ]);
        setStats(statsData);
        setRecentSolicitudes((solicitudesData.data || []).slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, [filterEmpresa, filterMes, filterDesde, filterHasta]);

  const statCards = [
    {
      title: 'Total Solicitudes',
      value: stats.totalSolicitudes,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Vehículos Activos',
      value: stats.vehiculosActivos,
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Conductores Activos',
      value: stats.conductoresActivos,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Alertas Activas',
      value: stats.alertasActivas,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#1B3A5C]">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al panel de control administrativo</p>
      </div>

      {/* Filters Toolbar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">Empresa</label>
              <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {empresas.map(emp => (
                    <SelectItem key={emp.id} value={emp.nombre}>{emp.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <label className="text-xs text-gray-500 mb-1 block">Filtrar por Mes</label>
              <Input 
                type="month" 
                value={filterMes} 
                onChange={(e) => {
                    setFilterMes(e.target.value);
                    if (e.target.value) {
                        setFilterDesde('');
                        setFilterHasta('');
                    }
                }} 
              />
            </div>

            <div className="w-[160px]">
              <label className="text-xs text-gray-500 mb-1 block">Desde (Fecha)</label>
              <Input 
                type="date" 
                value={filterDesde} 
                onChange={(e) => {
                    setFilterDesde(e.target.value);
                    if (e.target.value) setFilterMes('');
                }} 
              />
            </div>

            <div className="w-[160px]">
              <label className="text-xs text-gray-500 mb-1 block">Hasta (Fecha)</label>
              <Input 
                type="date" 
                value={filterHasta} 
                onChange={(e) => {
                    setFilterHasta(e.target.value);
                    if (e.target.value) setFilterMes('');
                }} 
              />
            </div>

            <Button 
                variant="outline" 
                onClick={() => {
                    setFilterEmpresa('all');
                    setFilterMes('');
                    setFilterDesde('');
                    setFilterHasta('');
                }}
            >
                <FilterX size={16} className="mr-2" />
                Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`${stat.color} h-6 w-6`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Solicitudes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Solicitudes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSolicitudes.map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-900">{solicitud.id}</span>
                        <StatusBadge estado={solicitud.estado} />
                      </div>
                      <p className="text-sm font-medium text-blue-900">{solicitud.empresa || "Empresa N/A"}</p>
                      <p className="text-sm text-gray-600">👤 {solicitud.empleado}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{solicitud.origen}</span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{solicitud.destino}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{solicitud.tipo_servicio}</Badge>
                      <p className="text-xs text-gray-500 mt-2">{solicitud.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          {/* Solicitudes por Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Solicitudes por Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.solicitudesPorEmpresa && stats.solicitudesPorEmpresa.length > 0 ? (
                  stats.solicitudesPorEmpresa.map((emp: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                      <span className="font-medium text-gray-800 text-sm truncate max-w-[150px]">{emp.empresa}</span>
                      <Badge variant="secondary" className="bg-[#1B3A5C] text-white">
                        {emp.count} servicios
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">No hay datos por el momento</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.nivel === 'critical'
                          ? 'bg-red-50 border-red-400'
                          : alert.nivel === 'warning'
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-blue-50 border-blue-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={18}
                          className={
                            alert.nivel === 'critical'
                              ? 'text-red-600'
                              : alert.nivel === 'warning'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                          }
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert.mensaje}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.fecha).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">No hay alertas activas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
