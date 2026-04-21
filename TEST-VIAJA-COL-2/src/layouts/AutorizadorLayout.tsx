import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AutorizadorLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#1B3A5C] text-white flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-2xl font-black tracking-tighter">VIAJA-COL</h2>
          <div className="flex flex-col mt-2">
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Autorizador</span>
            <span className="text-sm font-bold text-gray-200 mt-1">{user?.nombre}</span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {[
            { href: '/autorizador/dashboard', label: 'Dashboard' },
            { href: '/autorizador/solicitudes', label: 'Solicitudes' },
            { href: '/autorizador/asignaciones', label: 'Asignaciones' },
            { href: '/autorizador/perfil', label: 'Mi Perfil' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-2xl hover:bg-white/10 hover:translate-x-1 transition-all duration-300 font-bold text-sm text-blue-50/80 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={signOut}
            className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-4 py-3 rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-widest border border-rose-600/20"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
