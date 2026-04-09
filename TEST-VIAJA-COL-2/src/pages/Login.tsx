import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('viaja_col_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userData = await signIn(email, password);
      
      if (rememberMe) {
        localStorage.setItem('viaja_col_remembered_email', email);
      } else {
        localStorage.removeItem('viaja_col_remembered_email');
      }

      // Professional redirection based on direct userData
      const routeMap = {
        'ADMIN': '/admin/dashboard',
        'CONDUCTOR': '/conductor/dashboard',
        'AUTORIZADOR': '/autorizador/dashboard'
      };
      
      const targetRoute = routeMap[userData.rol] || '/login';
      navigate(targetRoute);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Por favor intenta de nuevo.');
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
        setSuccess('¡Listo! Revisa tu correo (o el log) para el enlace de recuperación.');
        if (data.debug_token) console.log("DEBUG TOKEN:", data.debug_token);
      } else {
        setError(data.detail || 'No pudimos procesar la recuperación para este correo.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-[450px] z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
              <ShieldCheck className="text-blue-600" size={32} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">VIAJA-COL</h1>
            <p className="text-gray-500 mt-2 font-medium">Panel de Gestión Inteligente</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-sm font-medium text-red-800 leading-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="text-green-500 shrink-0" size={18} />
              <p className="text-sm font-medium text-green-800 leading-tight">{success}</p>
            </div>
          )}

          <form onSubmit={isRecoveryMode ? handleRecovery : handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold ml-1">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-13 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-gray-50/50"
                  placeholder="nombre@empresa.com"
                  required
                />
              </div>
            </div>

            {!isRecoveryMode && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="pass" className="text-gray-700 font-semibold">Contraseña</Label>
                  <button 
                    type="button"
                    onClick={() => { setIsRecoveryMode(true); setError(null); setSuccess(null); }}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-13 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-gray-50/50"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {!isRecoveryMode && (
              <div className="flex items-center space-x-2 ml-1">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer">Mantener sesión iniciada</Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isRecoveryMode ? 'Recuperar Cuenta' : 'Acceder al Panel'}</span>
                  {!isRecoveryMode && <ArrowRight size={20} />}
                </div>
              )}
            </Button>

            {isRecoveryMode && (
              <button
                type="button"
                onClick={() => { setIsRecoveryMode(false); setError(null); setSuccess(null); }}
                className="w-full text-sm font-bold text-gray-500 hover:text-gray-700 transition py-2"
              >
                Volver al inicio de sesión
              </button>
            )}
          </form>
        </div>

        <p className="text-center mt-8 text-gray-400 text-sm font-medium">
          Viaja Colombia &copy; 2024 - Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
