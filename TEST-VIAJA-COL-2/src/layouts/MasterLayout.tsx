import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, LogOut, ShieldCheck, UserCircle, ClipboardList, Users } from 'lucide-react';

export default function MasterLayout() {
  const { signOut, user } = useAuth();

  const menuItems = [
    { label: 'Dashboard Auditoría', href: '/master/dashboard', icon: LayoutDashboard },
    { label: 'Asignaciones', href: '/master/asignaciones', icon: ClipboardList },
    { label: 'Gestión Personal', href: '/master/gestion', icon: Users },
    { label: 'Mi Perfil', href: '/master/perfil', icon: UserCircle },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-[#1B3A5C] to-[#0f2a44] text-white flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
                <ShieldCheck size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-black tracking-tight">AUDITORÍA</h2>
          </div>
          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">{user?.nombre}</p>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              >
                <Icon size={20} className="text-blue-300 group-hover:text-white transition-colors" />
                <span className="font-medium">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-3 rounded-xl transition-all duration-300 font-bold border border-red-500/20"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
