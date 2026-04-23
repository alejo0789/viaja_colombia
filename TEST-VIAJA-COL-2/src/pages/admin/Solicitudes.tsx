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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeSolicitudes } from '@/hooks/useRealtimeSolicitudes';
import { FileDown, Search, Truck, MapPin, Clock, User, Building2, MoreVertical, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Componente ayudante para mostrar texto truncado que se expande al hacer clic
const TruncatedCell = ({ text, maxWidth = "150px" }: { text: string; maxWidth?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text === '-') return <span className="text-gray-400">-</span>;
  
  return (
    <div 
      className={`text-sm cursor-pointer transition-all duration-200 ${
        isExpanded 
          ? "whitespace-normal bg-blue-50 p-2 rounded border border-blue-100 shadow-sm z-10 relative left-0" 
          : "truncate"
      }`}
      style={{ maxWidth: isExpanded ? '400px' : maxWidth }}
      onClick={() => setIsExpanded(!isExpanded)}
      title={isExpanded ? "Click para contraer" : "Click para ver completo"}
    >
      {text}
    </div>
  );
};

export default function Solicitudes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('PENDIENTE,AUTORIZADO');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [page, setPage] = useState(1);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  const [selectedConductor, setSelectedConductor] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState('');
  const [assignmentResult, setAssignmentResult] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Hook de tiempo real (refresca cada 10s)
  useRealtimeSolicitudes(['admin-solicitudes']);

  // Cargar solicitudes con React Query
  const { data: solicitudesData, isLoading: isLoadingSolicitudes } = useQuery({
    queryKey: ['admin-solicitudes', page, filterEstado],
    queryFn: () => adminAPI.getSolicitudes({ 
      estado: filterEstado === 'all' ? undefined : filterEstado,
      page, 
      size: 20 
    }),
  });

  const solicitudes = solicitudesData?.data || [];
  const totalPages = Math.ceil((solicitudesData?.total || 0) / 20);

  // Cargar maestros
  const { data: conductoresData } = useQuery({
    queryKey: ['admin-conductores-list'],
    queryFn: () => adminAPI.getConductores(),
  });
  const conductores = Array.isArray(conductoresData) ? conductoresData : [];

  const { data: vehiculosData } = useQuery({
    queryKey: ['admin-vehiculos-list'],
    queryFn: () => adminAPI.getVehiculos(),
  });
  const vehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];

  // Filtrado local usando useMemo (más eficiente)
  const filteredSolicitudes = React.useMemo(() => {
    let filtered = solicitudes;

    if (filterEstado !== 'all') {
      const states = filterEstado.toUpperCase().split(',');
      filtered = filtered.filter(
        (s) => states.includes((s.estado || '').toUpperCase())
      );
    }

    if (filterEmpresa !== 'all') {
      filtered = filtered.filter((s) => s.empresa === filterEmpresa);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          String(s.id || '').toLowerCase().includes(search) ||
          String(s.empleado || '').toLowerCase().includes(search) ||
          String(s.empresa || '').toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [solicitudes, searchTerm, filterEstado, filterEmpresa]);

  const uniqueEmpresas = Array.from(new Set(solicitudes.map((s) => s.empresa))).filter(Boolean);

  const handleAssignService = async () => {
    if (!selectedSolicitud || !selectedConductor) return;

    setIsAssigning(true);
    try {
      const solicitudRealId = selectedSolicitud.original_id ?? selectedSolicitud.id;
      const veh = vehiculos.find((v) => String(v.id) === selectedVehiculo);
      const result = await adminAPI.asignarServicio(
        solicitudRealId,
        parseInt(selectedConductor),
        veh ? `${veh.marca} ${veh.modelo}` : '',
        veh?.placa || '',
      );

      queryClient.invalidateQueries({ queryKey: ['admin-solicitudes'] });
      setAssignmentResult(result);
      setIsAssignDialogOpen(false);
      setIsSuccessDialogOpen(true);
      setSelectedConductor('');
      setSelectedVehiculo('');
    } catch (error) {
      console.error('Error assigning service:', error);
      alert('Error al asignar el servicio. Por favor intenta de nuevo.');
    } finally {
      setIsAssigning(false);
    }
  };

  const openAssignDialog = (solicitud: any) => {
    setSelectedSolicitud(solicitud);
    setSelectedConductor('');
    setSelectedVehiculo('');
    setIsAssignDialogOpen(true);
  };

  const MobileSolicitudCard = ({ solicitud }: { solicitud: any }) => (
    <Card className="mb-4 border-slate-200 shadow-sm overflow-hidden rounded-2xl group">
      <CardContent className="p-0">
        <div className="p-4 border-b border-slate-50 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-400 text-xs">#{solicitud.id}</span>
              <StatusBadge estado={solicitud.estado} />
            </div>
            <h3 className="font-semibold text-slate-700 truncate max-w-[200px]">{solicitud.empresa || 'Empresa N/A'}</h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{solicitud.fecha}</span>
            {(solicitud.estado === 'AUTORIZADO' || solicitud.estado === 'PENDIENTE') && (
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 h-9 font-bold shadow-lg shadow-orange-500/20"
                onClick={() => openAssignDialog(solicitud)}
              >
                Asignar
              </Button>
            )}
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <User size={14} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1 tracking-wider">Pasajero</p>
              <p className="text-sm font-bold text-slate-700 truncate">{solicitud.empleado || solicitud.empleado_nombre}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                <Clock size={14} className="text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1 tracking-wider">Programado</p>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-700 truncate">{solicitud.hora_programada || 'N/A'}</p>
                  <p className="text-[10px] font-medium text-slate-400">{solicitud.fecha}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                <RefreshCw size={14} className={solicitud.es_retorno ? 'text-purple-600' : 'text-slate-400'} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1 tracking-wider">Tipo</p>
                <p className="text-sm font-bold text-slate-700 truncate">{solicitud.es_retorno ? 'Retorno' : 'Normal'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-slate-50 p-2 rounded-xl">
              <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-slate-600 line-clamp-2">{solicitud.origen}</p>
            </div>
            <div className="flex items-start gap-3 bg-slate-50 p-2 rounded-xl">
              <MapPin size={14} className="text-green-500 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-slate-600 line-clamp-2">{solicitud.destino}</p>
            </div>
          </div>
        </div>

        {solicitud.autorizador_nombre && (
          <div className="p-3 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-slate-100">
                <Building2 size={10} className="text-slate-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">Autoriza: {solicitud.autorizador_nombre}</span>
            </div>
            {solicitud.autorizador_area && solicitud.autorizador_area !== 'N/A' && (
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                • {solicitud.autorizador_area}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Solicitudes</h1>
          <p className="text-slate-500 mt-1">Control maestro de servicios de transporte</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-4 gap-2 border-slate-200">
            <FileDown size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 md:p-6 bg-white">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Buscar por ID, empleado o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
            <div className="grid grid-cols-2 lg:flex gap-3">
              <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                <SelectTrigger className="w-full lg:w-[200px] h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {uniqueEmpresas.map((emp) => (
                    <SelectItem key={String(emp)} value={String(emp)}>{String(emp)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full lg:w-[200px] h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE,AUTORIZADO">Activos (Pend/Aut)</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente Autorización</SelectItem>
                  <SelectItem value="AUTORIZADO">Autorizada</SelectItem>
                  <SelectItem value="RECHAZADO">Rechazada</SelectItem>
                  <SelectItem value="ASIGNADO">Asignada</SelectItem>
                  <SelectItem value="EN_CURSO">En Curso</SelectItem>
                  <SelectItem value="COMPLETADO">Finalizada</SelectItem>
                  <SelectItem value="CANCELADO">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Mobile View */}
        <div className="md:hidden">
          {isLoadingSolicitudes ? (
            <div className="py-20 text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
              <p className="text-slate-400 font-medium">Cargando solicitudes...</p>
            </div>
          ) : filteredSolicitudes.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Search size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium italic">No se encontraron solicitudes</p>
            </div>
          ) : (
            filteredSolicitudes.map((solicitud) => (
              <MobileSolicitudCard key={solicitud.id} solicitud={solicitud} />
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="w-[100px] font-bold text-slate-900">ID</TableHead>
                    <TableHead className="font-bold text-slate-900">Pasajero / Empresa</TableHead>
                    <TableHead className="font-bold text-slate-900">Origen / Destino</TableHead>
                    <TableHead className="font-bold text-slate-900">F. Solicitud</TableHead>
                    <TableHead className="font-bold text-slate-900">Hora Prog.</TableHead>
                    <TableHead className="font-bold text-slate-900">Autorización</TableHead>
                    <TableHead className="font-bold text-slate-900">Estado</TableHead>
                    <TableHead className="font-bold text-slate-900">Observaciones</TableHead>
                    <TableHead className="text-right font-bold text-slate-900 pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {isLoadingSolicitudes ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
                      </TableCell>
                    </TableRow>
                  ) : filteredSolicitudes.map((solicitud) => (
                    <TableRow key={solicitud.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-black text-slate-400 text-xs">
                        #{solicitud.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold text-slate-900">{solicitud.empleado || solicitud.empleado_nombre}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{solicitud.empresa || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 py-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-blue-500 shrink-0" />
                            <TruncatedCell text={solicitud.origen} maxWidth="200px" />
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-green-500 shrink-0" />
                            <TruncatedCell text={solicitud.destino} maxWidth="200px" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-slate-700">{solicitud.fecha}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium text-slate-700">{solicitud.hora_programada || 'Por confirmar'}</p>
                      </TableCell>
                      <TableCell>
                        {solicitud.autorizador_nombre ? (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-slate-700">{solicitud.autorizador_nombre}</p>
                            {solicitud.autorizador_area && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                {solicitud.autorizador_area}
                              </span>
                            )}
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge estado={solicitud.estado} />
                      </TableCell>
                      <TableCell>
                        <TruncatedCell text={solicitud.observaciones} maxWidth="120px" />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {(solicitud.estado === 'AUTORIZADO' || solicitud.estado === 'PENDIENTE') && (
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-8 font-bold"
                            onClick={() => openAssignDialog(solicitud)}
                          >
                            Asignar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
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

      {/* ── DIALOG: Asignar Conductor ── */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="w-[95%] sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Asignar Conductor</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2">
              Selecciona el conductor y vehículo para la solicitud <span className="font-bold text-blue-600">#{selectedSolicitud?.id}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info del servicio */}
            {selectedSolicitud && (
              <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">{selectedSolicitud.empleado}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 line-clamp-1">{selectedSolicitud.origen}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">{selectedSolicitud.hora_programada}</span>
                </div>
              </div>
            )}

            {/* Selector de conductor */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-slate-400 ml-1 tracking-wider">Conductor</label>
              <Select 
                value={selectedConductor} 
                onValueChange={(val) => {
                  setSelectedConductor(val);
                  setSelectedVehiculo(''); 
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Selecciona un conductor" />
                </SelectTrigger>
                <SelectContent>
                  {conductores.length === 0 ? (
                    <SelectItem value="none" disabled>No hay conductores registrados</SelectItem>
                  ) : (
                    conductores.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} {c.en_servicio ? '🔴' : c.disponible ? '🟢' : '⚪'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de vehículo */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-slate-400 ml-1 tracking-wider">Vehículo</label>
              {!selectedConductor ? (
                <div className="text-xs text-slate-400 bg-slate-50 border border-dashed rounded-xl p-3 text-center">
                  Primero selecciona un conductor
                </div>
              ) : (() => {
                const driver = conductores.find((c: any) => String(c.id) === selectedConductor);
                const driverVehicles = driver?.vehiculos || [];
                
                if (driverVehicles.length === 0) {
                  return (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 font-medium">
                      ⚠️ Este conductor no tiene vehículos asignados.
                    </div>
                  );
                }

                return (
                  <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Selecciona un vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {driverVehicles.map((v: any) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.marca} {v.modelo} · {v.placa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl h-12 font-bold" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-bold flex-1 shadow-lg shadow-orange-500/20"
              onClick={handleAssignService}
              disabled={!selectedConductor || !selectedVehiculo || isAssigning}
            >
              {isAssigning ? 'Asignando...' : 'Asignar y Notificar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Éxito + Código de Verificación ── */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="w-[95%] sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-green-600">¡Asignación Exitosa!</DialogTitle>
            <DialogDescription className="font-medium">
              Notificaciones enviadas vía WhatsApp al pasajero y conductor.
            </DialogDescription>
          </DialogHeader>

          {assignmentResult && (
            <div className="space-y-6 py-4">
              {/* Código de verificación destacado */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-6 text-white text-center shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 mb-2">Código de Verificación</p>
                <p className="text-5xl font-black tracking-[0.2em] relative z-10">{assignmentResult.codigo_verificacion}</p>
                <p className="text-[10px] mt-4 opacity-50 font-medium">Requerido por el conductor al abordar</p>
              </div>

              {/* Resumen */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Vehículo</span>
                  <span className="text-slate-900 font-bold">{assignmentResult.vehiculo}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Conductor</span>
                  <span className="text-slate-900 font-bold">{assignmentResult.conductor}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Estado</span>
                  <Badge className="bg-orange-100 text-orange-700 border-none rounded-lg h-6 font-bold uppercase text-[10px]">
                    {assignmentResult.estado}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button className="bg-[#0F172A] hover:bg-slate-800 text-white w-full h-12 rounded-xl font-bold" onClick={() => setIsSuccessDialogOpen(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
