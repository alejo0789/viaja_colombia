import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { FileDown, Search, RefreshCw, DollarSign, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Reuse truncated cell pattern
const TruncatedCell = ({ text, maxWidth = "120px" }: { text: string; maxWidth?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text || text === '-') return <span className="text-gray-400">-</span>;
  return (
    <div
      className={`text-xs cursor-pointer transition-all duration-200 ${
        isExpanded
          ? "whitespace-normal bg-blue-50 p-2 rounded border border-blue-100 shadow-sm z-10 relative text-gray-900"
          : "truncate text-gray-500"
      }`}
      style={{ maxWidth: isExpanded ? '300px' : maxWidth }}
      onClick={() => setIsExpanded(!isExpanded)}
      title={isExpanded ? "Click para contraer" : "Click para ver completo"}
    >
      {text}
    </div>
  );
};

const formatPrice = (value: string | number) => {
  if (!value && value !== 0) return '—';
  const num = String(value).replace(/\D/g, '');
  if (!num || num === '0') return '—';
  return '$\u00a0' + num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function MasterAsignaciones() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMes, setFilterMes] = useState('all');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');

  const empresaNombre = user?.empresaClienteId ? undefined : undefined;

  // Obtener datos del dashboard para saber a qué empresa pertenece
  const { data: masterData } = useQuery({
    queryKey: ['master-dashboard'],
    queryFn: () => adminAPI.getMasterDashboard(),
  });

  // Cargar asignaciones — se filtra por empresa via el API
  const { data: solicitudesData, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['master-asignaciones', filterMes, filterDesde, filterHasta],
    queryFn: () =>
      adminAPI.getSolicitudes({
        estado: 'ASIGNADO,EN_CURSO,COMPLETADO',
        mes: filterMes !== 'all' ? filterMes : undefined,
        desde: filterDesde || undefined,
        hasta: filterHasta || undefined,
        size: 500,
      }),
    refetchInterval: 30000, // Auto-actualiza cada 30s para capturar cambios de precio
  });

  const todasSolicitudes = solicitudesData?.data || [];

  // Filtrar solo las solicitudes de la empresa del Supervisor General
  const empresaId = user?.empresaClienteId;
  const solicitudes = todasSolicitudes.filter((s: any) => {
    if (!empresaId) return true;
    // Match by name from master dashboard data
    if (masterData?.empresa_nombre && s.empresa) {
      return s.empresa === masterData.empresa_nombre;
    }
    return true;
  });

  const filteredSolicitudes = solicitudes.filter((s: any) => {
    const q = searchTerm.toLowerCase();
    return (
      String(s.id).toLowerCase().includes(q) ||
      s.empleado?.toLowerCase().includes(q) ||
      s.conductor?.toLowerCase().includes(q) ||
      s.placa?.toLowerCase().includes(q) ||
      s.origen?.toLowerCase().includes(q) ||
      s.destino?.toLowerCase().includes(q)
    );
  });

  const getMesesOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      options.push({ val, label });
    }
    return options;
  };

  const handleExportExcel = () => {
    if (filteredSolicitudes.length === 0) return;
    const dataToExport = filteredSolicitudes.map((s: any) => ({
      ID: s.id,
      'Fecha Solicitud': s.fecha,
      Empresa: s.empresa,
      Empleado: s.empleado,
      Origen: s.origen,
      Destino: s.destino,
      Observaciones: s.observaciones || '',
      'Fecha Programada': s.hora_programada,
      'Hora Inicio': s.hora_inicio || 'N/A',
      'Hora Fin': s.hora_fin || 'N/A',
      Duración: s.duracion || 'N/A',
      Conductor: s.conductor || 'N/A',
      Placa: s.placa || 'N/A',
      'Precio ($)': s.precio || 0,
      Estado: s.estado,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');
    XLSX.writeFile(workbook, `Asignaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-CO') : '—';

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#1B3A5C] tracking-tight flex items-center gap-3">
            <Eye className="text-purple-600" size={36} />
            Asignaciones
          </h1>
          <p className="text-gray-500 mt-1">
            Servicios asignados de tu empresa · Solo lectura · Precios actualizados por el administrador
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Última actualización</p>
            <p className="text-sm font-bold text-gray-700">{lastUpdated}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => refetch()}
            title="Actualizar datos ahora"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex gap-2 shadow-md"
            disabled={filteredSolicitudes.length === 0}
          >
            <FileDown size={18} />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Asignaciones', value: filteredSolicitudes.length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'En Curso', value: filteredSolicitudes.filter((s: any) => s.estado === 'EN_CURSO').length, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Completados', value: filteredSolicitudes.filter((s: any) => s.estado === 'COMPLETADO').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          {
            label: 'Total Facturado',
            value: '$\u00a0' + filteredSolicitudes
              .filter((s: any) => s.precio > 0)
              .reduce((acc: number, s: any) => acc + (s.precio || 0), 0)
              .toLocaleString('es-CO'),
            color: 'text-purple-700',
            bg: 'bg-purple-50'
          },
        ].map((stat, i) => (
          <Card key={i} className={`border-none shadow-sm ${stat.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="pt-5 space-y-3">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="ID, pasajero, conductor, origen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-[180px]">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Mes</label>
              <Select value={filterMes} onValueChange={setFilterMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier mes</SelectItem>
                  {getMesesOptions().map((opt) => (
                    <SelectItem key={opt.val} value={opt.val}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Desde</label>
                <Input type="date" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} className="w-[140px]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hasta</label>
                <Input type="date" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} className="w-[140px]" />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterMes('all'); setFilterDesde(''); setFilterHasta(''); setSearchTerm(''); }}
              className="text-gray-400 hover:text-gray-600"
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border border-gray-100 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="font-bold">ID</TableHead>
                <TableHead className="font-bold">F. Solicitud</TableHead>
                <TableHead className="font-bold">Pasajero</TableHead>
                <TableHead className="font-bold">Autorizador</TableHead>
                <TableHead className="font-bold">Origen</TableHead>
                <TableHead className="font-bold">Destino</TableHead>
                <TableHead className="font-bold">Observaciones</TableHead>
                <TableHead className="font-bold">Conductor / Placa</TableHead>
                <TableHead className="font-bold">Programado</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="font-bold">Inicio / Fin</TableHead>
                <TableHead className="font-bold">Duración</TableHead>
                <TableHead className="font-bold text-purple-700 flex items-center gap-1">
                  <DollarSign size={14} /> Precio
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-purple-400" size={32} />
                      <p className="text-gray-400 font-medium">Cargando asignaciones...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSolicitudes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-16 text-gray-400">
                    <Eye size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No se encontraron servicios asignados</p>
                    <p className="text-xs mt-1">Intenta cambiar los filtros</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSolicitudes.map((s: any) => {
                  let duracionDisplay = s.duracion || 'N/A';
                  if (s.estado === 'EN_CURSO' && s.hora_inicio_raw) {
                    const inicio = new Date(s.hora_inicio_raw);
                    const ahora = new Date();
                    const diffMin = Math.floor((ahora.getTime() - inicio.getTime()) / 60000);
                    duracionDisplay = `${diffMin} min (en curso)`;
                  }

                  return (
                    <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-bold text-blue-900">{s.id}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        <div className="flex flex-col">
                          <span>{s.fecha?.split(',')[0]}</span>
                          <span className="opacity-70">{s.fecha?.split(',')[1]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.empleado}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 text-xs">{s.autorizador_nombre || 'N/A'}</span>
                          {s.autorizador_area && s.autorizador_area !== 'N/A' && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit font-bold uppercase mt-0.5">
                              {s.autorizador_area}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><TruncatedCell text={s.origen} maxWidth="120px" /></TableCell>
                      <TableCell><TruncatedCell text={s.destino} maxWidth="120px" /></TableCell>
                      <TableCell><TruncatedCell text={s.observaciones} maxWidth="100px" /></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-900 leading-none">{s.conductor}</span>
                          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded w-fit font-mono font-bold">
                            {s.placa}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-700">{s.hora_programada}</TableCell>
                      <TableCell><StatusBadge estado={s.estado} /></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-[11px] font-medium">
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <span className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center text-[8px]">▶</span>
                            <span>{s.hora_inicio || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-rose-600">
                            <span className="w-3 h-3 rounded-full bg-rose-100 flex items-center justify-center text-[8px]">■</span>
                            <span>{s.hora_fin || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold ${s.estado === 'EN_CURSO' ? 'text-blue-600 animate-pulse' : 'text-amber-600'}`}>
                          {duracionDisplay}
                        </span>
                      </TableCell>
                      {/* Precio: solo lectura con badge visual */}
                      <TableCell>
                        {s.precio > 0 ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                            {formatPrice(s.precio)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs italic">Sin precio</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
