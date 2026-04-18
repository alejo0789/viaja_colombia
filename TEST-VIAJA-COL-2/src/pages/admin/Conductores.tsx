import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Truck } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';

export default function Conductores() {
  const [conductores, setConductores] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    vehiculos_ids: [] as number[],
  });

  // Cargar maestros
  const fetchData = async () => {
    try {
      const [conductoresData, vehiculosData] = await Promise.all([
        adminAPI.getConductores(),
        adminAPI.getVehiculos()
      ]);
      setConductores(Array.isArray(conductoresData) ? conductoresData : []);
      setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVehicleToggle = (vehiculoId: number) => {
    const id = Number(vehiculoId);
    setFormData(prev => {
      const isAlreadyIncluded = prev.vehiculos_ids.some(vid => Number(vid) === id);
      return {
        ...prev,
        vehiculos_ids: isAlreadyIncluded
          ? prev.vehiculos_ids.filter(vid => Number(vid) !== id)
          : [...prev.vehiculos_ids, id]
      };
    });
  };

  const handleSaveDriver = async () => {
    try {
      const driverData = {
        nombre: formData.nombre,
        telefono: formData.telefono,
        whatsapp: formData.telefono,
        vehiculos_ids: formData.vehiculos_ids,
      };

      if (editingDriver) {
        await adminAPI.updateConductor(editingDriver.id, driverData);
      } else {
        await adminAPI.createConductor(driverData);
      }
      
      await fetchData();
      setIsDialogOpen(false);
      setEditingDriver(null);
      setFormData({ nombre: '', telefono: '', vehiculos_ids: [] });
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  const openEditModal = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      nombre: driver.nombre,
      telefono: driver.telefono || '',
      vehiculos_ids: (driver.vehiculos || []).map((v: any) => v.id),
    });
    setIsDialogOpen(true);
  };

  const toggleDriverStatus = async (conductorId: number) => {
    try {
      await adminAPI.toggleConductorStatus(conductorId);
      setConductores(
        conductores.map((c) =>
          c.id === conductorId
            ? { ...c, disponible: !c.disponible }
            : c
        )
      );
    } catch (error) {
      console.error('Error toggling driver status:', error);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Conductores</h1>
          <p className="text-gray-600 mt-2">Administra a los conductores y sus vehículos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingDriver(null);
            setFormData({ nombre: '', telefono: '', vehiculos_ids: [] });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#F97316] hover:bg-orange-600">
              <Plus size={18} className="mr-2" />
              Nuevo Conductor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingDriver ? 'Editar Conductor' : 'Agregar Nuevo Conductor'}</DialogTitle>
              <DialogDescription>
                Completa los datos y selecciona los vehículos asignados al conductor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                  <Input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Carlos Rodríguez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Teléfono / WhatsApp</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded px-2 py-2 select-none">+57</span>
                    <Input
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="3001234567"
                      className="flex-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Vehículos Asignados</label>
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2 bg-gray-50">
                  {vehiculos.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No hay vehículos registrados en la flota.</p>
                  ) : (
                    vehiculos.map((v) => {
                      const isChecked = formData.vehiculos_ids.includes(Number(v.id));
                      return (
                        <div 
                          key={v.id} 
                          className="flex items-center space-x-3 bg-white p-2.5 rounded border shadow-sm hover:bg-blue-50/50 transition-colors cursor-pointer group"
                          onClick={() => handleVehicleToggle(Number(v.id))}
                        >
                          <Checkbox 
                            id={`veh-${v.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              // El onClick del div ya maneja el cambio, pero por accesibilidad:
                              // Si el checkbox cambia por teclado o click directo
                            }}
                            className="pointer-events-none" // Para que el click del div sea el principal
                          />
                          <div className="flex justify-between w-full select-none">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <Truck size={14} className={isChecked ? "text-blue-600" : "text-gray-400"} />
                              {v.marca} {v.modelo}
                            </span>
                            <span className={`font-mono text-sm font-bold ${isChecked ? "text-blue-700" : "text-gray-400"}`}>
                              {v.placa}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-gray-400">Selecciona uno o varios vehículos de la flota para este conductor.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-[#F97316] hover:bg-orange-600"
                onClick={handleSaveDriver}
                disabled={!formData.nombre || !formData.telefono}
              >
                {editingDriver ? 'Guardar Cambios' : 'Agregar Conductor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono / WhatsApp</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conductores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                    No hay conductores registrados.
                  </TableCell>
                </TableRow>
              ) : (
                conductores.map((conductor) => (
                  <TableRow key={conductor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="font-semibold">{conductor.nombre}</TableCell>
                    <TableCell className="text-sm text-gray-600">{conductor.telefono}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {conductor.vehiculos && conductor.vehiculos.length > 0 ? (
                          conductor.vehiculos.map((v: any) => (
                            <Badge key={v.id} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] py-0 px-2">
                              {v.placa}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin vehículos</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge estado={conductor.disponible ? 'activo' : 'inactivo'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleDriverStatus(conductor.id)}
                          className={conductor.disponible ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}
                        >
                          {conductor.disponible ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(conductor)}
                          className="h-8 w-8 text-blue-600"
                        >
                          <Pencil size={16} />
                        </Button>
                      </div>
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
