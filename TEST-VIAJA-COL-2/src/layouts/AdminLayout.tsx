import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">VIAJA-COL Admin</h2>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/admin/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/solicitudes"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Solicitudes
          </Link>
          <Link
            to="/admin/asignaciones"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Asignaciones
          </Link>
          <Link
            to="/admin/conductores"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Conductores
          </Link>
          <Link
            to="/admin/vehiculos"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Vehículos
          </Link>
          <Link
            to="/admin/empresas"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Gestión Empresas
          </Link>
          <Link
            to="/admin/tarifas"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Tarifas
          </Link>
          <Link
            to="/admin/reportes"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Alertas
          </Link>
          <Link
            to="/admin/usuarios"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Usuarios
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
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
