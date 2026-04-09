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
import { Edit } from 'lucide-react';
import { adminAPI } from '@/services/api';
import { mockTiposServicio } from '@/data/mockData';

export default function Tarifas() {
  const [tiposServicio, setTiposServicio] = useState(mockTiposServicio);
  const [selectedTariff, setSelectedTariff] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tarifa_base: 0,
    tiempo_base_minutos: 0,
    bloque_adicional_minutos: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const openEditDialog = (tariff: any) => {
    setSelectedTariff(tariff);
    setFormData({
      tarifa_base: tariff.tarifa_base,
      tiempo_base_minutos: tariff.tiempo_base_minutos,
      bloque_adicional_minutos: tariff.bloque_adicional_minutos,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTariff = async () => {
    if (selectedTariff) {
      try {
        await adminAPI.updateTarifa(selectedTariff.id, formData);
        setTiposServicio(
          tiposServicio.map((t) =>
            t.id === selectedTariff.id
              ? {
                  ...t,
                  tarifa_base: formData.tarifa_base,
                  tiempo_base_minutos: formData.tiempo_base_minutos,
                  bloque_adicional_minutos: formData.bloque_adicional_minutos,
                }
              : t
          )
        );
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error updating tariff:', error);
      }
    }
  };

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Tarifas</h1>
        <p className="text-gray-600 mt-2">Configura las tarifas y tipos de servicio</p>
      </div>

      {/* Grid of Tariffs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {tiposServicio.map((tariff) => (
          <Card key={tariff.id} className="hover:shadow-lg transition">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{tariff.nombre}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{tariff.descripcion}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#1B3A5C] text-white p-4 rounded-lg">
                <p className="text-sm text-blue-100">Tarifa Base</p>
                <p className="text-3xl font-bold">{formatCOP(tariff.tarifa_base)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tiempo Base</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tariff.tiempo_base_minutos}
                  </p>
                  <p className="text-xs text-gray-500">minutos</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Bloque Adicional</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tariff.bloque_adicional_minutos}
                  </p>
                  <p className="text-xs text-gray-500">minutos</p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-[#F97316] hover:bg-orange-600"
                    onClick={() => openEditDialog(tariff)}
                  >
                    <Edit size={16} className="mr-2" />
                    Editar Tarifa
                  </Button>
                </DialogTrigger>
                {selectedTariff?.id === tariff.id && (
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Tarifa - {selectedTariff.nombre}</DialogTitle>
                      <DialogDescription>
                        Actualiza los valores de tarifa para este tipo de servicio
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tarifa Base (COP)
                        </label>
                        <Input
                          name="tarifa_base"
                          type="number"
                          value={formData.tarifa_base}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tiempo Base (minutos)
                        </label>
                        <Input
                          name="tiempo_base_minutos"
                          type="number"
                          value={formData.tiempo_base_minutos}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Bloque Adicional (minutos)
                        </label>
                        <Input
                          name="bloque_adicional_minutos"
                          type="number"
                          value={formData.bloque_adicional_minutos}
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
                        onClick={handleUpdateTariff}
                      >
                        Guardar Cambios
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                )}
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
