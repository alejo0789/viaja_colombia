import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Plus, 
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  Loader2,
  Trash2,
  Pencil,
  Search,
  ExternalLink,
  ChevronLeft,
  Power,
  CheckCircle2,
  XCircle,
  Ban,
  MoreVertical,
  UserCircle,
  X
} from 'lucide-react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Supervisor {
  id: number;
  nombre: string;
  area: string;
  whatsapp: string;
}

interface Usuario {
  id: number;
  nombre: string;
  whatsapp: string;
  cargo: string;
}

interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  supervisores: Supervisor[];
  usuarios_count: number;
  master_supervisor?: {
    id: number;
    nombre: string;
    email: string;
  } | null;
}

export default function GestionEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Create Modal State (Empresa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEmpresa, setNewEmpresa] = useState({
    nombre: '',
    nit: '',
    email: '',
    telefono: ''
  });

  // Modal State (Supervisor/User)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberType, setMemberType] = useState<'SUPERVISOR' | 'USUARIO' | 'MASTER'>('SUPERVISOR');
  const [targetEmpresaId, setTargetEmpresaId] = useState<number | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [newMember, setNewMember] = useState({
    nombre: '',
    area: '',
    whatsapp: '',
    cargo: '',
    email: '',
    password: '',
    telefono: '',
    cedula: ''
  });

  // Bulk User Management Modal
  const [isBulkUsersModalOpen, setIsBulkUsersModalOpen] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<Usuario[]>([]);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkPage, setBulkPage] = useState(1);
  const [bulkSearch, setBulkSearch] = useState('');
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const pageSize = 8;

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBulkUsers = async (empresaId: number, page: number, search: string) => {
    setIsBulkLoading(true);
    try {
      const data = await adminAPI.getEmpresaUsuariosPaginated(empresaId, page, search, pageSize);
      setBulkUsers(data.usuarios);
      setBulkTotal(data.total);
    } catch (error) {
      console.error('Error fetching bulk users:', error);
    } finally {
      setIsBulkLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  useEffect(() => {
    if (isBulkUsersModalOpen && targetEmpresaId) {
      fetchBulkUsers(targetEmpresaId, bulkPage, bulkSearch);
    }
  }, [bulkPage, bulkSearch, isBulkUsersModalOpen, targetEmpresaId]);

  const handleCreateEmpresa = async () => {
    if (!newEmpresa.nombre || !newEmpresa.nit) return;
    setIsSaving(true);
    try {
      await adminAPI.createEmpresa(newEmpresa);
      setIsModalOpen(false);
      setNewEmpresa({ nombre: '', nit: '', email: '', telefono: '' });
      await fetchEmpresas();
    } catch (error) {
      console.error('Error creating empresa:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddMember = (type: 'SUPERVISOR' | 'USUARIO' | 'MASTER', empresaId: number) => {
    setMemberType(type);
    setTargetEmpresaId(empresaId);
    setEditingMemberId(null);
    setNewMember({ nombre: '', area: '', whatsapp: '', cargo: '', email: '', password: '', telefono: '', cedula: '' });
    setIsAddMemberModalOpen(true);
  };

  const openEditMember = (type: 'SUPERVISOR' | 'USUARIO' | 'MASTER', empresaId: number, member: any) => {
    setMemberType(type);
    setTargetEmpresaId(empresaId);
    setEditingMemberId(member.id);
    setNewMember({ 
      nombre: member.nombre || '',
      area: member.area || '',
      whatsapp: member.whatsapp || '', 
      cargo: member.cargo || '',
      email: member.email || '',
      password: '',
      telefono: member.telefono || '',
      cedula: member.cedula || ''
    });
    setIsAddMemberModalOpen(true);
  };

  const handleAddMember = async () => {
    // Para MASTER no es obligatorio el whatsapp
    const isMaster = memberType === 'MASTER';
    if (!newMember.nombre || (!newMember.whatsapp && !isMaster) || !targetEmpresaId) return;
    setIsSaving(true);
    try {
      if (editingMemberId) {
        if (memberType === 'SUPERVISOR') {
          await adminAPI.updateSupervisor(editingMemberId, newMember);
        } else if (memberType === 'MASTER') {
          await adminAPI.updateDashboardUser(editingMemberId, {
            nombre: newMember.nombre,
            email: newMember.email,
            password: newMember.password,
            telefono: newMember.telefono,
            cedula: newMember.cedula,
            rol: 5,
            empresa_cliente_id: targetEmpresaId
          });
        } else {
          await adminAPI.updateUsuario(editingMemberId, newMember);
        }
        toast.success('Miembro actualizado exitosamente');
      } else {
        if (memberType === 'SUPERVISOR') {
          await adminAPI.createSupervisor({ ...newMember, empresa_id: targetEmpresaId });
        } else if (memberType === 'MASTER') {
          // Crear Usuario Dashboard con Rol 5
          await adminAPI.createDashboardUser({
            nombre: newMember.nombre,
            email: newMember.email,
            password: newMember.password,
            telefono: newMember.telefono,
            cedula: newMember.cedula,
            rol: 5,
            empresa_cliente_id: targetEmpresaId
          });
        } else {
          await adminAPI.createUsuario({ ...newMember, empresa_id: targetEmpresaId });
        }
        toast.success('Miembro añadido exitosamente');
      }
      setIsAddMemberModalOpen(false);
      if (isBulkUsersModalOpen) {
          fetchBulkUsers(targetEmpresaId, bulkPage, bulkSearch);
      } else {
          await fetchEmpresas();
      }
    } catch (error: any) {
      console.error('Error saving member:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Error al guardar el miembro';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (type: 'SUPERVISOR' | 'USUARIO' | 'MASTER', id: number) => {
    if (!confirm('¿Estás seguro de eliminar este miembro?')) return;
    try {
      if (type === 'SUPERVISOR') {
        await adminAPI.deleteSupervisor(id);
      } else if (type === 'MASTER') {
        await adminAPI.deleteDashboardUser(id);
      } else {
        await adminAPI.deleteUsuario(id);
      }
      if (isBulkUsersModalOpen && targetEmpresaId) {
          fetchBulkUsers(targetEmpresaId, bulkPage, bulkSearch);
      } else {
          await fetchEmpresas();
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };
  const handleToggleStatus = async (type: 'SUPERVISOR' | 'USUARIO', member: any) => {
    try {
      const newStatus = !member.activo;
      if (type === 'SUPERVISOR') {
        await adminAPI.updateSupervisor(member.id, { activo: newStatus });
      } else {
        await adminAPI.updateUsuario(member.id, { activo: newStatus });
      }
      
      // Actualizar vista local
      if (type === 'USUARIO') {
        setBulkUsers(prev => prev.map(u => u.id === member.id ? { ...u, activo: newStatus } : u));
      }
      fetchEmpresas(); // Recargar todas por si acaso (para contadores)
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openBulkUsers = (empresaId: number) => {
    setTargetEmpresaId(empresaId);
    setBulkPage(1);
    setBulkSearch('');
    setIsBulkUsersModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Empresas</h1>
          <p className="text-gray-600 mt-2">Administra empresas clientes, supervisores y personal autorizado</p>
        </div>
        <Button 
          className="bg-[#1B3A5C] hover:bg-[#2c5c8f] text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} className="mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : empresas.length > 0 ? (
          empresas.map((empresa) => (
            <Card key={empresa.id} className="overflow-hidden border-2 hover:border-blue-200 transition-all duration-300">
              <div 
                className="p-4 md:p-6 cursor-pointer flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(empresa.id)}
              >
                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                  <div className="bg-blue-50 p-3 md:p-4 rounded-2xl shrink-0">
                    <Building2 className="text-blue-600" size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate tracking-tight">{empresa.nombre}</h2>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><ShieldCheck size={12}/> {empresa.nit}</span>
                      <span className="hidden sm:flex items-center gap-1"><Mail size={12}/> {empresa.email}</span>
                      <span className="flex items-center gap-1"><Phone size={12}/> {empresa.telefono}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right mr-2 hidden sm:block">
                    <p className="text-xs font-black text-slate-900">{empresa.supervisores.length} Supervisores</p>
                    <p className="text-[10px] font-bold text-slate-400">{empresa.usuarios_count} Empleados</p>
                  </div>
                  <div className={`p-2 rounded-full transition-transform duration-300 ${expandedId === empresa.id ? 'bg-blue-50 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>

              {expandedId === empresa.id && (
                <CardContent className="bg-slate-50/50 border-t p-0 animate-in slide-in-from-top-4 duration-300">
                  <Tabs defaultValue="personal" className="w-full">
                    <div className="px-4 md:px-8 pt-4 bg-white border-b border-slate-100">
                      <TabsList className="bg-slate-100/50 p-1 rounded-xl h-11 w-full sm:w-fit">
                        <TabsTrigger value="personal" className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                          Personal & Auditor
                        </TabsTrigger>
                        <TabsTrigger value="supervisores" className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                          Supervisores
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="personal" className="p-4 md:p-8 space-y-6 m-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Auditor General */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                              <ShieldCheck size={24} />
                            </div>
                            <div className="flex gap-2">
                               <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-9 w-9 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (empresa.master_supervisor) {
                                    openEditMember('MASTER' as any, empresa.id, { ...empresa.master_supervisor, whatsapp: '' });
                                  } else {
                                    openAddMember('MASTER', empresa.id);
                                  }
                                }}
                              >
                                {empresa.master_supervisor ? <Pencil size={16} /> : <Plus size={16} />}
                              </Button>
                              {empresa.master_supervisor && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMember('MASTER', empresa.master_supervisor!.id);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">Auditor General</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase mb-4">Dashboard Corporativo</p>
                            
                            {empresa.master_supervisor ? (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="font-bold text-blue-800 text-sm">{empresa.master_supervisor.nombre}</p>
                                <p className="text-[11px] font-bold text-slate-400">{empresa.master_supervisor.email}</p>
                              </div>
                            ) : (
                              <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                <span className="text-xs text-slate-400 font-bold italic">No hay auditor asignado</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Usuarios (Empleados) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                              <Users size={24} />
                            </div>
                            <div className="text-right">
                              <span className="block text-2xl font-black text-slate-900 leading-none">{empresa.usuarios_count}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Empleados</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">Personal Autorizado</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase mb-4">Usuarios registrados</p>
                            
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                openBulkUsers(empresa.id);
                              }}
                            >
                              <ExternalLink size={16} className="mr-2" /> Gestionar Nómina
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="supervisores" className="p-4 md:p-8 m-0 space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Lista de Autorizadores</h3>
                        <Button 
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-9 px-4 font-bold text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddMember('SUPERVISOR', empresa.id);
                          }}
                        >
                          <Plus size={14} className="mr-1.5" /> Añadir
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {empresa.supervisores.length > 0 ? (
                          empresa.supervisores.map((s) => (
                            <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate">{s.nombre}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-400">WA: {s.whatsapp}</span>
                                  {s.area && (
                                    <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">{s.area}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 pl-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                      <MoreVertical size={16} className="text-slate-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                                    <DropdownMenuItem onClick={() => handleToggleStatus('SUPERVISOR', s)} className="font-bold text-xs uppercase tracking-tighter">
                                      {s.activo ? <XCircle size={14} className="mr-2 text-rose-500" /> : <CheckCircle2 size={14} className="mr-2 text-emerald-500" />}
                                      {s.activo ? 'Desactivar' : 'Activar'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditMember('SUPERVISOR', empresa.id, s)} className="font-bold text-xs uppercase tracking-tighter">
                                      <Pencil size={14} className="mr-2 text-blue-500" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteMember('SUPERVISOR', s.id)} className="font-bold text-xs uppercase tracking-tighter text-rose-600">
                                      <Trash2 size={14} className="mr-2" /> Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                             <p className="text-slate-400 text-xs font-bold italic">No hay supervisores registrados</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
            <p className="text-gray-400">No hay empresas registradas todavía.</p>
            <Button 
              className="mt-4 bg-[#1B3A5C]" 
              variant="outline"
              onClick={() => setIsModalOpen(true)}
            >
              Crear mi primera empresa
            </Button>
          </div>
        )}
      </div>

      {/* MODAL GESTIÓN MASIVA USUARIOS */}
      <Dialog open={isBulkUsersModalOpen} onOpenChange={setIsBulkUsersModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden bg-gray-50 border-0 shadow-2xl">
          <DialogHeader className="p-6 border-b bg-white shadow-sm z-10 relative">
            <DialogClose className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              <X size={20} />
            </DialogClose>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold text-[#1B3A5C]">
                  Gestión de Personal Autorizado
                </DialogTitle>
                <DialogDescription className="mt-1 text-gray-500">
                  Explora y administra el listado de empleados con acceso a servicios.
                </DialogDescription>
              </div>
              <div className="bg-blue-50 px-5 py-2.5 rounded-xl flex flex-col items-center border border-blue-100/50">
                 <span className="text-xs uppercase tracking-wider text-blue-600 font-bold mb-0.5">Total Empleados</span>
                 <span className="text-3xl leading-none font-black text-blue-700">{bulkTotal}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row mt-6 gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input 
                  placeholder="Buscar empleado por nombre o teléfono..." 
                  className="pl-11 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all shadow-inner"
                  value={bulkSearch}
                  onChange={(e) => { setBulkSearch(e.target.value); setBulkPage(1); }}
                />
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 shadow-sm font-semibold whitespace-nowrap transition-colors border border-blue-700/50"
                onClick={() => targetEmpresaId && openAddMember('USUARIO', targetEmpresaId)}
              >
                <Plus size={18} className="mr-2" /> Nuevo Empleado
              </Button>

            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden min-h-[300px]">
                {isBulkLoading ? (
                    <div className="min-h-[350px] flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                        <p className="text-gray-400 font-medium animate-pulse">Consultando base de datos...</p>
                    </div>
                ) : bulkUsers.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {bulkUsers.map((u) => (
                            <div key={u.id} className="p-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-blue-50/40 transition-colors group gap-4 sm:gap-0">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200/50 shadow-sm shrink-0">
                                      {u.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-900 text-base truncate">{u.nombre}</p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            <span className="flex items-center text-xs text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md font-medium border border-orange-100/50">
                                              {u.cargo || 'Sin cargo asignado'}
                                            </span>
                                            <span className="flex items-center text-xs text-gray-500 font-medium">
                                              <Phone size={12} className="mr-1.5 opacity-70" /> {u.whatsapp}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
                                    {u.activo ? (
                                      <Badge className="bg-green-100 text-green-700 border-green-200">Activo</Badge>
                                    ) : (
                                      <Badge className="bg-gray-100 text-gray-500 border-gray-200">Inactivo</Badge>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={`h-9 w-9 transition-colors rounded-lg ${u.activo ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                      onClick={() => handleToggleStatus('USUARIO', u)}
                                      title={u.activo ? "Desactivar empleado" : "Activar empleado"}
                                    >
                                      <Power size={18} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="hover:bg-blue-100/50 text-blue-600 transition-colors h-9 px-3"
                                      onClick={() => targetEmpresaId && openEditMember('USUARIO', targetEmpresaId, u)}
                                    >
                                        <Pencil size={16} className="mr-2" /> Editar
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 hover:bg-red-50 text-red-500 transition-colors rounded-lg"
                                      onClick={() => handleDeleteMember('USUARIO', u.id)}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="min-h-[350px] flex flex-col items-center justify-center text-gray-400 p-10 space-y-4">
                        <div className="bg-gray-50/80 p-5 rounded-full border border-gray-100 shadow-sm">
                          <Users size={56} className="text-gray-300" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-600">No hay empleados encontrados</h4>
                        <p className="text-sm text-gray-400 text-center max-w-sm">
                           Intenta buscar con otro nombre o {bulkSearch ? 'limpia el filtro' : 'añade el primer empleado a esta empresa'}.
                        </p>
                        {bulkSearch && (
                          <Button variant="outline" className="mt-2" onClick={() => { setBulkSearch(''); setBulkPage(1); }}>
                             Limpiar búsqueda
                          </Button>
                        )}
                    </div>
                )}
            </div>
          </div>

          <DialogFooter className="p-4 sm:px-6 border-t bg-white z-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
             <div className="text-sm font-medium text-gray-500 w-full sm:w-auto text-center">
                Mostrando página <span className="text-gray-900 font-bold">{bulkPage}</span> de <span className="text-gray-900 font-bold">{Math.max(1, Math.ceil(bulkTotal / pageSize))}</span>
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50"
                    disabled={bulkPage <= 1}
                    onClick={() => setBulkPage(bulkPage - 1)}
                >
                    <ChevronLeft size={16} className="mr-2" /> Anterior
                </Button>
                <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50"
                    disabled={bulkPage >= Math.ceil(bulkTotal / pageSize) || bulkTotal === 0}
                    onClick={() => setBulkPage(bulkPage + 1)}
                >
                    Siguiente <ChevronRight size={16} className="ml-2" />
                </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CREACIÓN EMPRESA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Empresa Cliente</DialogTitle>
            <DialogDescription>
              Registra los datos básicos de la empresa para habilitar sus servicios de transporte.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">Nombre</Label>
              <Input 
                id="nombre" 
                className="col-span-3" 
                value={newEmpresa.nombre}
                onChange={(e) => setNewEmpresa({...newEmpresa, nombre: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nit" className="text-right">NIT</Label>
              <Input 
                id="nit" 
                className="col-span-3" 
                value={newEmpresa.nit}
                onChange={(e) => setNewEmpresa({...newEmpresa, nit: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input 
                id="email" 
                type="email" 
                className="col-span-3"
                value={newEmpresa.email}
                onChange={(e) => setNewEmpresa({...newEmpresa, email: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">Teléfono</Label>
              <Input 
                id="telefono" 
                className="col-span-3"
                value={newEmpresa.telefono}
                onChange={(e) => setNewEmpresa({...newEmpresa, telefono: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-[#F97316] hover:bg-orange-600"
              disabled={isSaving}
              onClick={handleCreateEmpresa}
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18}/> : null}
              Guardar Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CREACIÓN MIEMBRO (SUPERVISOR O USUARIO) */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent className={`sm:max-w-[${memberType === 'MASTER' ? '550px' : '425px'}] transition-all duration-300 border-none shadow-2xl overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${memberType === 'MASTER' ? 'bg-purple-600' : 'bg-orange-500'}`}></div>
          <DialogHeader className="pt-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {memberType === 'MASTER' ? <ShieldCheck className="text-purple-600" size={24} /> : (memberType === 'SUPERVISOR' ? <Users className="text-orange-500" size={24} /> : <UserCircle size={24} />)}
              {editingMemberId ? 'Actualizar' : 'Registrar'} {
                memberType === 'SUPERVISOR' ? 'Supervisor' : 
                memberType === 'MASTER' ? 'Auditor General' :
                'Empleado'
              }
            </DialogTitle>
            <DialogDescription className="text-gray-500">
               {memberType === 'MASTER' 
                 ? 'Asigna un responsable para monitorear aprobaciones y estadísticas corporativas.' 
                 : 'Completa la información para habilitar el acceso al sistema.'
               }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2 col-span-2">
                  <Label htmlFor="m_nombre" className="text-sm font-semibold text-gray-700">Nombre Completo</Label>
                  <Input 
                    id="m_nombre" 
                    placeholder="Ej: Juan Perez"
                    className="h-10 border-gray-200 focus-visible:ring-purple-600" 
                    value={newMember.nombre}
                    onChange={(e) => setNewMember({...newMember, nombre: e.target.value})}
                  />
               </div>

               {memberType === 'MASTER' && (
                 <>
                   <div className="space-y-2">
                      <Label htmlFor="m_cedula" className="text-sm font-semibold text-gray-700">Cédula / ID</Label>
                      <Input 
                        id="m_cedula" 
                        placeholder="Documento de identidad"
                        className="h-10 border-gray-200" 
                        value={newMember.cedula}
                        onChange={(e) => setNewMember({...newMember, cedula: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="m_telefono" className="text-sm font-semibold text-gray-700">Teléfono</Label>
                      <Input 
                        id="m_telefono" 
                        placeholder="Número de contacto"
                        className="h-10 border-gray-200" 
                        value={newMember.telefono}
                        onChange={(e) => setNewMember({...newMember, telefono: e.target.value})}
                      />
                   </div>
                 </>
               )}

               {memberType !== 'MASTER' && (
                 <div className="space-y-2 col-span-2">
                    <Label htmlFor="m_whatsapp" className="text-sm font-semibold text-gray-700">WhatsApp</Label>
                    <Input 
                      id="m_whatsapp" 
                      placeholder="Ej: 57315..."
                      className="h-10 border-gray-200" 
                      value={newMember.whatsapp}
                      onChange={(e) => setNewMember({...newMember, whatsapp: e.target.value})}
                    />
                 </div>
               )}

               {(memberType === 'SUPERVISOR' || memberType === 'MASTER') && (
                 <>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="m_email" className="text-sm font-semibold text-gray-700">Correo Electrónico</Label>
                      <Input 
                        id="m_email" 
                        type="email"
                        autoComplete="none"
                        placeholder="email@empresa.com"
                        className="h-10 border-gray-200" 
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="m_pass" className="text-sm font-semibold text-gray-700">Contraseña de Acceso</Label>
                      <Input 
                        id="m_pass" 
                        type="password"
                        autoComplete="new-password"
                        placeholder={editingMemberId ? "•••••• (Vacio para mantener)" : "Definir contraseña"}
                        className="h-10 border-gray-200" 
                        value={newMember.password}
                        onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                      />
                    </div>
                 </>
               )}

               {memberType === 'SUPERVISOR' && (
                 <div className="space-y-2 col-span-2">
                    <Label htmlFor="m_area" className="text-sm font-semibold text-gray-700">Área Responsable</Label>
                    <Input 
                      id="m_area" 
                      placeholder="Ej: RRHH, Finanzas..."
                      className="h-10 border-gray-200" 
                      value={newMember.area}
                      onChange={(e) => setNewMember({...newMember, area: e.target.value})}
                    />
                 </div>
               )}
            </div>

            {memberType === 'MASTER' && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex gap-3">
                <ShieldCheck size={20} className="text-purple-600 shrink-0" />
                <p className="text-xs text-purple-700 leading-relaxed">
                  <strong>Permisos de Auditoría:</strong> El usuario podrá visualizar el ranking de supervisores, estados de servicios y estadísticas globales de la compañía.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50 -mx-6 -mb-6 p-6">
            <Button 
              variant="outline"
              className="border-gray-300"
              onClick={() => setIsAddMemberModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className={`${memberType === 'MASTER' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700'} text-white shadow-lg px-8`}
              disabled={isSaving}
              onClick={handleAddMember}
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18}/> : null}
              {editingMemberId ? 'Guardar Cambios' : (
                memberType === 'SUPERVISOR' ? 'Añadir' : 
                memberType === 'MASTER' ? 'Asignar Auditor' :
                'Registrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
