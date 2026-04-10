import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AutorizadorLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-green-900 text-white flex flex-col">
        <div className="p-6 border-b border-green-800">
          <h2 className="text-xl font-bold">VIAJA-COL Autorizador</h2>
          <p className="text-sm text-green-300 mt-1">{user?.nombre}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/autorizador/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            Dashboard
          </a>
          <a
            href="/autorizador/solicitudes"
            className="block px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            Solicitudes por Autorizar
          </a>
          <a
            href="/autorizador/empleados"
            className="block px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            Empleados
          </a>
          <a
            href="/autorizador/perfil"
            className="block px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            Perfil
          </a>
        </nav>

        <div className="p-4 border-t border-green-800">
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
