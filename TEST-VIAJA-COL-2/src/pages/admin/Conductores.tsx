import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { mockConductores } from '@/data/mockData';

export default function Conductores() {
  const [conductores, setConductores] = useState(mockConductores);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    licencia_vigencia: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDriver = async () => {
    try {
      const newDriver = {
        id: `COND-${conductores.length + 1}`,
        ...formData,
        estado: 'activo',
        vehiculo_asignado: null,
      };
      await adminAPI.createConductor(newDriver);
      setConductores([...conductores, newDriver]);
      setIsDialogOpen(false);
      setFormData({
        nombre: '',
        cedula: '',
        telefono: '',
        licencia_vigencia: '',
      });
    } catch (error) {
      console.error('Error creating driver:', error);
    }
  };

  const toggleDriverStatus = async (conductorId: string) => {
    try {
      await adminAPI.toggleConductorStatus(conductorId);
      setConductores(
        conductores.map((c) =>
          c.id === conductorId
            ? {
                ...c,
                estado: c.estado === 'activo' ? 'inactivo' : 'activo',
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error toggling driver status:', error);
    }
  };

  const isLicenseExpiringSoon = (fecha: string) => {
    const today = new Date();
    const expireDate = new Date(fecha);
    const daysUntilExpire = Math.floor(
      (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpire <= 30 && daysUntilExpire > 0;
  };

  const isLicenseExpired = (fecha: string) => {
    return new Date(fecha) < new Date();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Conductores</h1>
          <p className="text-gray-600 mt-2">Administra a los conductores de la flota</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F97316] hover:bg-orange-600">
              <Plus size={18} className="mr-2" />
              Nuevo Conductor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Conductor</DialogTitle>
              <DialogDescription>
                Completa el formulario para registrar un nuevo conductor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                <Input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Carlos Rodríguez"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cédula</label>
                <Input
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleInputChange}
                  placeholder="Ej: 1020345678"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <Input
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Vigencia Licencia</label>
                <Input
                  name="licencia_vigencia"
                  type="date"
                  value={formData.licencia_vigencia}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-[#F97316] hover:bg-orange-600"
                onClick={handleAddDriver}
              >
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead>Nombre</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Licencia Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vehículo Asignado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conductores.map((conductor) => (
                <TableRow key={conductor.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="font-semibold">{conductor.nombre}</TableCell>
                  <TableCell className="text-sm text-gray-600">{conductor.cedula}</TableCell>
                  <TableCell className="text-sm">{conductor.telefono}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{conductor.licencia_vigencia}</span>
                      {isLicenseExpired(conductor.licencia_vigencia) && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Vencida
                        </span>
                      )}
                      {isLicenseExpiringSoon(conductor.licencia_vigencia) && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          Próxima a vencer
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={conductor.estado} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {conductor.vehiculo_asignado ? (
                      <span className="text-gray-900 font-medium">{conductor.vehiculo_asignado}</span>
                    ) : (
                      <span className="text-gray-500">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleDriverStatus(conductor.id)}
                    >
                      {conductor.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </Button>
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
