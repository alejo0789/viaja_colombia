import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Real Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminSolicitudes from './pages/admin/Solicitudes';
import AdminConductores from './pages/admin/Conductores';
import AdminVehiculos from './pages/admin/Flota';
import AdminTarifas from './pages/admin/Tarifas';
import AdminAlertas from './pages/admin/Alertas';
import GestionEmpresas from './pages/admin/GestionEmpresas';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ConductorLayout from './layouts/ConductorLayout';
import AutorizadorLayout from './layouts/AutorizadorLayout';

function ConductorDashboard() {
  return <div className="text-2xl font-bold">Dashboard Conductor</div>;
}

function ConductorServicios() {
  return <div className="text-2xl font-bold">Mis Servicios</div>;
}

function ConductorHistorial() {
  return <div className="text-2xl font-bold">Historial de Servicios</div>;
}

function ConductorPerfil() {
  return <div className="text-2xl font-bold">Perfil de Conductor</div>;
}

function AutorizadorDashboard() {
  return <div className="text-2xl font-bold">Dashboard Autorizador</div>;
}

function AutorizadorSolicitudes() {
  return <div className="text-2xl font-bold">Solicitudes por Autorizar</div>;
}

function AutorizadorEstadisticas() {
  return <div className="text-2xl font-bold">Estadísticas</div>;
}

function AutorizadorEmpleados() {
  return <div className="text-2xl font-bold">Gestión de Empleados</div>;
}

function AutorizadorPerfil() {
  return <div className="text-2xl font-bold">Perfil Autorizador</div>;
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="solicitudes" element={<AdminSolicitudes />} />
              <Route path="conductores" element={<AdminConductores />} />
              <Route path="vehiculos" element={<AdminVehiculos />} />
              <Route path="empresas" element={<GestionEmpresas />} />
              <Route path="tarifas" element={<AdminTarifas />} />
              <Route path="reportes" element={<AdminAlertas />} />
            </Route>

            {/* Conductor Routes */}
            <Route
              path="/conductor/*"
              element={
                <ProtectedRoute requiredRole="CONDUCTOR">
                  <ConductorLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<ConductorDashboard />} />
              <Route path="servicios" element={<ConductorServicios />} />
              <Route path="historial" element={<ConductorHistorial />} />
              <Route path="perfil" element={<ConductorPerfil />} />
            </Route>

            {/* Autorizador Routes */}
            <Route
              path="/autorizador/*"
              element={
                <ProtectedRoute requiredRole="AUTORIZADOR">
                  <AutorizadorLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AutorizadorDashboard />} />
              <Route path="solicitudes" element={<AutorizadorSolicitudes />} />
              <Route path="estadisticas" element={<AutorizadorEstadisticas />} />
              <Route path="empleados" element={<AutorizadorEmpleados />} />
              <Route path="perfil" element={<AutorizadorPerfil />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
