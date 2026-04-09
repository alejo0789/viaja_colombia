# VIAJA-COL Backend v2.0.0

Custom JWT Authentication System (No Clerk)

## Features

- JWT-based authentication with bcrypt password hashing
- Role-based access control (admin_transportista, conductor, autorizador, pasajero)
- PostgreSQL database with complete schema for transportation system
- WhatsApp Business API webhook integration ready
- Audit logging for all user actions
- Graceful shutdown handling

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Key variables to set:
- `DATABASE_URL`: PostgreSQL connection string (Neon, AWS RDS, etc.)
- `JWT_SECRET`: Long random string (minimum 64 characters)
- `WHATSAPP_*`: Meta Business API credentials

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This creates all tables, enums, indexes, and seeds basic service types.

### 4. Start Development Server

```bash
npm run dev
```

Server will start on port 3001 (configurable via `PORT` env var).

## API Endpoints

### Public Routes

```
POST   /api/auth/login          - Login with email/password
POST   /api/auth/refresh        - Refresh access token
GET    /webhook/whatsapp        - WhatsApp webhook verification
POST   /webhook/whatsapp        - WhatsApp message webhook
GET    /health                  - Health check
```

### Protected Routes (Require JWT)

```
GET    /api/auth/me             - Get current user profile
POST   /api/auth/change-password - Change password
POST   /api/auth/register       - Create new user (admin only)
GET    /api/admin/*             - Admin operations
GET    /api/conductor/*         - Conductor operations
GET    /api/autorizador/*       - Autorizador operations
GET    /api/reportes/*          - Reports (all authenticated users)
```

## Authentication Flow

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@viajacol.com",
    "password": "secure_password"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@viajacol.com",
    "nombre": "Admin User",
    "rol": "admin_transportista",
    "empresaClienteId": null,
    "empresaTransportistaId": "uuid"
  }
}
```

### Using Access Token

Include in Authorization header:
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Token Refresh

When access token expires:
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

## User Roles

- **admin_transportista**: System administrator, can create users, manage fleet
- **conductor**: Driver, receives assignments, confirms service completion
- **autorizador**: Authorizes service requests from employees
- **pasajero**: Employee requesting services via WhatsApp

## Database Schema

### Core Tables

- `usuarios` - All system users with password hashes
- `empresas_clientes` - Client companies
- `empresa_transportista` - Transport operator company
- `conductores` - Driver profiles
- `vehiculos` - Fleet vehicles
- `tipos_servicio` - Service types with pricing
- `solicitudes` - Service requests
- `asignaciones` - Driver/vehicle assignments to requests
- `alertas` - System alerts (overdue services, issues)
- `empleados_autorizados` - Employees authorized to request services
- `whatsapp_sessions` - Chatbot conversation state
- `log_auditoria` - Audit trail for all actions

## Development

### Build TypeScript

```bash
npm run build
```

### Production Start

```bash
npm run start
```

## Security Notes

1. **JWT_SECRET**: Must be at least 64 characters, random, and unique per environment
2. **Passwords**: Hashed with bcrypt (cost factor: 12)
3. **Database**: Enable SSL in production
4. **CORS**: Restricted to FRONTEND_URL
5. **Helmet**: Provides HTTP header security

## Environment Checklist

- [ ] Set unique JWT_SECRET (64+ chars)
- [ ] Configure DATABASE_URL to production database
- [ ] Set WhatsApp credentials if using webhook
- [ ] Update FRONTEND_URL for CORS
- [ ] Set NODE_ENV=production
- [ ] Use strong database passwords
- [ ] Enable database SSL
- [ ] Configure PORT appropriately

## Troubleshooting

### Connection Issues
Check DATABASE_URL format and network connectivity.

### JWT Errors
- `Token expirado`: Refresh token needed
- `Token inválido`: Check JWT_SECRET matches issuer
- `Usuario inactivo`: Change user estado to 'activo'

### Password Errors
Minimum 8 characters. Bcrypt comparison is case-sensitive.

## License

Proprietary - VIAJA COL
