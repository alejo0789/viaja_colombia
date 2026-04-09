// ============================================================
// Autorizador Empleados — Gestión de empleados autorizados
// Archivo: src/pages/autorizador/AutorizadorEmpleados.tsx
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { autorizadorAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, UserCheck, UserX } from 'lucide-react';

const AutorizadorEmpleados = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', cedula: '', cargo: '', telefono_whatsapp: '', email: '', limite_servicios_mensual: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['autorizador-empleados'],
    queryFn: () => autorizadorAPI.getEmpleados(),
  });

  const crearMutation = useMutation({
    mutationFn: (data: any) => autorizadorAPI.crearEmpleado(data),
    onSuccess: () => {
      toast({ title: 'Empleado creado', description: 'El empleado ha sido registrado exitosamente.' });
      queryClient.invalidateQueries({ queryKey: ['autorizador-empleados'] });
      setShowForm(false);
      setFormData({ nombre: '', cedula: '', cargo: '', telefono_whatsapp: '', email: '', limite_servicios_mensual: '' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    crearMutation.mutate({
      ...formData,
      limite_servicios_mensual: formData.limite_servicios_mensual ? Number(formData.limite_servicios_mensual) : null,
    });
  };

  const empleados = data?.empleados || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Empleados Autorizados</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#1B3A5C]">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Empleado
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registrar Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Nombre completo *" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              <Input placeholder="Cédula *" required value={formData.cedula} onChange={(e) => setFormData({ ...formData, cedula: e.target.value })} />
              <Input placeholder="Cargo" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} />
              <Input placeholder="WhatsApp (ej: +573001234567) *" required value={formData.telefono_whatsapp} onChange={(e) => setFormData({ ...formData, telefono_whatsapp: e.target.value })} />
              <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <Input placeholder="Límite mensual de servicios" type="number" value={formData.limite_servicios_mensual} onChange={(e) => setFormData({ ...formData, limite_servicios_mensual: e.target.value })} />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="bg-[#1B3A5C]" disabled={crearMutation.isPending}>
                  {crearMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center text-gray-500 py-10">Cargando empleados...</div>
      ) : (
        <div className="grid gap-3">
          {empleados.map((emp: any) => (
            <Card key={emp.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {emp.estado === 'activo' ? (
                    <UserCheck className="h-5 w-5 text-green-500" />
                  ) : (
                    <UserX className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{emp.nombre}</div>
                    <div className="text-sm text-gray-500">
                      CC: {emp.cedula} | {emp.cargo || 'Sin cargo'} | {emp.telefono_whatsapp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emp.limite_servicios_mensual && (
                    <span className="text-xs text-gray-500">
                      {emp.servicios_usados_mes}/{emp.limite_servicios_mensual} servicios
                    </span>
                  )}
                  <Badge variant={emp.estado === 'activo' ? 'default' : 'destructive'}>
                    {emp.estado}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutorizadorEmpleados;
