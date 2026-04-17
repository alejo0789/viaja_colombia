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
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Asignaciones() {
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
      estado: 'ASIGNADO', 
      empresa: filterEmpresa,
      mes: filterMes,
      desde: filterDesde,
      hasta: filterHasta,
      page, 
      size: 100 
    }),
  });

  const solicitudes = solicitudesData?.data || [];

  const filteredSolicitudes = solicitudes.filter((s: any) =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      Estado: s.estado
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');
    XLSX.writeFile(workbook, `Asignaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Generar opciones de meses (últimos 6 meses)
  const getMesesOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        options.push({ val, label });
    }
    return options;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Módulo de Asignaciones</h1>
          <p className="text-gray-600 mt-2">Seguimiento de servicios ya asignados a conductores</p>
        </div>
        <Button 
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700 text-white flex gap-2"
          disabled={filteredSolicitudes.length === 0}
        >
          <FileDown size={18} />
          Exportar a Excel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            {/* Buscador */}
            <div className="flex-1 min-w-[250px]">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="ID, pasajero, conductor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro Empresa */}
            <div className="w-[200px]">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Empresa</label>
              <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                <SelectTrigger>
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

            {/* Filtro Mes */}
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

            {/* Rango de Fechas */}
            <div className="flex gap-2">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Desde</label>
                    <Input type="date" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hasta</label>
                    <Input type="date" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} />
                </div>
            </div>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                    setFilterEmpresa('all');
                    setFilterMes('all');
                    setFilterDesde('');
                    setFilterHasta('');
                    setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
            >
                Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ID</TableHead>
                <TableHead>F. Solicitud</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Pasajero</TableHead>
                <TableHead>Conductor / Placa</TableHead>
                <TableHead>Programado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inicio / Fin</TableHead>
                <TableHead>Duración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">Cargando asignaciones...</TableCell>
                </TableRow>
              ) : filteredSolicitudes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-gray-400">
                    No se encontraron servicios asignados
                  </TableCell>
                </TableRow>
              ) : (
                filteredSolicitudes.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-gray-50">
                    <TableCell className="font-bold text-blue-900">{s.id}</TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">{s.fecha}</TableCell>
                    <TableCell className="text-sm">{s.empresa}</TableCell>
                    <TableCell className="text-sm">{s.empleado}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{s.conductor}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded w-fit font-mono font-bold mt-1">
                          {s.placa}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{s.hora_programada}</TableCell>
                    <TableCell>
                      <StatusBadge estado={s.estado} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-emerald-700 font-medium whitespace-nowrap">I: {s.hora_inicio || 'N/A'}</span>
                        <span className="text-rose-700 font-medium whitespace-nowrap">F: {s.hora_fin || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-amber-600">
                      {s.duracion || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
