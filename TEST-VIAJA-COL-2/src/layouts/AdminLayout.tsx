import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Users, 
  Car, 
  Building2, 
  BadgeDollarSign, 
  Bell, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Solicitudes', href: '/admin/solicitudes', icon: FileText },
  { name: 'Asignaciones', href: '/admin/asignaciones', icon: CheckSquare },
  { name: 'Conductores', href: '/admin/conductores', icon: Users },
  { name: 'Vehículos', href: '/admin/vehiculos', icon: Car },
  { name: 'Gestión Empresas', href: '/admin/empresas', icon: Building2 },
  { name: 'Tarifas', href: '/admin/tarifas', icon: BadgeDollarSign },
  { name: 'Alertas', href: '/admin/reportes', icon: Bell },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
];

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">VC</span>
          </div>
          <div>
            <h2 className="text-white font-bold tracking-tight">VIAJA-COL</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-white/50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="mb-4 px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Usuario</p>
          <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
        </div>
        <Button
          onClick={signOut}
          variant="destructive"
          className="w-full justify-start gap-3 h-12 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
        >
          <LogOut size={20} />
          <span className="font-bold">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-600">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-none">
                <NavContent />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-slate-900 tracking-tight">VIAJA-COL</span>
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users size={16} className="text-blue-600" />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-4 md:p-6 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
