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
import { Plus, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';

export default function Flota() {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    capacidad: 5,
    estado: 'activo',
    tipo_servicio: 'Estándar',
  });

  const fetchVehiculos = async () => {
    try {
      const data = await adminAPI.getVehiculos();
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehiculos:', error);
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

  const handleAddVehicle = async () => {
    setIsLoading(true);
    try {
      await adminAPI.createVehiculo(formData);
      await fetchVehiculos();
      setIsDialogOpen(false);
      setFormData({
        placa: '',
        marca: '',
        modelo: '',
        año: new Date().getFullYear(),
        capacidad: 5,
        estado: 'activo',
        tipo_servicio: 'Estándar',
      });
    } catch (error: any) {
      alert(error?.message || 'Error al registrar el vehículo');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Flota</h1>
          <p className="text-gray-600 mt-2">
            Administra el parque vehicular — {vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''} registrado{vehiculos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F97316] hover:bg-orange-600">
              <Plus size={18} className="mr-2" />
              Nuevo Vehículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Vehículo</DialogTitle>
              <DialogDescription>
                Completa el formulario para agregar un vehículo a la flota
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Placa *</label>
                <Input
                  name="placa"
                  value={formData.placa}
                  onChange={handleInputChange}
                  placeholder="Ej: MED128"
                  className="uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Marca</label>
                  <Input
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    placeholder="Ej: Toyota"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Modelo</label>
                  <Input
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    placeholder="Ej: Camry"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Año</label>
                  <Input
                    name="año"
                    type="number"
                    value={formData.año}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Capacidad (pax)</label>
                  <Input
                    name="capacidad"
                    type="number"
                    value={formData.capacidad}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de Servicio</label>
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
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-[#F97316] hover:bg-orange-600"
                onClick={handleAddVehicle}
                disabled={!formData.placa || isLoading}
              >
                {isLoading ? 'Guardando...' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {vehiculos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-2xl mb-2">🚗</p>
          <p className="font-medium">No hay vehículos registrados</p>
          <p className="text-sm mt-1">Haz clic en "Nuevo Vehículo" para agregar el primero</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiculos.map((vehiculo) => (
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Año</p>
                    <p className="font-semibold">{vehiculo.anio || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Capacidad</p>
                    <p className="font-semibold">{vehiculo.capacidad ? `${vehiculo.capacidad} pax` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tipo</p>
                    <p className="font-semibold">{vehiculo.tipo_servicio || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
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
