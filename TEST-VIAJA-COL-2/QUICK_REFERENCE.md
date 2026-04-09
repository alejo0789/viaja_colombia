# VIAJA-COL V2 Frontend - Quick Reference

## Installation & Setup

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3001

# Run
npm run dev
# Opens http://localhost:3000

# Build
npm run build
```

## Key Files & Their Purpose

### Authentication (`src/lib/api.ts`)
- JWT token management (in memory, not localStorage)
- Automatic 401 refresh using refreshToken
- All requests include Bearer token header

```typescript
import { apiRequest, setTokens, clearTokens } from '@/lib/api';

// Use in components:
const data = await apiRequest('/api/admin/dashboard');
```

### Auth Context (`src/hooks/useAuth.ts`)
- Global authentication state
- Role detection (ADMIN, CONDUCTOR, AUTORIZADOR)
- Auto-routing helper

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, signIn, signOut, isAdmin, getDashboardRoute } = useAuth();
```

### API Services (`src/services/api.ts`)
- Organized by role (adminAPI, conductorAPI, autorizadorAPI)
- Organized by feature (reportesAPI, perfilAPI, notificacionesAPI)
- Uses apiRequest internally

```typescript
import { adminAPI, conductorAPI, reportesAPI } from '@/services/api';

// Admin calls
const dashboard = await adminAPI.getDashboard();
const solicitudes = await adminAPI.getSolicitudes({ estado: 'PENDIENTE' });

// Conductor calls
const servicios = await conductorAPI.getServiciosHoy();
await conductorAPI.iniciarServicio(servicioId);

// Reports
const reporte = await reportesAPI.getServiciosPorDia({ desde, hasta });
```

### Route Protection (`src/components/ProtectedRoute.tsx`)
- Wraps routes requiring authentication
- Validates role permissions
- Redirects to login if not authenticated

```typescript
<Route
  path="/admin/*"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout />
    </ProtectedRoute>
  }
>
```

### Layouts
- `AdminLayout` - Blue sidebar for admins
- `ConductorLayout` - Blue sidebar for drivers
- `AutorizadorLayout` - Green sidebar for authorizers

All include:
- Navigation menu
- User info display
- Logout button
- `<Outlet />` for sub-pages

## Common Patterns

### Using Authentication in Components

```typescript
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, isAdmin, signOut } = useAuth();
  
  return (
    <div>
      <p>Logged in as: {user?.nombre}</p>
      {isAdmin && <AdminPanel />}
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Making API Calls

```typescript
import { adminAPI } from '@/services/api';
import { useState, useEffect } from 'react';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    adminAPI.getDashboard()
      .then(setData)
      .catch(setError);
  }, []);
  
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Loading...</div>;
  return <div>Dashboard data: {JSON.stringify(data)}</div>;
}
```

### Using React Query for Data Fetching

```typescript
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';

export function SolicitudesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => adminAPI.getSolicitudes(),
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{/* Render data */}</div>;
}
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - email, password → accessToken, refreshToken, user
- `POST /api/auth/refresh` - refreshToken → accessToken
- `GET /api/auth/me` - → current user

### Admin Endpoints
```
GET    /api/admin/dashboard
GET    /api/admin/solicitudes?estado=PENDIENTE&desde=2024-01-01
POST   /api/admin/asignar-servicio
GET    /api/admin/conductores
GET    /api/admin/vehiculos
GET    /api/admin/tipos-servicio
GET    /api/admin/alertas
GET    /api/admin/empresas
POST   /api/admin/empresas
PATCH  /api/admin/empresas/:id
DELETE /api/admin/empresas/:id
GET    /api/admin/ranking-conductores
```

### Driver Endpoints
```
GET    /api/conductor/servicios-hoy
GET    /api/conductor/servicios/:id
GET    /api/conductor/historial
POST   /api/conductor/servicios/:id/iniciar
POST   /api/conductor/servicios/:id/finalizar
POST   /api/conductor/servicios/:id/ubicacion
```

### Authorizer Endpoints
```
GET    /api/autorizador/solicitudes
POST   /api/autorizador/solicitudes/:id/autorizar
POST   /api/autorizador/solicitudes/:id/rechazar
GET    /api/autorizador/estadisticas
GET    /api/autorizador/empleados
POST   /api/autorizador/empleados
PATCH  /api/autorizador/empleados/:id
DELETE /api/autorizador/empleados/:id
```

### Report Endpoints
```
GET    /api/reportes/servicios-por-dia
GET    /api/reportes/por-tipo-servicio
GET    /api/reportes/excedentes
POST   /api/reportes/simular-tarifa
GET    /api/reportes/exportar
```

## Routing Structure

```
/                              → Index (auto-redirect)
/login                         → Login page
/admin
  /dashboard                   → Admin dashboard
  /solicitudes                 → View solicitudes
  /conductores                 → Manage drivers
  /vehiculos                   → Manage vehicles
  /empresas                    → Manage companies
  /reportes                    → View reports
/conductor
  /dashboard                   → Driver dashboard
  /servicios                   → Today's services
  /historial                   → Service history
  /perfil                      → Driver profile
/autorizador
  /dashboard                   → Authorizer dashboard
  /solicitudes                 → Requests to authorize
  /estadisticas                → Statistics
  /empleados                   → Manage employees
  /perfil                      → Authorizer profile
```

## Type System

### User Object
```typescript
{
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'CONDUCTOR' | 'AUTORIZADOR';
  empresaClienteId?: string;
  empresaTransportistaId?: string;
}
```

### Auth Context
```typescript
{
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isConductor: boolean;
  isAutorizador: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
  getDashboardRoute(): string;
}
```

## Security Notes

1. Tokens stored in memory (JavaScript variables)
   - Lost on page refresh → user must re-login
   - Cannot be stolen via localStorage XSS attacks
   - Cannot be exposed in DevTools

2. Token refresh automatic on 401
   - apiRequest() handles transparently
   - No manual intervention needed

3. CORS must be configured on backend
   - Allow requests from frontend domain
   - Allow credentials header

4. All requests authenticated
   - Bearer token in Authorization header
   - Sent for every API call automatically

## Troubleshooting

**Stuck on loading spinner**
- Check backend is running on VITE_API_URL
- Check auth/me endpoint returns user data
- Check browser console for errors

**401 Unauthorized errors**
- Tokens may have expired
- Check POST /api/auth/refresh endpoint works
- Verify token format in Authorization header

**CORS errors**
- Backend must allow requests from frontend
- Add Access-Control-Allow-Origin header
- Add Access-Control-Allow-Credentials header

**Route redirect loop**
- Check AuthProvider wraps all routes
- Verify ProtectedRoute has correct requiredRole
- Check user.rol value matches expected enum

## Next Steps

1. Implement placeholder pages with real content
2. Add React Query hooks for data fetching
3. Create reusable UI components
4. Add form validation (React Hook Form + Zod)
5. Add error boundaries
6. Add loading and error states
7. Implement WebSocket for real-time updates
8. Add tests with Vitest + React Testing Library
