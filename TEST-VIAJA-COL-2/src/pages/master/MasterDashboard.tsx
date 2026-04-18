import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  Building2, 
  Loader2,
  Calendar,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MasterDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['master-dashboard'],
    queryFn: () => adminAPI.getMasterDashboard(),
    refetchInterval: 30000 // Refrescar cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">Cargando datos de auditoría...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="bg-red-50 p-6 rounded-full text-red-600 mb-4">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Error al cargar datos</h2>
        <p className="text-gray-500 max-w-md mt-2">No se pudieron recuperar las estadísticas de auditoría. Por favor, intenta de nuevo más tarde o contacta al administrador.</p>
      </div>
    );
  }

  const { supervisores, stats } = data;

  const statCards = [
    {
      title: 'Total Autorizadores',
      value: stats.total_supervisores,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      detail: 'Supervisores activos'
    },
    {
      title: 'Servicios Autorizados',
      value: stats.total_autorizados,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      detail: 'Histórico acumulado'
    },
    {
      title: 'Empleados Autorizados',
      value: stats.total_empleados,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      detail: 'Personal con acceso'
    },
    {
      title: 'Solicitudes Totales',
      value: stats.total_servicios,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      detail: 'Todas las solicitudes'
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#1B3A5C] tracking-tight">Panel de Auditoría General</h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            <Building2 size={16} />
            Monitoreo y seguimiento de aprobaciones de servicios
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Sistema en Línea</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="p-6 relative">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor} opacity-20 rounded-bl-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`}></div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.title}</p>
                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">{stat.detail}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-2xl`}>
                    <Icon className={`${stat.color} h-6 w-6`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Supervisor Performance List */}
        <Card className="lg:col-span-2 border-none shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Actividad por Supervisor
              </CardTitle>
              <Badge variant="outline" className="text-blue-600 border-blue-200">En tiempo real</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {supervisores.map((s: any) => (
                <div key={s.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-black shadow-sm group-hover:scale-110 transition-transform">
                      {s.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{s.nombre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">{s.area || 'Sin Área'}</span>
                        {s.activo ? (
                          <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div> ACTIVO
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div> INACTIVO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-900">{s.autorizados}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Servicios Autorizados</p>
                  </div>
                </div>
              ))}
              {supervisores.length === 0 && (
                <div className="p-20 text-center text-gray-400 italic">
                  No se encontraron supervisores registrados para esta empresa.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Insight / Guidelines */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-[#1B3A5C] to-[#2c5c8f] text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <ShieldCheck size={20} />
                 Rol de Auditoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-100 leading-relaxed">
                Como Auditor General, tienes visibilidad completa sobre el flujo de aprobaciones de tu compañía.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                   <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                   <div className="text-xs">
                     <p className="font-bold">Monitoreo Directo</p>
                     <p className="opacity-70">Rastrea quién está autorizando cada servicio.</p>
                   </div>
                </div>
                <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                   <Users size={16} className="text-blue-300 shrink-0 mt-0.5" />
                   <div className="text-xs">
                     <p className="font-bold">Control de Personal</p>
                     <p className="opacity-70">Verifica que tus supervisores estén activos.</p>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
