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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { mockSolicitudes, mockConductores, mockVehiculos } from '@/data/mockData';

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [conductores] = useState(mockConductores);
  const [vehiculos] = useState(mockVehiculos);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  const [selectedConductor, setSelectedConductor] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState('');

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const data = await adminAPI.getSolicitudes();
        setSolicitudes(data);
      } catch (error) {
        console.error('Error fetching solicitudes:', error);
      }
    };
    fetchSolicitudes();
  }, []);

  useEffect(() => {
    let filtered = solicitudes;

    if (filterEstado !== 'all') {
      filtered = filtered.filter((s) => (s.estado || '').toUpperCase() === filterEstado.toUpperCase());
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
    if (selectedSolicitud && selectedConductor && selectedVehiculo) {
      try {
        await adminAPI.asignarServicio(selectedSolicitud.id, selectedConductor, selectedVehiculo);
        // Update local state
        setSolicitudes(
          solicitudes.map((s) =>
            s.id === selectedSolicitud.id
              ? {
                  ...s,
                  estado: 'asignada',
                  conductor_id: selectedConductor,
                  vehiculo_id: selectedVehiculo,
                }
              : s
          )
        );
        setIsAssignDialogOpen(false);
        setSelectedConductor('');
        setSelectedVehiculo('');
      } catch (error) {
        console.error('Error assigning service:', error);
      }
    }
  };

  const openAssignDialog = (solicitud: any) => {
    if (solicitud.estado === 'autorizada' || solicitud.estado === 'pendiente_autorizacion') {
      setSelectedSolicitud(solicitud);
      setIsAssignDialogOpen(true);
    }
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
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSolicitudes.map((solicitud) => (
                <TableRow key={solicitud.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="font-semibold">{solicitud.id}</TableCell>
                  <TableCell className="font-medium text-blue-800">{solicitud.empresa || "N/A"}</TableCell>
                  <TableCell>{solicitud.empleado || solicitud.empleado_nombre}</TableCell>
                  <TableCell className="text-sm text-gray-600 truncate max-w-[150px]">{solicitud.origen}</TableCell>
                  <TableCell className="text-sm text-gray-600 truncate max-w-[150px]">{solicitud.destino}</TableCell>
                  <TableCell className="text-sm font-semibold text-gray-700">{solicitud.fecha}</TableCell>
                  <TableCell>
                    <StatusBadge estado={solicitud.estado} />
                  </TableCell>
                  <TableCell>
                    {(solicitud.estado === 'AUTORIZADO' ||
                      solicitud.estado === 'autorizada' ||
                      solicitud.estado === 'PENDIENTE') && (
                      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-[#F97316] hover:bg-orange-600"
                            onClick={() => openAssignDialog(solicitud)}
                          >
                            Asignar
                          </Button>
                        </DialogTrigger>
                        {selectedSolicitud?.id === solicitud.id && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Asignar Solicitud</DialogTitle>
                              <DialogDescription>
                                Asigna un conductor y vehículo a la solicitud {solicitud.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  Conductor
                                </label>
                                <Select value={selectedConductor} onValueChange={setSelectedConductor}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un conductor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {conductores.map((c) => (
                                      <SelectItem key={c.id} value={c.id}>
                                        {c.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Vehículo</label>
                                <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un vehículo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehiculos.map((v) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        {v.placa} - {v.marca} {v.modelo}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsAssignDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                className="bg-[#F97316] hover:bg-orange-600"
                                onClick={handleAssignService}
                              >
                                Asignar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
