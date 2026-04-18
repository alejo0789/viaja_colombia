import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Loader2,
  Trash2,
  Pencil,
  Search,
  Power,
  CheckCircle2,
  XCircle,
  Briefcase,
  UserPlus
} from 'lucide-react';
import { masterAPI } from '@/services/api';
import { toast } from 'sonner';
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

export default function MasterGestionEmpresa() {
  const [activeTab, setActiveTab] = useState('supervisores');
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Usuarios pagination
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const userPageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalType, setModalType] = useState<'SUPERVISOR' | 'USUARIO'>('SUPERVISOR');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    area: '',
    whatsapp: '',
    cargo: '',
    email: '',
    password: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await masterAPI.getSupervisores();
      setSupervisores(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar supervisores');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsuarios = async (page: number, search: string) => {
    setIsUserLoading(true);
    try {
      const data = await masterAPI.getUsuarios(page, search, userPageSize);
      setUsuarios(data.usuarios);
      setUserTotal(data.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar empleados');
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios') {
        fetchUsuarios(userPage, userSearch);
    }
  }, [activeTab, userPage, userSearch]);

  const openAddModal = (type: 'SUPERVISOR' | 'USUARIO') => {
    setModalType(type);
    setEditingId(null);
    setFormData({ nombre: '', area: '', whatsapp: '', cargo: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (type: 'SUPERVISOR' | 'USUARIO', item: any) => {
    setModalType(type);
    setEditingId(item.id);
    setFormData({
      nombre: item.nombre || '',
      area: item.area || '',
      whatsapp: item.whatsapp || '',
      cargo: item.cargo || '',
      email: item.email || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (type: 'SUPERVISOR' | 'USUARIO', id: number, currentStatus: boolean) => {
    try {
      if (type === 'SUPERVISOR') {
        await masterAPI.updateSupervisor(id, { activo: !currentStatus });
        fetchData();
      } else {
        await masterAPI.updateUsuario(id, { activo: !currentStatus });
        fetchUsuarios(userPage, userSearch);
      }
      toast.success('Estado actualizado correctamente');
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.whatsapp) {
      toast.error('Nombre y WhatsApp son obligatorios');
      return;
    }
    
    setIsSaving(true);
    try {
      if (modalType === 'SUPERVISOR') {
        if (editingId) {
          await masterAPI.updateSupervisor(editingId, formData);
        } else {
          await masterAPI.createSupervisor(formData);
        }
        fetchData();
      } else {
        if (editingId) {
          await masterAPI.updateUsuario(editingId, formData);
        } else {
          await masterAPI.createUsuario(formData);
        }
        fetchUsuarios(userPage, userSearch);
      }
      
      toast.success(editingId ? 'Actualizado correctamente' : 'Creado correctamente');
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const totalUserPages = Math.ceil(userTotal / userPageSize);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#1B3A5C] tracking-tight">Gestión de Personal</h1>
          <p className="text-gray-500 mt-2">Administra los supervisores y empleados autorizados de tu empresa.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto gap-2">
          <TabsTrigger value="supervisores" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm font-bold flex gap-2">
            <ShieldCheck size={20} />
            Supervisores por Área
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm font-bold flex gap-2">
            <Users size={20} />
            Empleados Autorizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supervisores" className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-purple-600" size={24} />
                Lista de Supervisores
             </h3>
             <Button onClick={() => openAddModal('SUPERVISOR')} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg flex gap-2">
                <Plus size={18} />
                Nuevo Supervisor
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {isLoading ? (
               <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-purple-600" size={48} />
                  <p className="text-gray-400 font-medium tracking-wide">Cargando supervisores...</p>
               </div>
            ) : supervisores.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No hay supervisores registrados aún.</p>
                  <Button variant="link" onClick={() => openAddModal('SUPERVISOR')} className="text-purple-600 font-bold">Crear el primero</Button>
               </div>
            ) : (
              supervisores.map((s) => (
                <Card key={s.id} className={`border-none shadow-md overflow-hidden transition-all hover:shadow-xl ${!s.activo ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                  <div className={`h-1.5 w-full ${s.activo ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${s.activo ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{s.nombre}</p>
                          <p className="text-xs font-bold text-purple-600 uppercase tracking-tighter">{s.area || 'Sin Área'}</p>
                        </div>
                      </div>
                      <Badge variant={s.activo ? "default" : "secondary"} className={s.activo ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500"}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Plus className="rotate-45 text-purple-300" size={14} />
                            <span className="font-medium text-gray-500">WhatsApp:</span>
                            <span className="font-mono">{s.whatsapp}</span>
                        </div>
                        {s.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Plus className="rotate-45 text-purple-300" size={14} />
                                <span className="font-medium text-gray-500">Email:</span>
                                <span className="truncate">{s.email}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t mt-4">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal('SUPERVISOR', s)} className="flex-1 hover:bg-blue-50 hover:text-blue-700 font-bold gap-2">
                        <Pencil size={14} /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus('SUPERVISOR', s.id, s.activo)} className={`flex-1 font-bold gap-2 ${s.activo ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}`}>
                        <Power size={14} /> {s.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-blue-600" size={24} />
                    Empleados Autorizados
                </h3>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input 
                            placeholder="Buscar empleado..." 
                            className="pl-10 w-[250px] rounded-xl h-10 border-gray-200" 
                            value={userSearch}
                            onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                        />
                    </div>
                    <Button onClick={() => openAddModal('USUARIO')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex gap-2">
                        <UserPlus size={18} />
                        Añadir Empleado
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-lg overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Empleado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Cargo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">WhatsApp</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isUserLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="animate-spin mx-auto text-blue-600" size={40} />
                                            <p className="mt-4 text-gray-400 font-medium">Sincronizando empleados...</p>
                                        </td>
                                    </tr>
                                ) : usuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 italic">
                                            {userSearch ? 'No se encontraron resultados para tu búsqueda.' : 'No hay empleados registrados.'}
                                        </td>
                                    </tr>
                                ) : (
                                    usuarios.map((u) => (
                                        <tr key={u.id} className={`hover:bg-blue-50/30 transition-colors ${!u.activo ? 'bg-gray-50 opacity-60' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black ${u.activo ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                                                        {u.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{u.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Briefcase size={14} className="text-blue-400" />
                                                    {u.cargo || 'No definido'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm text-gray-500">{u.whatsapp}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                                                    {u.activo ? <CheckCircle2 size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                                                    {u.activo ? 'Activo' : 'Suspendido'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditModal('USUARIO', u)} className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded-lg">
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus('USUARIO', u.id, u.activo)} className={`h-8 w-8 rounded-lg ${u.activo ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                                                        <Power size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalUserPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-400">Total: {userTotal} empleados</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={userPage === 1} onClick={() => setUserPage(userPage - 1)}>Anterior</Button>
                                <Button size="sm" variant="outline" disabled={userPage === totalUserPages} onClick={() => setUserPage(userPage + 1)}>Siguiente</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL GESTIÓN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl p-0 overflow-hidden">
          <div className={`h-1.5 w-full ${modalType === 'SUPERVISOR' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <div className={`p-2 rounded-xl ${modalType === 'SUPERVISOR' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {modalType === 'SUPERVISOR' ? <ShieldCheck size={28} /> : <Users size={28} />}
                </div>
                {editingId ? 'Editar' : 'Añadir'} {modalType === 'SUPERVISOR' ? 'Supervisor' : 'Empleado'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                {editingId ? 'Actualiza los datos del miembro seleccionado.' : 'Completa la información para autorizar el nuevo miembro en el sistema.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-8">
               <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700 ml-1">Nombre Completo</Label>
                  <Input 
                    placeholder="Ej: Juan Antonio Pérez"
                    className="h-12 rounded-xl border-gray-200" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
               </div>

               <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700 ml-1">Número de WhatsApp</Label>
                  <Input 
                    placeholder="Ej: 57315..."
                    className="h-12 rounded-xl border-gray-200 font-mono" 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                  <p className="text-[10px] text-gray-400 ml-1 italic font-medium">Incluye el código de país sin el signo +</p>
               </div>

               {modalType === 'SUPERVISOR' ? (
                 <>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 ml-1">Área / Departamento</Label>
                        <Input 
                            placeholder="Ej: Recursos Humanos, Compras..."
                            className="h-12 rounded-xl border-gray-200" 
                            value={formData.area}
                            onChange={(e) => setFormData({...formData, area: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2 flex flex-col gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-purple-700 ml-1">Correo (Acceso Web)</Label>
                            <Input 
                                type="email"
                                placeholder="email@empresa.com"
                                className="h-10 rounded-lg border-purple-200/50" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-purple-700 ml-1">Contraseña</Label>
                            <Input 
                                type="password"
                                placeholder={editingId ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
                                className="h-10 rounded-lg border-purple-200/50" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>
                 </>
               ) : (
                 <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 ml-1">Cargo / Puesto</Label>
                    <Input 
                        placeholder="Ej: Analista de Sistemas, Gerente..."
                        className="h-12 rounded-xl border-gray-200" 
                        value={formData.cargo}
                        onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    />
                 </div>
               )}
            </div>

            <DialogFooter className="bg-gray-50 -mx-8 -mb-8 p-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className={`${modalType === 'SUPERVISOR' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'} text-white rounded-xl h-12 px-10 font-bold shadow-xl transition-all hover:scale-105 active:scale-95`}
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" size={18}/> : null}
                {editingId ? 'Guardar Cambios' : `Crear ${modalType === 'SUPERVISOR' ? 'Supervisor' : 'Empleado'}`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
