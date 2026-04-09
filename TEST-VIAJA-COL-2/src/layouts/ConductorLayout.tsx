import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ConductorLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-xl font-bold">VIAJA-COL Conductor</h2>
          <p className="text-sm text-blue-300 mt-1">{user?.nombre}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/conductor/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Dashboard
          </a>
          <a
            href="/conductor/servicios"
            className="block px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Mis Servicios
          </a>
          <a
            href="/conductor/historial"
            className="block px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Historial
          </a>
          <a
            href="/conductor/perfil"
            className="block px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Perfil
          </a>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button
            onClick={signOut}
            className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
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
