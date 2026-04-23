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
  FilterX,
  Phone,
  CreditCard,
  MoreHorizontal
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  rol_id: number;
  estado: string;
  empresa_cliente_id?: number;
  empresa_nombre?: string;
  telefono?: string;
  cedula?: string;
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
    empresa_cliente_id: '',
    telefono: '',
    cedula: ''
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
        empresa_cliente_id: String(user.empresa_cliente_id || ''),
        telefono: user.telefono || '',
        cedula: user.cedula || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: '1',
        estado: 'activo',
        empresa_cliente_id: '',
        telefono: '',
        cedula: ''
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

  const UserCard = ({ user, type }: { user: DashboardUser, type: 'admin' | 'supervisor' }) => (
    <Card className="mb-4 overflow-hidden border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
              {type === 'admin' ? <Shield size={20} /> : <Building2 size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{user.nombre}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Mail size={12} /> {user.email}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                <Pencil size={14} className="mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
                <Trash2 size={14} className="mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">WhatsApp</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Phone size={12} className="text-slate-400" /> {user.telefono || '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Documento</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <CreditCard size={12} className="text-slate-400" /> {user.cedula || '-'}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          {type === 'supervisor' && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200" variant="outline">
              {user.empresa_nombre || 'Sin Empresa'}
            </Badge>
          )}
          <Badge className={user.estado === 'activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'} variant="outline">
            {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Usuarios</h1>
          <p className="text-slate-500 mt-1">Control de acceso administrativo y empresarial</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-xl h-12 px-6"
          onClick={() => handleOpenModal()}
        >
          <UserPlus size={18} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* --- SECCIÓN 1: ADMINISTRADORES MASTER --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
            <Shield className="h-5 w-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Administradores Master</h2>
        </div>
        
        {/* Mobile View */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400">Cargando...</div>
          ) : masterAdmins.map(user => (
            <UserCard key={user.id} user={user} type="admin" />
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                  <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="text-left py-4 px-6 font-bold text-slate-900">Nombre</th>
                              <th className="text-left py-4 px-6 font-bold text-slate-900">Email</th>
                              <th className="text-left py-4 px-6 font-bold text-slate-900">WhatsApp</th>
                              <th className="text-left py-4 px-6 font-bold text-slate-900">Cédula</th>
                              <th className="text-center py-4 px-6 font-bold text-slate-900">Estado</th>
                              <th className="text-right py-4 px-6 font-bold text-slate-900">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {isLoading ? (
                              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Cargando administradores...</td></tr>
                          ) : masterAdmins.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50 transition">
                                  <td className="py-4 px-6 font-semibold text-slate-900">{user.nombre}</td>
                                  <td className="py-4 px-6 text-slate-500">{user.email}</td>
                                  <td className="py-4 px-6 font-mono text-xs">{user.telefono || '-'}</td>
                                  <td className="py-4 px-6 text-slate-500">{user.cedula || '-'}</td>
                                  <td className="py-4 px-6 text-center">
                                      <Badge className={user.estado === 'activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'} variant="outline">
                                          {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                      </Badge>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                      <div className="flex justify-end gap-1">
                                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)}><Pencil size={14} className="text-blue-600"/></Button>
                                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-red-500"><Trash2 size={14}/></Button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </CardContent>
          </Card>
        </div>
      </div>

      {/* --- SECCIÓN 2: SUPERVISORES POR EMPRESA --- */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-orange-600">
                <Building2 className="h-5 w-5" />
                <h2 className="text-lg font-bold uppercase tracking-wider">Supervisores Empresas</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                        placeholder="Buscar supervisor..." 
                        className="pl-9 h-11 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                      <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl">
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
                      <Button variant="ghost" size="icon" onClick={() => setFilterEmpresa('all')} className="h-11 w-11 text-red-500 border border-slate-200 rounded-xl">
                          <FilterX size={16} />
                      </Button>
                  )}
                </div>
            </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400">Cargando...</div>
          ) : supervisors.length > 0 ? (
            supervisors.map(user => (
              <UserCard key={user.id} user={user} type="supervisor" />
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 italic">No hay resultados.</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                  <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="text-left py-4 px-6 font-bold text-slate-900">Supervisor</th>
                              <th className="text-left py-4 px-6 font-bold text-slate-900">Empresa</th>
                              <th className="text-left py-4 px-6 font-bold text-slate-900">Email</th>
                              <th className="text-center py-4 px-6 font-bold text-slate-900">Estado</th>
                              <th className="text-right py-4 px-6 font-bold text-slate-900">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {isLoading ? (
                              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Cargando supervisores...</td></tr>
                          ) : supervisors.length > 0 ? (
                              supervisors.map(user => (
                                  <tr key={user.id} className="hover:bg-slate-50 transition">
                                      <td className="py-4 px-6 font-semibold text-slate-900">{user.nombre}</td>
                                      <td className="py-4 px-6">
                                          <Badge className="border-orange-200 text-orange-700 bg-orange-50" variant="outline">
                                              {user.empresa_nombre || 'Sin Empresa'}
                                          </Badge>
                                      </td>
                                      <td className="py-4 px-6 text-slate-500">{user.email}</td>
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
                                          <div className="flex justify-end gap-1">
                                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)}><Pencil size={14} className="text-blue-600"/></Button>
                                              <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-red-500"><Trash2 size={14}/></Button>
                                          </div>
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr><td colSpan={5} className="py-12 text-center text-slate-500 italic">No se encontraron supervisores.</td></tr>
                          )}
                      </tbody>
                  </table>
              </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL PARA CREAR/EDITAR */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95%] sm:max-w-[500px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>Completa la información del perfil corporativo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Nombre Completo</Label>
              <Input className="h-11 rounded-xl" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">E-mail Corporativo</Label>
              <Input className="h-11 rounded-xl" type="email" autoComplete="none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">WhatsApp</Label>
                    <Input className="h-11 rounded-xl" placeholder="57315..." value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
                </div>
                <div className="grid gap-2">
                    <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Cédula</Label>
                    <Input className="h-11 rounded-xl" placeholder="123456..." value={formData.cedula} onChange={(e) => setFormData({...formData, cedula: e.target.value})} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Rol Sistema</Label>
                    <Select value={formData.rol} onValueChange={(v) => setFormData({...formData, rol: v})}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Administrador Master</SelectItem>
                            <SelectItem value="4">Supervisor Empresa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Estado Acceso</Label>
                    <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="activo">Habilitado</SelectItem>
                            <SelectItem value="inactivo">Desactivado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {formData.rol === '4' && (
                <div className="grid gap-2 animate-in slide-in-from-top duration-300">
                    <Label className="text-orange-600 font-bold text-xs uppercase tracking-wider">Asignar a Empresa</Label>
                    <Select value={formData.empresa_cliente_id} onValueChange={(v) => setFormData({...formData, empresa_cliente_id: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-orange-200"><SelectValue placeholder="Seleccione Empresa" /></SelectTrigger>
                        <SelectContent>
                            {empresas.map(emp => (
                                <SelectItem key={emp.id} value={String(emp.id)}>{emp.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid gap-2">
              <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Contraseña {editingUser && '(opcional)'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  type="password"
                  className="pl-10 h-11 rounded-xl"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editingUser ? "Dejar en blanco para mantener" : "Mínimo 8 caracteres"}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full h-12 text-lg font-bold shadow-lg shadow-blue-600/20 rounded-xl"
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
