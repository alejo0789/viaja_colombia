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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  FileDown, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  User, 
  Building2, 
  Car, 
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  PlayCircle,
  StopCircle,
  Timer,
  RefreshCw,
  ArrowRight,
  Pencil,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Componente ayudante para mostrar texto truncado que se expande al hacer clic
const TruncatedCell = ({ text, maxWidth = "120px", className = "" }: { text: string; maxWidth?: string; className?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text === '-') return <span className="text-slate-300">-</span>;
  
  return (
    <div 
      className={`text-xs cursor-pointer transition-all duration-200 ${
        isExpanded 
          ? "whitespace-normal bg-blue-50 p-2 rounded-xl border border-blue-100 shadow-sm z-10 relative left-0 text-slate-900" 
          : "truncate text-slate-500"
      } ${className}`}
      style={{ maxWidth: isExpanded ? '300px' : maxWidth }}
      onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
      title={isExpanded ? "Click para contraer" : "Click para ver completo"}
    >
      {text}
    </div>
  );
};

export default function Asignaciones() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [filterMes, setFilterMes] = useState('all');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');

  // Cargar empresas para el select
  const { data: empresasData } = useQuery({
    queryKey: ['admin-empresas-list'],
    queryFn: () => adminAPI.getEmpresas(),
  });
  const empresas = Array.isArray(empresasData) ? empresasData : [];

  const { data: solicitudesData, isLoading } = useQuery({
    queryKey: [
      'admin-solicitudes-asignadas', 
      page, 
      filterEmpresa, 
      filterMes, 
      filterDesde, 
      filterHasta
    ],
    queryFn: () => adminAPI.getSolicitudes({ 
      estado: 'ASIGNADO,EN_CURSO,COMPLETADO,CANCELADO', 
      empresa: filterEmpresa,
      mes: filterMes,
      desde: filterDesde,
      hasta: filterHasta,
      page, 
      size: 100 
    }),
  });

  const solicitudes = solicitudesData?.data || [];
  const totalPages = Math.ceil((solicitudesData?.total || 0) / 100) || 1;

  const filteredSolicitudes = solicitudes.filter((s: any) =>
    s.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.conductor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    if (filteredSolicitudes.length === 0) return;

    const dataToExport = filteredSolicitudes.map((s: any) => ({
      ID: s.id,
      'Fecha Solicitud': s.fecha,
      Empresa: s.empresa,
      Empleado: s.empleado,
      Origen: s.origen,
      Destino: s.destino,
      'Fecha Programada': s.hora_programada,
      'Hora Inicio': s.hora_inicio || 'N/A',
      'Hora Fin': s.hora_fin || 'N/A',
      Duracion: s.duracion || 'N/A',
      Conductor: s.conductor || 'N/A',
      Placa: s.placa || 'N/A',
      Precio: s.precio || 0,
      Estado: s.estado
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');
    XLSX.writeFile(workbook, `ViajaCol_Asignaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatPrice = (value: string | number) => {
    if (!value && value !== 0) return '';
    const num = String(value).replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const PriceEditor = ({ value, onSave, solicitud }: { value: number, onSave: (sol: any, val: string) => void, solicitud: any }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(formatPrice(value));

    if (!isEditing) {
      return (
        <div className="flex items-center justify-end gap-2 group/price">
          <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 transition-all hover:shadow-sm">
            ${formatPrice(value)}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 opacity-0 group-hover/price:opacity-100 transition-all bg-white border border-slate-200 rounded-md hover:bg-slate-50"
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={12} className="text-slate-500" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end gap-1 animate-in zoom-in-95 duration-200">
        <div className="relative flex items-center">
          <span className="absolute left-2 text-emerald-400 text-[10px] font-bold">$</span>
          <Input 
            className="h-8 w-28 pl-5 pr-2 text-xs font-black text-emerald-600 bg-white border-emerald-300 rounded-lg text-right focus:ring-emerald-200"
            value={tempValue}
            onChange={(e) => setTempValue(formatPrice(e.target.value))}
            autoFocus
            onBlur={() => {
               setTimeout(() => setIsEditing(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSave(solicitud, tempValue);
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
                setTempValue(formatPrice(value));
              }
            }}
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 rounded-lg"
          onMouseDown={(e) => {
            e.preventDefault();
            onSave(solicitud, tempValue);
            setIsEditing(false);
          }}
        >
          <CheckCircle2 size={18} />
        </Button>
      </div>
    );
  };

  const handleUpdatePrice = async (solicitud: any, newPrice: string) => {
    const priceValue = parseInt(newPrice.replace(/[^0-9]/g, '')) || 0;
    if (priceValue === solicitud.precio) return;
    
    try {
      const solicitudRealId = solicitud.original_id ?? solicitud.id;
      
      // Actualización optimista para que el export sea inmediato
      queryClient.setQueryData(['admin-solicitudes-asignadas'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((s: any) => s.id === solicitud.id ? { ...s, precio: priceValue } : s);
      });

      await adminAPI.updateSolicitud(solicitudRealId, { precio: priceValue });
      toast.success('Precio actualizado');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error al actualizar precio');
      queryClient.invalidateQueries({ queryKey: ['admin-solicitudes-asignadas'] });
    }
  };

  const MobileAsignacionCard = ({ s }: { s: any }) => {
    let duracionDisplay = s.duracion || 'N/A';
    if (s.estado === 'EN_CURSO' && s.hora_inicio_raw) {
      const inicio = new Date(s.hora_inicio_raw);
      const ahora = new Date();
      const diffMin = Math.floor((ahora.getTime() - inicio.getTime()) / 60000);
      duracionDisplay = `${diffMin} min (en curso)`;
    }

    return (
      <Card className="mb-4 border-slate-200 shadow-sm overflow-hidden rounded-2xl group">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-50 flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-400 text-xs">#{s.id}</span>
                <StatusBadge estado={s.estado} />
              </div>
              <h3 className="font-bold text-slate-900 truncate max-w-[180px]">{s.empleado}</h3>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{s.empresa}</p>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">{s.fecha}</span>
              <PriceEditor value={s.precio} onSave={handleUpdatePrice} solicitud={s} />
              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Valor Servicio</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <Car size={14} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Conductor</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{s.conductor || 'N/A'}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{s.placa || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1 tracking-wider">Programado</p>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-slate-700 truncate">{s.hora_programada || 'N/A'}</p>
                    <p className="text-[10px] font-medium text-slate-400">{s.fecha?.split(',')[0]}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
               <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{s.origen}</p>
               </div>
               <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-green-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{s.destino}</p>
               </div>
            </div>

            <div className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-xl">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Inicio</span>
                  <span className="text-[11px] font-bold text-emerald-600">{s.hora_inicio || '--:--'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Fin</span>
                  <span className="text-[11px] font-bold text-rose-600">{s.hora_fin || '--:--'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Duración</span>
                <span className={`text-xs font-black ${s.estado === 'EN_CURSO' ? 'text-blue-600' : 'text-slate-700'}`}>
                  {duracionDisplay}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Asignaciones</h1>
          <p className="text-slate-500 mt-1 font-medium">Control de servicios en ejecución y finalizados</p>
        </div>
        <Button 
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-emerald-600/20 gap-2 w-full sm:w-auto"
          disabled={filteredSolicitudes.length === 0}
        >
          <FileDown size={18} />
          Exportar Excel
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 md:p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
            <div className="xl:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Buscar</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input
                  placeholder="ID, pasajero, conductor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Empresa</label>
              <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {empresas.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.nombre}>{emp.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Desde</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <Input 
                  type="date" 
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={filterDesde} 
                  onChange={(e) => setFilterDesde(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Hasta</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <Input 
                  type="date" 
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={filterHasta} 
                  onChange={(e) => setFilterHasta(e.target.value)} 
                />
              </div>
            </div>

            <Button 
                variant="outline" 
                className="h-11 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                onClick={() => {
                    setFilterEmpresa('all');
                    setFilterMes('all');
                    setFilterDesde('');
                    setFilterHasta('');
                    setSearchTerm('');
                }}
            >
                Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {isLoading ? (
            <div className="py-20 text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
              <p className="text-slate-400 font-medium">Cargando asignaciones...</p>
            </div>
          ) : filteredSolicitudes.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Search size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium italic">No se encontraron servicios</p>
            </div>
          ) : (
            filteredSolicitudes.map((s: any) => (
              <MobileAsignacionCard key={s.id} s={s} />
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white min-w-[1200px]">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="w-[80px] font-bold text-slate-900">ID</TableHead>
                    <TableHead className="w-[180px] font-bold text-slate-900">Pasajero / Empresa</TableHead>
                    <TableHead className="font-bold text-slate-900">Ruta (Origen → Destino)</TableHead>
                    <TableHead className="w-[180px] font-bold text-slate-900">Conductor</TableHead>
                    <TableHead className="w-[100px] font-bold text-slate-900">F. Solicitud</TableHead>
                    <TableHead className="w-[100px] font-bold text-slate-900">Hora Prog.</TableHead>
                    <TableHead className="w-[130px] font-bold text-slate-900 text-center">Tiempos</TableHead>
                    <TableHead className="w-[110px] font-bold text-slate-900 text-center">Estado</TableHead>
                    <TableHead className="font-bold text-slate-900">Observaciones</TableHead>
                    <TableHead className="w-[140px] font-bold text-slate-900 text-right pr-6">Valor ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
                      </TableCell>
                    </TableRow>
                  ) : filteredSolicitudes.map((s: any) => {
                    let duracionDisplay = s.duracion || 'N/A';
                    if (s.estado === 'EN_CURSO' && s.hora_inicio_raw) {
                      const inicio = new Date(s.hora_inicio_raw);
                      const ahora = new Date();
                      const diffMin = Math.floor((ahora.getTime() - inicio.getTime()) / 60000);
                      duracionDisplay = `${diffMin} min (en curso)`;
                    }

                    return (
                      <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-black text-slate-400 text-xs">
                          #{s.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{s.empleado}</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{s.empresa}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 py-1">
                            <div className="flex flex-col gap-1 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <TruncatedCell text={s.origen} maxWidth="200px" className="font-medium" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <TruncatedCell text={s.destino} maxWidth="200px" className="font-medium" />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-slate-700">{s.conductor}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{s.placa}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-slate-700">{s.fecha?.split(',')[0]}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-700">{s.hora_programada}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1 min-w-[140px]">
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                               <span className="text-xs font-bold text-slate-700">{s.hora_inicio?.split(', ')[1] || s.hora_inicio || '--:--'}</span>
                               <ArrowRight size={12} className="text-slate-300" />
                               <span className="text-xs font-bold text-slate-700">{s.hora_fin?.split(', ')[1] || s.hora_fin || '--:--'}</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tight ${s.estado === 'EN_CURSO' ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                              {duracionDisplay}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge estado={s.estado} />
                        </TableCell>
                        <TableCell>
                          <TruncatedCell text={s.observaciones} maxWidth="120px" />
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <PriceEditor value={s.precio} onSave={handleUpdatePrice} solicitud={s} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pagination (Simplified for now) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-4">
        <p className="text-sm font-bold text-slate-400">
          Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 px-4 border-slate-200"
            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={page === 1}
          >
            <ChevronLeft size={18} className="mr-1" /> Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 px-4 border-slate-200"
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
            disabled={page === totalPages}
          >
            Siguiente <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
