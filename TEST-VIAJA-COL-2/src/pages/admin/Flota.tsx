import React, { useState } from 'react';
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
import { Plus } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { mockVehiculos } from '@/data/mockData';

export default function Flota() {
  const [vehiculos, setVehiculos] = useState(mockVehiculos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    capacidad: 5,
    estado: 'activo',
    tipo_servicio: 'Estándar',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'año' || name === 'capacidad' ? parseInt(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddVehicle = async () => {
    try {
      const newVehicle = {
        id: `VEH-${vehiculos.length + 1}`,
        ...formData,
      };
      await adminAPI.createVehiculo(newVehicle);
      setVehiculos([...vehiculos, newVehicle]);
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
    } catch (error) {
      console.error('Error creating vehicle:', error);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Flota</h1>
          <p className="text-gray-600 mt-2">Administra el parque vehicular</p>
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
              <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
              <DialogDescription>
                Completa el formulario para agregar un nuevo vehículo a la flota
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Placa</label>
                <Input
                  name="placa"
                  value={formData.placa}
                  onChange={handleInputChange}
                  placeholder="Ej: MED-128"
                />
              </div>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-sm font-medium text-gray-700">Capacidad</label>
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
                <Select value={formData.tipo_servicio} onValueChange={(value) => 
                  handleSelectChange('tipo_servicio', value)
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Select value={formData.estado} onValueChange={(value) => 
                  handleSelectChange('estado', value)
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              >
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehiculos.map((vehiculo) => (
          <Card key={vehiculo.id} className="hover:shadow-lg transition">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{vehiculo.marca} {vehiculo.modelo}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Placa: {vehiculo.placa}</p>
                </div>
                <StatusBadge estado={vehiculo.estado} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Año</p>
                  <p className="font-semibold">{vehiculo.año}</p>
                </div>
                <div>
                  <p className="text-gray-600">Capacidad</p>
                  <p className="font-semibold">{vehiculo.capacidad} pasajeros</p>
                </div>
                <div>
                  <p className="text-gray-600">Tipo de Servicio</p>
                  <p className="font-semibold">{vehiculo.tipo_servicio}</p>
                </div>
                <div>
                  <p className="text-gray-600">ID</p>
                  <p className="font-semibold text-xs">{vehiculo.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
