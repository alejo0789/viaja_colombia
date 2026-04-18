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
  Ban
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    password: ''
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

  const openAddMember = (type: 'SUPERVISOR' | 'USUARIO', empresaId: number) => {
    setMemberType(type);
    setTargetEmpresaId(empresaId);
    setEditingMemberId(null);
    setNewMember({ nombre: '', area: '', whatsapp: '', cargo: '', email: '', password: '' });
    setIsAddMemberModalOpen(true);
  };

  const openEditMember = (type: 'SUPERVISOR' | 'USUARIO', empresaId: number, member: any) => {
    setMemberType(type);
    setTargetEmpresaId(empresaId);
    setEditingMemberId(member.id);
    setNewMember({ 
      nombre: member.nombre || '',
      area: member.area || '',
      whatsapp: member.whatsapp || '', 
      cargo: member.cargo || '',
      email: member.email || '',
      password: ''
    });
    setIsAddMemberModalOpen(true);
  };

  const handleAddMember = async () => {
    if (!newMember.nombre || !newMember.whatsapp || !targetEmpresaId) return;
    setIsSaving(true);
    try {
      if (editingMemberId) {
        if (memberType === 'SUPERVISOR') {
          await adminAPI.updateSupervisor(editingMemberId, newMember);
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

  const handleDeleteMember = async (type: 'SUPERVISOR' | 'USUARIO', id: number) => {
    if (!confirm('¿Estás seguro de eliminar este miembro?')) return;
    try {
      if (type === 'SUPERVISOR') {
        await adminAPI.deleteSupervisor(id);
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
                className="p-6 cursor-pointer flex items-center justify-between bg-white"
                onClick={() => toggleExpand(empresa.id)}
              >
                <div className="flex items-center gap-6">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <Building2 className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{empresa.nombre}</h2>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><ShieldCheck size={14}/> NIT: {empresa.nit}</span>
                      <span className="flex items-center gap-1"><Mail size={14}/> {empresa.email}</span>
                      <span className="flex items-center gap-1"><Phone size={14}/> {empresa.telefono}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4 hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{empresa.supervisores.length} Supervisores</p>
                    <p className="text-xs text-gray-500">{empresa.usuarios_count} Empleados</p>
                  </div>
                  {expandedId === empresa.id ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                </div>
              </div>

              {expandedId === empresa.id && (
                <CardContent className="bg-gray-50 border-t p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300">
                  {/* Supervisores */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Users className="text-orange-500" size={20} />
                        Supervisores (Autorizadores)
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddMember('SUPERVISOR', empresa.id);
                        }}
                      >
                        <Plus size={16} className="mr-1" /> Añadir
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {empresa.supervisores.map((s) => (
                        <div key={s.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center group">
                          <div>
                            <p className="font-semibold text-gray-900">{s.nombre}</p>
                            <div className="flex gap-2 text-sm text-gray-500">
                              <span>WhatsApp: {s.whatsapp}</span>
                              {s.area && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">{s.area}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.activo ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">Activo</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-200">Inactivo</Badge>
                            )}
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Supervisor</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-8 w-8 transition-opacity ${s.activo ? 'text-green-600' : 'text-gray-400'}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus('SUPERVISOR', s); }}
                              title={s.activo ? "Desactivar" : "Activar"}
                            >
                              <Power size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600 opacity-0 group-hover:opacity-100 transition"
                              onClick={(e) => { e.stopPropagation(); openEditMember('SUPERVISOR', empresa.id, s); }}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 opacity-0 group-hover:opacity-100 transition"
                              onClick={(e) => { e.stopPropagation(); handleDeleteMember('SUPERVISOR', s.id); }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usuarios Autorizados y Auditor */}
                  <div className="space-y-6">
                    {/* Auditor General */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center shadow-sm">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Auditor General (Dashboard)</h3>
                          <p className="text-gray-500 text-sm">Acceso a estadísticas de la empresa.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {empresa.master_supervisor ? (
                          <div className="text-right mr-2">
                            <p className="font-bold text-blue-900">{empresa.master_supervisor.nombre}</p>
                            <p className="text-xs text-gray-400">{empresa.master_supervisor.email}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic mr-2">No asignado</span>
                        )}
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (empresa.master_supervisor) {
                              openEditMember('MASTER' as any, empresa.id, {
                                ...empresa.master_supervisor,
                                whatsapp: ''
                              });
                            } else {
                              openAddMember('MASTER' as any, empresa.id);
                            }
                          }}
                        >
                          {empresa.master_supervisor ? <Pencil size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
                          {empresa.master_supervisor ? 'Editar' : 'Asignar'}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center shadow-sm h-full">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                          <Users size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Usuarios (Empleados)</h3>
                          <p className="text-gray-500 text-sm">Personal autorizado para viajar.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="text-center px-4 border-r border-gray-200">
                           <span className="block text-2xl font-black text-[#1B3A5C]">{empresa.usuarios_count}</span>
                           <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</span>
                        </div>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBulkUsers(empresa.id);
                          }}
                        >
                          <ExternalLink size={16} className="mr-2" /> Gestionar
                        </Button>
                      </div>
                    </div>
                  </div>
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
          <DialogHeader className="p-6 border-b bg-white shadow-sm z-10">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingMemberId ? 'Editar' : 'Añadir'} {
                memberType === 'SUPERVISOR' ? 'Supervisor (WhatsApp)' : 
                memberType === 'MASTER' ? 'Auditor General (Dashboard)' :
                'Usuario Autorizado'
              }
            </DialogTitle>
            <DialogDescription>
              {editingMemberId ? 'Actualiza los datos del miembro.' : 'Ingresa los datos de registro para que pueda interactuar con el sistema vía WhatsApp.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="m_nombre" className="text-right">Nombre</Label>
              <Input 
                id="m_nombre" 
                className="col-span-3" 
                value={newMember.nombre}
                onChange={(e) => setNewMember({...newMember, nombre: e.target.value})}
              />
            </div>
            {memberType !== 'MASTER' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="m_whatsapp" className="text-right">WhatsApp</Label>
                <Input 
                  id="m_whatsapp" 
                  placeholder="Ej: 57315..."
                  className="col-span-3" 
                  value={newMember.whatsapp}
                  onChange={(e) => setNewMember({...newMember, whatsapp: e.target.value})}
                />
              </div>
            )}
            {memberType === 'SUPERVISOR' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="m_area" className="text-right">Área</Label>
                <Input 
                  id="m_area" 
                  placeholder="Ej: Financiera, RRHH..."
                  className="col-span-3" 
                  value={newMember.area}
                  onChange={(e) => setNewMember({...newMember, area: e.target.value})}
                />
              </div>
            )}
            {memberType === 'MASTER' && (
              <div className="col-span-4 bg-purple-50 p-3 rounded text-xs text-purple-700 border border-purple-100 flex gap-2">
                <ShieldCheck size={16} className="shrink-0" />
                Esta cuenta tendrá acceso al Dashboard de Auditoría de la empresa para ver estadísticas de supervisores.
              </div>
            )}
            {(memberType === 'SUPERVISOR' || memberType === 'MASTER') && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="m_email" className="text-right">Email</Label>
                  <Input 
                    id="m_email" 
                    type="email"
                    placeholder="Para acceder a la web"
                    className="col-span-3" 
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="m_pass" className="text-right">Contraseña</Label>
                  <Input 
                    id="m_pass" 
                    type="password"
                    placeholder={editingMemberId ? "Déjalo vacío para no cambiar" : "Clave de acceso"}
                    className="col-span-3" 
                    value={newMember.password}
                    onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                  />
                </div>
              </>
            )}

            {memberType === 'USUARIO' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="m_cargo" className="text-right">Cargo</Label>
                <Input 
                  id="m_cargo" 
                  className="col-span-3" 
                  value={newMember.cargo}
                  onChange={(e) => setNewMember({...newMember, cargo: e.target.value})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              className="bg-[#F97316] hover:bg-orange-600"
              disabled={isSaving}
              onClick={handleAddMember}
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18}/> : null}
              {editingMemberId ? 'Guardar Cambios' : (
                memberType === 'SUPERVISOR' ? 'Añadir Supervisor' : 
                memberType === 'MASTER' ? 'Asignar Auditor' :
                'Autorizar Usuario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
