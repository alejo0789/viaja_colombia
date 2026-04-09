import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Search, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  Lock,
  CheckCircle2,
  XCircle
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
}

export default function MaestroUsuarios() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<DashboardUser | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '1',
    estado: 'activo'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getDashboardUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching dashboard users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: DashboardUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '', // Hidden for security, only change if entered
        rol: String(user.rol_id),
        estado: user.estado
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: '1',
        estado: 'activo'
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.email) return;
    setIsSaving(true);
    try {
      if (editingUser) {
        // Prepare data for patch (don't send empty password)
        const patchData: any = { ...formData, rol: parseInt(formData.rol) };
        if (!patchData.password) delete patchData.password;
        await adminAPI.updateDashboardUser(editingUser.id, patchData);
      } else {
        await adminAPI.createDashboardUser({ ...formData, rol: parseInt(formData.rol) });
      }
      setIsOpen(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario administrador?')) return;
    try {
      await adminAPI.deleteDashboardUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Maestro de Usuarios</h1>
          <p className="text-gray-600 mt-2">Gestiona el acceso de administradores al dashboard de Viaja Colombia</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleOpenModal()}
        >
          <UserPlus size={18} className="mr-2" />
          Nuevo Administrador
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por nombre o email..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Rol</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Estado</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <Loader2 className="animate-spin inline-block mr-2 text-blue-600" /> Cargando usuarios...
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{user.nombre}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          <Shield size={12} className="mr-1" />
                          {user.rol}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {user.estado === 'activo' ? (
                          <span className="flex items-center text-green-600 text-sm font-medium">
                            <CheckCircle2 size={14} className="mr-1" /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 text-sm font-medium">
                            <XCircle size={14} className="mr-1" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenModal(user)}
                          >
                            <Pencil size={16} className="text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      No se encontraron usuarios Dashboard.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE/EDIT MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Administrador' : 'Nuevo Administrador Dashboard'}
            </DialogTitle>
            <DialogDescription>
              Controla quién tiene acceso a la plataforma administrativa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="u_nombre">Nombre Completo</Label>
              <Input 
                id="u_nombre" 
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u_email">Correo Electrónico</Label>
              <Input 
                id="u_email" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u_password">Empresa o Rol</Label>
              <Select value={formData.rol} onValueChange={(v) => setFormData({...formData, rol: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Administrador Master</SelectItem>
                  <SelectItem value="4">Autorizador Empresa</SelectItem>
                  <SelectItem value="2">Conductor (Dashboard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u_pass">Nueva Contraseña {editingUser && '(opcional)'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  id="u_pass" 
                  type="password"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editingUser ? "Solo si deseas cambiarla" : "Mínimo 8 caracteres"}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Estado de Evaluación</Label>
               <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Habilitado (Acceso total)</SelectItem>
                  <SelectItem value="inactivo">Inhabilitado (Sin acceso)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                onClick={handleSubmit}
                disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18}/> : null}
              {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
