import React, { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  const [selectedConductor, setSelectedConductor] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState('');
  const [assignmentResult, setAssignmentResult] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Cargar solicitudes desde el backend
  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const responseData = await adminAPI.getSolicitudes({ page, size: 20 });
        setSolicitudes(responseData.data || []);
        if (responseData.total) {
          setTotalPages(Math.ceil(responseData.total / 20));
        }
      } catch (error) {
        console.error('Error fetching solicitudes:', error);
      }
    };
    fetchSolicitudes();
  }, [page]);

  // Cargar conductores y vehículos reales desde el backend
  useEffect(() => {
    const fetchConductores = async () => {
      try {
        const data = await adminAPI.getConductores();
        setConductores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching conductores:', error);
      }
    };
    const fetchVehiculos = async () => {
      try {
        const data = await adminAPI.getVehiculos();
        setVehiculos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching vehiculos:', error);
      }
    };
    fetchConductores();
    fetchVehiculos();
  }, []);

  // Filtrado local
  useEffect(() => {
    let filtered = solicitudes;

    if (filterEstado !== 'all') {
      filtered = filtered.filter(
        (s) => (s.estado || '').toUpperCase() === filterEstado.toUpperCase()
      );
    }

    if (filterEmpresa !== 'all') {
      filtered = filtered.filter((s) => s.empresa === filterEmpresa);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          (s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.empleado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.empresa || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSolicitudes(filtered);
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

      setSolicitudes(
        solicitudes.map((s) =>
          (s.original_id ?? s.id) === solicitudRealId
            ? { ...s, estado: 'ASIGNADO' }
            : s
        )
      );

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


  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Solicitudes</h1>
        <p className="text-gray-600 mt-2">Administra todas las solicitudes de transporte</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por ID o empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {uniqueEmpresas.map((emp) => (
                  <SelectItem key={String(emp)} value={String(emp)}>{String(emp)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead>ID</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Fecha/Hora Solicitada</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSolicitudes.map((solicitud) => (
                <TableRow key={solicitud.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="font-semibold">{solicitud.id}</TableCell>
                  <TableCell className="font-medium text-blue-800">{solicitud.empresa || 'N/A'}</TableCell>
                  <TableCell>{solicitud.empleado || solicitud.empleado_nombre}</TableCell>
                  <TableCell className="text-sm text-gray-600 truncate max-w-[150px]">{solicitud.origen}</TableCell>
                  <TableCell className="text-sm text-gray-600 truncate max-w-[150px]">{solicitud.destino}</TableCell>
                  <TableCell className="text-sm font-semibold text-[#1B3A5C] whitespace-nowrap">
                    {solicitud.hora_programada || <span className="text-gray-400 italic">Por confirmar</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{solicitud.fecha}</TableCell>
                  <TableCell>
                    <StatusBadge estado={solicitud.estado} />
                  </TableCell>
                  <TableCell>
                    {(solicitud.estado === 'AUTORIZADO' ||
                      solicitud.estado === 'autorizada' ||
                      solicitud.estado === 'PENDIENTE') && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-[#F97316] hover:bg-orange-600"
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          Mostrando página {page} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* ── DIALOG: Asignar Conductor ── */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Conductor</DialogTitle>
            <DialogDescription>
              Selecciona el conductor para la solicitud{' '}
              <strong>{selectedSolicitud?.id}</strong>.
              <br />
              Se enviarán notificaciones WhatsApp al pasajero y al conductor con todos los
              detalles del servicio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info del servicio */}
            {selectedSolicitud && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1 text-sm">
                <p><span className="font-semibold text-blue-800">👤 Pasajero:</span> {selectedSolicitud.empleado}</p>
                <p><span className="font-semibold text-blue-800">📍 Origen:</span> {selectedSolicitud.origen}</p>
                <p><span className="font-semibold text-blue-800">🏁 Destino:</span> {selectedSolicitud.destino}</p>
                <p><span className="font-semibold text-blue-800">⏰ Fecha/Hora:</span> {selectedSolicitud.hora_programada}</p>
              </div>
            )}

            {/* Selector de conductor */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Conductor
              </label>
              <Select value={selectedConductor} onValueChange={setSelectedConductor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un conductor" />
                </SelectTrigger>
                <SelectContent>
                  {conductores.length === 0 ? (
                    <SelectItem value="none" disabled>No hay conductores registrados</SelectItem>
                  ) : (
                    conductores.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} — {c.telefono}
                        {c.en_servicio ? ' 🔴 En servicio' : c.disponible ? ' 🟢 Disponible' : ' ⚪ No disponible'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de veh\u00edculo registrado */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Veh\u00edculo de la flota
              </label>
              {vehiculos.filter((v) => v.estado === 'activo').length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  ⚠️ No hay veh\u00edculos activos registrados. Ve a <strong>Flota</strong> para registrar uno.
                </p>
              ) : (
                <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un veh\u00edculo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiculos
                      .filter((v) => v.estado === 'activo')
                      .map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.marca} {v.modelo} — <span className="font-mono font-semibold">{v.placa}</span>
                          {v.tipo_servicio ? ` · ${v.tipo_servicio}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Preview del veh\u00edculo seleccionado */}
            {selectedVehiculo && (() => {
              const veh = vehiculos.find((v) => String(v.id) === selectedVehiculo);
              return veh ? (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 space-y-1 text-sm">
                  <p className="font-semibold text-orange-800">🚌 Veh\u00edculo seleccionado</p>
                  <p>{veh.marca} {veh.modelo} — Placa: <strong className="font-mono">{veh.placa}</strong></p>
                  {veh.capacidad && <p className="text-gray-600">Capacidad: {veh.capacidad} pasajeros · {veh.tipo_servicio}</p>}
                </div>
              ) : null;
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#F97316] hover:bg-orange-600"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-700">✅ Servicio Asignado Exitosamente</DialogTitle>
            <DialogDescription>
              Las notificaciones WhatsApp han sido enviadas al pasajero y al conductor.
            </DialogDescription>
          </DialogHeader>

          {assignmentResult && (
            <div className="space-y-4 py-2">
              {/* Código de verificación destacado */}
              <div className="rounded-xl bg-gradient-to-br from-[#1B3A5C] to-[#2563EB] p-5 text-white text-center shadow-md">
                <p className="text-sm uppercase tracking-widest opacity-80 mb-1">Código de Verificación</p>
                <p className="text-5xl font-black tracking-[0.3em]">{assignmentResult.codigo_verificacion}</p>
                <p className="text-xs mt-2 opacity-70">El pasajero lo presentará al conductor al abordar</p>
              </div>

              {/* Resumen */}
              <div className="rounded-lg bg-gray-50 border p-3 space-y-2 text-sm">
                <p><span className="font-semibold">🚌 Vehículo:</span> {assignmentResult.vehiculo}</p>
                <p><span className="font-semibold">👤 Conductor:</span> {assignmentResult.conductor}</p>
                <p><span className="font-semibold">📋 Estado:</span>{' '}
                  <span className="text-orange-600 font-semibold">{assignmentResult.estado}</span>
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                📲 Notificaciones enviadas por WhatsApp al pasajero y al conductor.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button className="bg-[#1B3A5C] hover:bg-blue-900 w-full" onClick={() => setIsSuccessDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
