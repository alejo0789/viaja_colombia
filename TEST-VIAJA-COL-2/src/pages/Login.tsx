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
  CheckCircle2,
  ChevronLeft
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
      const routeMap: Record<string, string> = {
        'ADMIN': '/admin/dashboard',
        'CONDUCTOR': '/conductor/dashboard',
        'AUTORIZADOR': '/autorizador/dashboard',
        'MASTER_SUPERVISOR': '/master/dashboard'
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
        setSuccess('¡Listo! Revisa tu correo para el enlace de recuperación.');
        if (data.debug_token) console.log("DEBUG TOKEN:", data.debug_token);
      } else {
        setError(data.detail || 'No pudimos procesar la recuperación.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[1.25rem] mb-6 shadow-xl shadow-blue-600/30 rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">VIAJA-COL</h1>
            <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Logística Inteligente</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-sm font-bold text-red-800 leading-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="text-green-500 shrink-0" size={18} />
              <p className="text-sm font-bold text-green-800 leading-tight">{success}</p>
            </div>
          )}

          <form onSubmit={isRecoveryMode ? handleRecovery : handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Correo Electrónico</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-base font-medium"
                  placeholder="admin@viajacol.com"
                  required
                />
              </div>
            </div>

            {!isRecoveryMode && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="pass" className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Contraseña</Label>
                  <button 
                    type="button"
                    onClick={() => { setIsRecoveryMode(true); setError(null); setSuccess(null); }}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-base font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                  className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="remember" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Recordar mi cuenta</Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isRecoveryMode ? 'Recuperar Acceso' : 'Entrar al Panel'}</span>
                  {!isRecoveryMode && <ArrowRight size={20} />}
                </div>
              )}
            </Button>

            {isRecoveryMode && (
              <button
                type="button"
                onClick={() => { setIsRecoveryMode(false); setError(null); setSuccess(null); }}
                className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors py-2 uppercase tracking-widest"
              >
                <ChevronLeft size={14} />
                Volver al inicio
              </button>
            )}
          </form>
        </div>

        <div className="text-center mt-10">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Viaja Colombia &copy; 2024
          </p>
        </div>
      </div>
    </div>
  );
}
