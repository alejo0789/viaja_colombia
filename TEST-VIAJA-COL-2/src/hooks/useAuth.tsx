import {
  useState,
  useEffect,
  useCallback,
  ReactNode,
  createContext,
  useContext,
  FC,
} from 'react';
import {
  apiRequest,
  setTokens,
  clearTokens,
  getAccessToken,
} from '../lib/api';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'CONDUCTOR' | 'AUTORIZADOR';
  empresaClienteId?: string;
  empresaTransportistaId?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAdmin: boolean;
  isConductor: boolean;
  isAutorizador: boolean;
  getDashboardRoute: () => string;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const userData = await apiRequest('/api/auth/me');
          setUser(userData);
        } catch (error) {
          clearTokens();
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        const { accessToken, refreshToken, user: userData } = response;
        setTokens(accessToken, refreshToken);
        setUser(userData);
      } catch (error) {
        clearTokens();
        setUser(null);
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const isAdmin = user?.rol === 'ADMIN';
  const isConductor = user?.rol === 'CONDUCTOR';
  const isAutorizador = user?.rol === 'AUTORIZADOR';
  const isAuthenticated = user !== null;

  const getDashboardRoute = useCallback(() => {
    if (isAdmin) return '/admin/dashboard';
    if (isConductor) return '/conductor/dashboard';
    if (isAutorizador) return '/autorizador/dashboard';
    return '/login';
  }, [isAdmin, isConductor, isAutorizador]);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin,
    isConductor,
    isAutorizador,
    getDashboardRoute,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
