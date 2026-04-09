import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { signIn, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Se ha enviado un enlace de recuperación a tu correo');
        // If in debug mode, maybe show the token to facilitate testing
        if (data.debug_token) {
            console.log("DEBUG TOKEN:", data.debug_token);
        }
      } else {
        setError(data.detail || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">VIAJA-COL</h1>
          <p className="text-gray-600 mt-2">Sistema de Transporte Inteligente</p>
        </div>

        <form onSubmit={isRecoveryMode ? handleRecovery : handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="tu@email.com"
              required
            />
          </div>

          {!isRecoveryMode && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <button 
                  type="button"
                  onClick={() => setIsRecoveryMode(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading 
                ? (isRecoveryMode ? 'Enviando...' : 'Iniciando sesión...') 
                : (isRecoveryMode ? 'Recuperar Contraseña' : 'Iniciar Sesión')}
          </button>

          {isRecoveryMode && (
            <button
              type="button"
              onClick={() => setIsRecoveryMode(false)}
              className="w-full text-sm text-gray-600 hover:text-blue-600 transition"
            >
              Volver al inicio de sesión
            </button>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Contacta al administrador si tienes problemas para acceder</p>
        </div>
      </div>
    </div>
  );
}
