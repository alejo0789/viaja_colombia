import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pencil } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';

export default function Flota() {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    capacidad: 5,
    estado: 'activo',
    tipo_servicio: 'Estándar',
    tipo_vehiculo: '',
    ciudad: '',
    propietario: '',
    cedula_propietario: '',
    fecha_matricula: '',
    soat_vencimiento: '',
    tecnomecanica_vencimiento: '',
    polizas_vencimiento: '',
    todo_riesgo_vencimiento: '',
    tarjeta_operacion_vencimiento: '',
    empresa_afiliada: '',
  });

  const fetchVehiculos = async () => {
    setIsFetching(true);
    try {
      const data = await adminAPI.getVehiculos();
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehiculos:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'año' || name === 'capacidad' ? parseInt(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveVehicle = async () => {
    setIsLoading(true);
    try {
      if (editingVehicle) {
        await adminAPI.updateVehiculo(editingVehicle.id, formData);
      } else {
        await adminAPI.createVehiculo(formData);
      }
      await fetchVehiculos();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      alert(error?.message || 'Error al guardar el vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingVehicle(null);
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      capacidad: 5,
      estado: 'activo',
      tipo_servicio: 'Estándar',
      tipo_vehiculo: '',
      ciudad: '',
      propietario: '',
      cedula_propietario: '',
      fecha_matricula: '',
      soat_vencimiento: '',
      tecnomecanica_vencimiento: '',
      polizas_vencimiento: '',
      todo_riesgo_vencimiento: '',
      tarjeta_operacion_vencimiento: '',
      empresa_afiliada: '',
    });
  };

  const formatToInputDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A' || dateStr === 'X' || dateStr === 'NO' || dateStr === 'SI') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    try {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          if (year.length === 4) return `${year}-${month}-${day}`;
          return `20${year}-${month}-${day}`;
        }
      }

      if (dateStr.includes('-') && dateStr.includes('/')) {
        const months: { [key: string]: string } = {
          'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
          'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
        };
        const mainParts = dateStr.split('/'); 
        const dateParts = mainParts[0].split('-'); 
        const day = dateParts[0].padStart(2, '0');
        const monthName = dateParts[1].toLowerCase().substring(0, 3);
        const month = months[monthName];
        const year = mainParts[1];
        if (day && month && year) return `${year}-${month}-${day}`;
      }
    } catch (e) {}
    return '';
  };

  const openEditModal = (v: any) => {
    setEditingVehicle(v);
    setFormData({
      placa: v.placa || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      año: v.anio || new Date().getFullYear(),
      capacidad: v.capacidad || 5,
      estado: v.estado || 'activo',
      tipo_servicio: v.tipo_servicio || 'Estándar',
      tipo_vehiculo: v.tipo_vehiculo || '',
      ciudad: v.ciudad || '',
      propietario: v.propietario || '',
      cedula_propietario: v.cedula_propietario || '',
      fecha_matricula: formatToInputDate(v.fecha_matricula),
      soat_vencimiento: formatToInputDate(v.soat_vencimiento),
      tecnomecanica_vencimiento: formatToInputDate(v.tecnomecanica_vencimiento),
      polizas_vencimiento: formatToInputDate(v.polizas_vencimiento),
      todo_riesgo_vencimiento: formatToInputDate(v.todo_riesgo_vencimiento),
      tarjeta_operacion_vencimiento: formatToInputDate(v.tarjeta_operacion_vencimiento),
      empresa_afiliada: v.empresa_afiliada || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteVehicle = async (id: number, placa: string) => {
    if (!confirm(`¿Eliminar el vehículo con placa ${placa}?`)) return;
    try {
      await adminAPI.deleteVehiculo(id);
      setVehiculos((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Error deleting vehiculo:', error);
    }
  };

  const toggleEstado = async (v: any) => {
    const nuevoEstado = v.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await adminAPI.updateVehiculo(v.id, { estado: nuevoEstado });
      setVehiculos((prev) =>
        prev.map((x) => (x.id === v.id ? { ...x, estado: nuevoEstado } : x))
      );
    } catch (error) {
      console.error('Error updating vehiculo:', error);
    }
  };

  const formatDateSpanish = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return dateStr || '—';
    try {
      // Input date is YYYY-MM-DD from type="date"
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parts[0];
      const monthIdx = parseInt(parts[1]) - 1;
      const day = parts[2];
      
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const month = months[monthIdx];
      
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  const filteredVehiculos = vehiculos.filter((v) => {
    const term = searchQuery.toLowerCase();
    return (
      v.placa?.toLowerCase().includes(term) ||
      v.marca?.toLowerCase().includes(term) ||
      v.empresa_afiliada?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Flota</h1>
          <p className="text-gray-600 mt-2">
            Administra el parque vehicular — {vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''} registrado{vehiculos.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Buscar por placa, marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 border-gray-300 focus:ring-blue-500"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#F97316] hover:bg-orange-600 shrink-0" onClick={() => resetForm()}>
                <Plus size={18} className="mr-2" />
                Nuevo Vehículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}</DialogTitle>
                <DialogDescription>
                  {editingVehicle ? 'Modifica la información del vehículo' : 'Completa el formulario para agregar un vehículo a la flota'}
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Placa *</label>
                  <Input
                    name="placa"
                    value={formData.placa}
                    onChange={handleInputChange}
                    placeholder="Ej: QLR094"
                    className="uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tipo Vehículo</label>
                  <Input
                    name="tipo_vehiculo"
                    value={formData.tipo_vehiculo}
                    onChange={handleInputChange}
                    placeholder="Ej: CAMIONETA PLATON"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Marca</label>
                  <Input
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    placeholder="Ej: TOYOTA"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Modelo</label>
                  <Input
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    placeholder="Ej: 2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Ciudad</label>
                  <Input
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ej: BOGOTA"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Empresa Afiliada</label>
                  <Input
                    name="empresa_afiliada"
                    value={formData.empresa_afiliada}
                    onChange={handleInputChange}
                    placeholder="Ej: TRANSPORTE SAS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Propietario</label>
                  <Input
                    name="propietario"
                    value={formData.propietario}
                    onChange={handleInputChange}
                    placeholder="Nombre Propietario"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Cédula Propietario</label>
                  <Input
                    name="cedula_propietario"
                    value={formData.cedula_propietario}
                    onChange={handleInputChange}
                    placeholder="CC / NIT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Fecha Matrícula</label>
                  <Input
                    name="fecha_matricula"
                    type="date"
                    value={formData.fecha_matricula}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Vence SOAT</label>
                  <Input
                    name="soat_vencimiento"
                    type="date"
                    value={formData.soat_vencimiento}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Vence Tecnomecánica</label>
                  <Input
                    name="tecnomecanica_vencimiento"
                    type="date"
                    value={formData.tecnomecanica_vencimiento}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Vence Tarjeta Op.</label>
                  <Input
                    name="tarjeta_operacion_vencimiento"
                    type="date"
                    value={formData.tarjeta_operacion_vencimiento}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Vence Pólizas</label>
                  <Input
                    name="polizas_vencimiento"
                    type="date"
                    value={formData.polizas_vencimiento}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Vence Todo Riesgo</label>
                  <Input
                    name="todo_riesgo_vencimiento"
                    type="date"
                    value={formData.todo_riesgo_vencimiento}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Estado</label>
                  <Select
                    value={formData.estado}
                    onValueChange={(v) => handleSelectChange('estado', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tipo Servicio</label>
                  <Select
                    value={formData.tipo_servicio}
                    onValueChange={(v) => handleSelectChange('tipo_servicio', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Económico">Económico</SelectItem>
                      <SelectItem value="Estándar">Estándar</SelectItem>
                      <SelectItem value="Ejecutivo">Ejecutivo</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-[#F97316] hover:bg-orange-600"
                onClick={handleSaveVehicle}
                disabled={!formData.placa || isLoading}
              >
                {isLoading ? 'Guardando...' : editingVehicle ? 'Guardar Cambios' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Grid */}
      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed border-gray-200">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Cargando flota vehicular...</p>
        </div>
      ) : filteredVehiculos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-2xl mb-2">🚗</p>
          <p className="font-medium">No se encontraron vehículos</p>
          <p className="text-sm mt-1">{searchQuery ? 'Prueba con otros términos de búsqueda' : 'Haz clic en "Nuevo Vehículo" para agregar el primero'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehiculos.map((vehiculo) => (
            <Card key={vehiculo.id} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {vehiculo.marca} {vehiculo.modelo}
                    </CardTitle>
                    <p className="text-sm font-mono font-semibold text-[#1B3A5C] mt-1">
                      {vehiculo.placa}
                    </p>
                  </div>
                  <StatusBadge estado={vehiculo.estado} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-400 uppercase font-medium">Tipo</p>
                    <p className="font-semibold text-gray-700">{vehiculo.tipo_vehiculo || vehiculo.tipo_servicio || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase font-medium">Ciudad</p>
                    <p className="font-semibold text-gray-700">{vehiculo.ciudad || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase font-medium">SOAT</p>
                    <p className={`font-semibold ${vehiculo.soat_vencimiento && vehiculo.soat_vencimiento !== 'N/A' ? 'text-green-600' : 'text-gray-700'}`}>
                      {formatDateSpanish(vehiculo.soat_vencimiento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase font-medium">Tarjeta Op.</p>
                    <p className={`font-semibold ${vehiculo.tarjeta_operacion_vencimiento && vehiculo.tarjeta_operacion_vencimiento !== 'N/A' ? 'text-green-600' : 'text-gray-700'}`}>
                      {formatDateSpanish(vehiculo.tarjeta_operacion_vencimiento)}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-2 mt-2">
                   <p className="text-[10px] text-gray-400 uppercase font-medium">Empresa Afiliada</p>
                   <p className="text-xs font-semibold text-gray-600 truncate">{vehiculo.empresa_afiliada || '—'}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(vehiculo)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Pencil size={14} className="mr-1" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toggleEstado(vehiculo)}
                  >
                    {vehiculo.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteVehicle(vehiculo.id, vehiculo.placa)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
