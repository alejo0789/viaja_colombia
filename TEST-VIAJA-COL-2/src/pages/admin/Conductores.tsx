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
import { Plus } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';

export default function Conductores() {
  const [conductores, setConductores] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
  });

  // Cargar conductores reales desde el backend
  useEffect(() => {
    const fetchConductores = async () => {
      try {
        const data = await adminAPI.getConductores();
        setConductores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching conductores:', error);
      }
    };
    fetchConductores();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDriver = async () => {
    try {
      const result = await adminAPI.createConductor({
        nombre: formData.nombre,
        telefono: formData.telefono,
        whatsapp: formData.telefono,
      });
      // Recargar lista desde el backend
      const data = await adminAPI.getConductores();
      setConductores(Array.isArray(data) ? data : []);
      setIsDialogOpen(false);
      setFormData({ nombre: '', telefono: '' });
    } catch (error) {
      console.error('Error creating driver:', error);
    }
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
                  <label className="text-sm font-medium text-gray-700">Teléfono / WhatsApp</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded px-2 py-2 select-none">
                      +57
                    </span>
                    <Input
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="3001234567"
                      className="flex-1"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Este número se usa para llamar y para WhatsApp.</p>
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
                <TableHead>Teléfono / WhatsApp</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conductores.map((conductor) => (
                <TableRow key={conductor.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="font-semibold">{conductor.nombre}</TableCell>
                  <TableCell className="text-sm text-gray-600">{conductor.telefono}</TableCell>
                  <TableCell>
                    <StatusBadge estado={conductor.disponible ? 'activo' : 'inactivo'} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleDriverStatus(conductor.id)}
                    >
                      {conductor.disponible ? 'Desactivar' : 'Activar'}
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
