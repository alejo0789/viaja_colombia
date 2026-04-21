import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Shield, Building2, MapPin, Key, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { perfilAPI } from '@/services/api';
import { toast } from 'sonner';

const AutorizadorPerfil = () => {
    const { user, signOut: logout } = useAuth();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setIsChanging(true);
        try {
            await perfilAPI.cambiarPassword(newPassword);
            toast.success("Contraseña actualizada correctamente");
            setIsPasswordModalOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || "Error al cambiar la contraseña");
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header / Banner Centered */}
            <div className="relative h-64 rounded-[3rem] bg-gradient-to-br from-[#1B3A5C] via-[#2a5298] to-indigo-900 shadow-2xl flex flex-col items-center justify-center pt-8">
                <div className="absolute inset-0 opacity-20 rounded-[3rem] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                
                {/* Avatar Centered and Popping Out */}
                <div className="relative z-10 flex flex-col items-center group">
                    <div className="h-40 w-40 rounded-[2.5rem] bg-white p-2 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
                        <div className="h-full w-full rounded-[2rem] bg-gradient-to-tr from-indigo-50 to-white flex items-center justify-center text-indigo-600">
                            <User size={84} strokeWidth={1.2} />
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-2xl">
                            {user?.nombre || 'Usuario Autorizador'}
                        </h1>
                        <div className="mt-3 flex justify-center">
                            <p className="text-white/90 font-bold bg-white/10 backdrop-blur-xl px-5 py-2 rounded-2xl text-xs border border-white/20 shadow-xl flex items-center gap-2">
                                <Shield size={14} className="text-indigo-300" />
                                {user?.cargo || 'Supervisor de Transporte'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Information Card */}
                <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white/80 backdrop-blur-md overflow-hidden border border-white/50">
                    <CardHeader className="pb-2 pt-12 px-12">
                        <CardTitle className="text-3xl font-black text-[#1B3A5C] flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                <User size={24} />
                            </div>
                            Perfil Corporativo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-12 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {[
                                { label: 'Nombre Completo', value: user?.nombre, icon: User },
                                { label: 'Correo de Acceso', value: user?.email, icon: Mail, break: true },
                                { label: 'Empresa', value: user?.empresa_nombre || 'Viaja Colombia', icon: Building2 },
                                { label: 'Sede / Área', value: user?.area || 'Centro Operativo', icon: MapPin },
                            ].map((item, i) => (
                                <div key={i} className="space-y-3 group">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                                        <item.icon size={12} className="text-indigo-400 group-hover:scale-110 transition-transform" /> {item.label}
                                    </label>
                                    <div className={`p-6 bg-slate-50/50 hover:bg-white transition-all rounded-2xl border border-slate-100 font-bold text-gray-800 shadow-sm ${item.break ? 'break-all' : ''}`}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-1 text-center sm:text-left">
                                <h4 className="text-sm font-black text-gray-800">Seguridad de la Cuenta</h4>
                                <p className="text-xs text-gray-500 font-medium italic">Actualiza tu contraseña regularmente para mayor seguridad.</p>
                            </div>
                            <Button 
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="rounded-[1.5rem] bg-[#1B3A5C] text-white px-10 h-14 font-black hover:scale-105 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
                            >
                                <Key size={20} />
                                Cambiar Contraseña
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Info Card */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl rounded-[3rem] bg-indigo-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
                            <Shield size={120} />
                        </div>
                        <CardContent className="p-10 space-y-6 relative z-10">
                            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black">Tu Privacidad</h3>
                                <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
                                    Como autorizador, tienes privilegios elevados para gestionar servicios y costos. Asegúrate de mantener tus credenciales protegidas.
                                </p>
                            </div>
                            <div className="pt-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-tighter">
                                    <CheckCircle2 size={14} /> Acceso Verificado
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button 
                        onClick={logout}
                        className="w-full h-16 rounded-[2rem] bg-rose-50 text-rose-600 font-black border border-rose-100 hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center justify-center gap-3 shadow-lg group"
                    >
                        <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                        Cerrar Sesión Activa
                    </Button>
                </div>
            </div>

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <Card className="w-full max-w-md border-none shadow-3xl rounded-[3rem] bg-white overflow-hidden animate-in zoom-in-95 duration-300">
                        <CardHeader className="pt-12 px-12 pb-6 text-center">
                            <div className="mx-auto h-16 w-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                                <Key size={32} />
                            </div>
                            <CardTitle className="text-3xl font-black text-[#1B3A5C]">
                                Nueva Contraseña
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-12 pb-12 pt-4 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                <Input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••" 
                                    className="rounded-2xl border-slate-100 bg-slate-50 h-14 px-6 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-none font-bold" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                                <Input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••" 
                                    className="rounded-2xl border-slate-100 bg-slate-50 h-14 px-6 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-none font-bold" 
                                />
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <Button 
                                    variant="ghost" 
                                    disabled={isChanging}
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 rounded-2xl h-14 font-bold text-gray-400 hover:bg-gray-50"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleChangePassword}
                                    disabled={isChanging}
                                    className="flex-1 rounded-2xl h-14 font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all"
                                >
                                    {isChanging ? <Loader2 className="animate-spin" /> : "Actualizar"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AutorizadorPerfil;
