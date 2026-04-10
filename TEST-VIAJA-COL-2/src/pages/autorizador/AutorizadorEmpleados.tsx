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
import { Plus, UserCheck, UserX, BarChart2, Calendar, Search, ChevronLeft, ChevronRight, ListOrdered, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AutorizadorEmpleados = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', cedula: '', cargo: '', telefono_whatsapp: '', email: '', limite_servicios_mensual: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userServices, setUserServices] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'month' | 'total'>('total');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['autorizador-empleados', searchTerm, currentPage],
    queryFn: () => autorizadorAPI.getEmpleados({ 
        search: searchTerm, 
        page: currentPage, 
        size: pageSize 
    }),
  });

  const crearMutation = useMutation({
    mutationFn: (data: any) => autorizadorAPI.createEmpleado(data), // Corregido el nombre del método
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

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => autorizadorAPI.toggleEmpleadoStatus(id),
    onSuccess: () => {
      toast({ title: 'Estado actualizado', description: 'El estado del empleado ha sido modificado.' });
      queryClient.invalidateQueries({ queryKey: ['autorizador-empleados'] });
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

  const handleOpenHistory = async (user: any, filter: 'month' | 'total' = 'total') => {
    setSelectedUser(user);
    setHistoryFilter(filter);
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    try {
        const response = await autorizadorAPI.getEmpleadoServicios(user.id);
        let services = response.servicios || [];
        
        if (filter === 'month') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            services = services.filter((s: any) => {
                // El backend devuelve fecha en formato dd/mm/yyyy
                const parts = s.fecha.split('/');
                if (parts.length < 3) return false;
                const sMonth = parseInt(parts[1]) - 1;
                const sYear = parseInt(parts[2].split(' ')[0]);
                return sMonth === currentMonth && sYear === currentYear;
            });
        }
        
        setUserServices(services);
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo cargar el historial.' });
    } finally {
        setIsLoadingHistory(false);
    }
  };

  const empleados = data?.empleados || [];
  const totalEmployees = data?.total || 0;
  const totalPages = Math.ceil(totalEmployees / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Gestión de Empleados</h1>
          <p className="text-gray-500 text-sm">Activa/Inactiva personal y supervisa su uso de servicios.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                    placeholder="Buscar por nombre o cel..." 
                    className="pl-9 h-10 border-gray-200"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#1B3A5C] h-10">
                <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
        </div>
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
        <div className="grid gap-4">
          {empleados.map((emp: any) => (
            <Card key={emp.id} className={!emp.activo ? 'bg-gray-50 opacity-80' : ''}>
              <CardContent className="flex flex-col sm:flex-row items-center justify-between py-5 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`p-3 rounded-full ${emp.activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {emp.activo ? <UserCheck size={24} /> : <UserX size={24} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900">{emp.nombre}</span>
                      <Badge variant={emp.activo ? 'default' : 'destructive'}>
                        {emp.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {emp.cargo || 'Sin cargo'} | WhatsApp: {emp.whatsapp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex flex-col items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Servicios</span>
                    <div className="flex gap-6">
                      <div 
                        className="text-center cursor-pointer hover:scale-110 transition-transform group"
                        onClick={() => handleOpenHistory(emp, 'month')}
                        title="Ver servicios de este mes"
                      >
                        <div className="text-lg font-black text-[#1B3A5C] group-hover:text-blue-600">
                          {emp.servicios_mes}
                        </div>
                        <div className="text-[9px] uppercase text-gray-500 font-medium">Este Mes</div>
                      </div>
                      <div className="w-px h-8 bg-gray-200 self-center"></div>
                      <div 
                        className="text-center cursor-pointer hover:scale-110 transition-transform group"
                        onClick={() => handleOpenHistory(emp, 'total')}
                        title="Ver historial total"
                      >
                        <div className="text-lg font-black text-[#1B3A5C] group-hover:text-blue-600">
                          {emp.total_servicios}
                        </div>
                        <div className="text-[9px] uppercase text-gray-500 font-medium">Total</div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="ghost"
                    size="sm"
                    className={`h-10 px-4 rounded-lg font-semibold transition-all ${
                      emp.activo 
                        ? 'text-red-500 hover:bg-red-50 hover:text-red-600' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    onClick={() => toggleStatusMutation.mutate(emp.id)}
                    disabled={toggleStatusMutation.isPending}
                  >
                    {emp.activo ? <UserX size={16} className="mr-2" /> : <UserCheck size={16} className="mr-2" />}
                    {emp.activo ? 'Inactivar' : 'Activar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-6">
            <p className="text-sm text-gray-500">
                Mostrando página <span className="font-bold">{currentPage}</span> de {totalPages}
            </p>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    <ChevronLeft size={16} /> Anterior
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Siguiente <ChevronRight size={16} />
                </Button>
            </div>
        </div>
      )}

      {/* History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[600px] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="text-blue-600" />
              {historyFilter === 'month' ? 'Servicios del Mes' : 'Historial Total'} — {selectedUser?.nombre}
            </DialogTitle>
            <DialogDescription>
              {historyFilter === 'month' 
                ? 'Viajes realizados durante el mes actual.' 
                : 'Registro histórico completo de viajes realizados.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 px-1">
            {isLoadingHistory ? (
                <div className="text-center py-20 text-gray-400 animate-pulse">Consultando historial...</div>
            ) : userServices.length > 0 ? (
                <div className="space-y-3">
                    {userServices.map((s) => (
                        <div key={s.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-gray-900 font-medium">
                                    <MapPin size={12} className="text-green-600" /> {s.origen}
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <MapPin size={12} className="text-red-600" /> {s.destino}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                    <Calendar size={10} /> {s.fecha}
                                </div>
                            </div>
                            <Badge variant={s.estado === 'COMPLETADO' ? 'outline' : 'secondary'} className="h-fit">
                                {s.estado}
                            </Badge>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-400">Este usuario todavía no tiene servicios registrados.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutorizadorEmpleados;
