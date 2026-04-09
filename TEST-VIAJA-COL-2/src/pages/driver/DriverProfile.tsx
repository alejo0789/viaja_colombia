import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { User, Phone, FileText, Truck, Calendar, LogOut, Edit2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Mock driver profile data
const MOCK_DRIVER_PROFILE = {
  id: 'conductor-001',
  nombre: 'Carlos Rodríguez Mendez',
  cedula: '1023456789',
  telefono: '+57 301 234 5678',
  licencia_vigencia: '2026-08-15',
  estado: 'activo',
  vehiculo: {
    placa: 'ABC-123',
    marca: 'Toyota',
    modelo: 'Corolla 2023',
  },
};

export default function DriverProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [editPhoneDialogOpen, setEditPhoneDialogOpen] = useState(false);
  const [newPhone, setNewPhone] = useState(MOCK_DRIVER_PROFILE.telefono);
  const [isLoading, setIsLoading] = useState(false);

  const profile = MOCK_DRIVER_PROFILE;

  const handleUpdatePhone = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Número de teléfono actualizado');
      setEditPhoneDialogOpen(false);
    } catch (error) {
      toast.error('Error al actualizar el teléfono');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isLicenseExpiring = () => {
    const expiryDate = new Date(profile.licencia_vigencia);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30;
  };

  const getLicenseStatus = () => {
    const expiryDate = new Date(profile.licencia_vigencia);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return 'Vencida';
    if (daysUntilExpiry <= 30) return `Vence en ${daysUntilExpiry} días`;
    return 'Vigente';
  };

  return (
    <div className="p-4 max-w-md mx-auto md:max-w-2xl pb-24">
      {/* Header */}
      <div className="mb-6 mt-4">
        <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
        <p className="text-sm text-gray-600">Información personal y de la cuenta</p>
      </div>

      {/* Profile Header Card */}
      <Card className="mb-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white">
              <User size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{profile.nombre}</h3>
              <p className="text-sm text-gray-600 mb-2">Cédula: {profile.cedula}</p>
              <Badge
                className={
                  profile.estado === 'activo'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-500 hover:bg-gray-600'
                }
              >
                {profile.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone size={20} />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Teléfono</p>
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{newPhone}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewPhone(profile.telefono);
                  setEditPhoneDialogOpen(true);
                }}
                className="gap-1 text-[#1B3A5C]"
              >
                <Edit2 size={16} />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver License Information */}
      <Card className={`mb-4 ${isLicenseExpiring() ? 'border-orange-300' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText size={20} />
            Licencia de Conducción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Vigencia</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(profile.licencia_vigencia).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <Badge
                  variant={isLicenseExpiring() ? 'destructive' : 'default'}
                  className={!isLicenseExpiring() ? 'bg-green-600' : ''}
                >
                  {getLicenseStatus()}
                </Badge>
              </div>
            </div>
            {isLicenseExpiring() && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-sm text-orange-800">
                  Tu licencia vence pronto. Por favor, renuela lo antes posible.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Vehicle */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck size={20} />
            Vehículo Asignado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Placa</p>
            <p className="text-lg font-bold text-[#1B3A5C]">{profile.vehiculo.placa}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Marca</p>
              <p className="font-medium text-gray-900">{profile.vehiculo.marca}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Modelo</p>
              <p className="font-medium text-gray-900">{profile.vehiculo.modelo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle size={16} className="text-green-600" />
              <span>Todos los documentos están al día</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/conductor')}
        >
          Volver a Servicios
        </Button>
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Edit Phone Dialog */}
      <Dialog open={editPhoneDialogOpen} onOpenChange={setEditPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Teléfono</DialogTitle>
            <DialogDescription>
              Actualiza tu número de teléfono de contacto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="+57 300 000 0000"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              type="tel"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPhoneDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#1B3A5C]"
              onClick={handleUpdatePhone}
              disabled={isLoading || !newPhone}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
