import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Lock,
  CheckCircle2,
  XCircle,
  Building2,
  FilterX
} from 'lucide-react';
import { adminAPI } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  rol_id: number;
  estado: string;
  empresa_cliente_id?: number;
  empresa_nombre?: string;
}

export default function MaestroUsuarios() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<DashboardUser | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '1',
    estado: 'activo',
    empresa_cliente_id: ''
  });

  // Queries
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-dashboard-users'],
    queryFn: () => adminAPI.getDashboardUsers(),
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['admin-empresas'],
    queryFn: () => adminAPI.getEmpresas(),
  });

  const handleOpenModal = (user?: DashboardUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '',
        rol: String(user.rol_id),
        estado: user.estado,
        empresa_cliente_id: String(user.empresa_cliente_id || '')
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: '1',
        estado: 'activo',
        empresa_cliente_id: ''
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.email) return;
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        rol: parseInt(formData.rol),
        empresa_cliente_id: formData.rol === '4' ? (formData.empresa_cliente_id ? parseInt(formData.empresa_cliente_id) : null) : null
      };

      if (editingUser) {
        if (!payload.password) delete payload.password;
        await adminAPI.updateDashboardUser(editingUser.id, payload);
      } else {
        await adminAPI.createDashboardUser(payload);
      }
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-users'] });
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await adminAPI.deleteDashboardUser(userId);
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-users'] });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Filtrado de Administradores Master (Viaja Colombia)
  const masterAdmins = users.filter(u => u.rol_id === 1);
  
  // Filtrado de Supervisores con empresa
  const supervisors = users.filter(u => {
    const isSupervisor = u.rol_id === 4;
    const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = filterEmpresa === 'all' || String(u.empresa_cliente_id) === filterEmpresa;
    return isSupervisor && matchesSearch && matchesEmpresa;
  });

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Maestro de Usuarios</h1>
          <p className="text-gray-600 mt-2">Gestiona el acceso de administradores y supervisores al sistema</p>
        </div>
        <Button 
          className="bg-[#1B3A5C] hover:bg-blue-900 text-white shadow-lg"
          onClick={() => handleOpenModal()}
        >
          <UserPlus size={18} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* --- SECCIÓN 1: ADMINISTRADORES MASTER --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#1B3A5C]">
            <Shield className="h-6 w-6" />
            <h2 className="text-xl font-bold italic uppercase tracking-wider">Administradores Viaja Colombia</h2>
        </div>
        <Card className="border-blue-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
                <table className="w-full text-sm">
                    <thead className="bg-blue-50/50 border-b">
                        <tr>
                            <th className="text-left py-3 px-6 font-bold text-blue-900">Nombre</th>
                            <th className="text-left py-3 px-6 font-bold text-blue-900">Email</th>
                            <th className="text-left py-3 px-6 font-bold text-blue-900 text-center">Estado</th>
                            <th className="text-right py-3 px-6 font-bold text-blue-900">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                        {isLoading ? (
                            <tr><td colSpan={4} className="py-8 text-center text-gray-400">Cargando administradores...</td></tr>
                        ) : masterAdmins.map(user => (
                            <tr key={user.id} className="hover:bg-blue-50/30 transition">
                                <td className="py-3 px-6 font-semibold">{user.nombre}</td>
                                <td className="py-3 px-6 text-gray-500">{user.email}</td>
                                <td className="py-3 px-6 text-center">
                                    <Badge className={user.estado === 'activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'} variant="outline">
                                        {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </td>
                                <td className="py-3 px-6 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)}><Pencil size={14} className="text-blue-600"/></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-red-500"><Trash2 size={14}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
      </div>

      {/* --- SECCIÓN 2: SUPERVISORES POR EMPRESA --- */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#F97316]">
                <Building2 className="h-6 w-6" />
                <h2 className="text-xl font-bold italic uppercase tracking-wider">Supervisores de Empresas</h2>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                        placeholder="Buscar supervisor..." 
                        className="pl-9 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                    <SelectTrigger className="w-[200px] h-9">
                        <SelectValue placeholder="Filtrar Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las empresas</SelectItem>
                        {empresas.map(emp => (
                            <SelectItem key={emp.id} value={String(emp.id)}>{emp.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {filterEmpresa !== 'all' && (
                    <Button variant="ghost" size="sm" onClick={() => setFilterEmpresa('all')} className="h-9 px-2 text-red-500">
                        <FilterX size={16} />
                    </Button>
                )}
            </div>
        </div>

        <Card className="border-orange-100 shadow-md overflow-hidden">
            <CardContent className="p-0">
                <table className="w-full text-sm">
                    <thead className="bg-orange-50/50 border-b">
                        <tr>
                            <th className="text-left py-4 px-6 font-bold text-orange-900">Supervisor</th>
                            <th className="text-left py-4 px-6 font-bold text-orange-900">Empresa</th>
                            <th className="text-left py-4 px-6 font-bold text-orange-900">Email</th>
                            <th className="text-left py-4 px-6 font-bold text-orange-900 text-center">Estado</th>
                            <th className="text-right py-4 px-6 font-bold text-orange-900">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="py-8 text-center text-gray-400">Cargando supervisores...</td></tr>
                        ) : supervisors.length > 0 ? (
                            supervisors.map(user => (
                                <tr key={user.id} className="hover:bg-orange-50/30 transition">
                                    <td className="py-4 px-6 font-semibold">{user.nombre}</td>
                                    <td className="py-4 px-6">
                                        <Badge className="border-orange-200 text-orange-700 bg-orange-50" variant="outline">
                                            {user.empresa_nombre || 'Sin Empresa'}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-6 text-gray-500">{user.email}</td>
                                    <td className="py-4 px-6 text-center">
                                        {user.estado === 'activo' ? (
                                            <div className="flex items-center justify-center text-green-600 font-medium">
                                                <CheckCircle2 size={14} className="mr-1" /> Activo
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center text-red-600 font-medium">
                                                <XCircle size={14} className="mr-1" /> Inactivo
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)}><Pencil size={16} className="text-blue-600"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-red-500"><Trash2 size={16}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="py-12 text-center text-gray-500 italic">No se encontraron supervisores con los filtros aplicados.</td></tr>
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
      </div>

      {/* MODAL PARA CREAR/EDITAR */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1B3A5C]">
              {editingUser ? '✎ Editar Usuario' : '✦ Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>Configura los datos de acceso y roles del personal corporativo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="text-gray-600">Nombre Completo</Label>
              <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label className="text-gray-600">E-mail Corporativo</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label className="text-gray-600">Rol Sistema</Label>
                    <Select value={formData.rol} onValueChange={(v) => setFormData({...formData, rol: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Administrador Master</SelectItem>
                            <SelectItem value="4">Supervisor Empresa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label className="text-gray-600">Estado Acceso</Label>
                    <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="activo">Habilitado</SelectItem>
                            <SelectItem value="inactivo">Desactivado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {formData.rol === '4' && (
                <div className="grid gap-2 animate-in slide-in-from-top duration-300">
                    <Label className="text-orange-600 font-bold">Asignar a Empresa</Label>
                    <Select value={formData.empresa_cliente_id} onValueChange={(v) => setFormData({...formData, empresa_cliente_id: v})}>
                        <SelectTrigger className="border-orange-200"><SelectValue placeholder="Seleccione Empresa" /></SelectTrigger>
                        <SelectContent>
                            {empresas.map(emp => (
                                <SelectItem key={emp.id} value={String(emp.id)}>{emp.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid gap-2">
              <Label className="text-gray-600">Contraseña {editingUser && '(opcional)'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  type="password"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editingUser ? "Dejar en blanco para mantener" : "Mínimo 8 caracteres"}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
                className="bg-[#1B3A5C] hover:bg-blue-900 text-white w-full h-12 text-lg shadow-md"
                onClick={handleSubmit}
                disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
