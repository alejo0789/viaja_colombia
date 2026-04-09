# VIAJA-COL V2 Backend - File Structure

## Complete Directory Structure

```
VIAJA-COL-V2/
├── server/
│   └── src/
│       ├── api/
│       │   ├── admin.routes.ts          (Admin Transportista routes)
│       │   ├── conductor.routes.ts      (Conductor routes)
│       │   ├── autorizador.routes.ts    (Autorizador Empresa Cliente routes)
│       │   └── reportes.routes.ts       (Reporting routes)
│       ├── services/
│       │   ├── tarifa.service.ts        (Tariff calculation service)
│       │   ├── alerta.service.ts        (Alert management service)
│       │   ├── cron.service.ts          (Scheduled tasks service)
│       │   └── whatsapp.service.ts      (WhatsApp notification service)
│       ├── middleware/
│       │   └── auth.middleware.ts       (Authentication & authorization)
│       ├── db/
│       │   └── pool.ts                  (PostgreSQL connection pool)
│       └── server.ts                    (Main application entry point)
├── API_DOCUMENTATION.md                 (Complete API reference)
└── FILE_STRUCTURE.md                    (This file)
```

## File Descriptions

### API Routes

#### `api/admin.routes.ts` (470 lines)
Admin Transportista (Rol 1) endpoints:
- Dashboard statistics
- Solicitudes CRUD with JOINs
- Conductor and vehicle management
- Service type tariff configuration
- Client company management
- Alert management (read, resolve)
- Conductor ranking report

#### `api/conductor.routes.ts` (280 lines)
Conductor (Rol 2) endpoints:
- Today's services list
- All services with pagination
- Service detail view
- Start service (with cedula validation)
- Finalize service (with tariff calculation & transaction)
- Service history with date filters

#### `api/autorizador.routes.ts` (280 lines)
Autorizador Empresa Cliente (Rol 4) endpoints:
- List solicitudes by empresa_cliente_id
- Authorize/reject solicitude with WhatsApp notification
- Statistics dashboard (costs, duration, etc.)
- Authorized employees CRUD

#### `api/reportes.routes.ts` (240 lines)
Admin reporting endpoints:
- Services grouped by date
- Services grouped by type
- Overtime charges report
- Tariff simulation (without saving)
- Export services as JSON

### Services

#### `services/tarifa.service.ts` (180 lines)
Tariff calculation engine:
- `calcular()`: Main calculation with surcharges
- `calcularParaAsignacion()`: Fetch and calculate for existing record
- `simular()`: Simulation without database writes
- Helper methods for history and statistics

#### `services/alerta.service.ts` (130 lines)
Alert management with raw SQL:
- `crear()`: Create new alert
- `verificarSolicitudesSinAsignar()`: Find unassigned solicitudes
- `verificarServiciosSinIniciar()`: Find unstarted services
- `verificarInconsistencias()`: Data integrity checks
- `marcarLeida()`, `resolver()`: Alert state updates

#### `services/cron.service.ts` (160 lines)
Automated scheduled tasks using cron expressions:
- Check unassigned solicitudes (5-min interval, 30-min threshold)
- Check unstarted services (10-min interval, 15-min threshold)
- Verify data inconsistencies (daily at 2 AM)
- Clean up old alerts (weekly Sunday 3 AM)
- Reset monthly service limits (1st of month)

#### `services/whatsapp.service.ts` (50 lines)
WhatsApp notification service:
- `enviarNotificacion()`: Send text notifications
- `enviarPlantilla()`: Send template-based messages
- Placeholder for Twilio/WhatsApp Business API integration

### Middleware & Database

#### `middleware/auth.middleware.ts` (90 lines)
Authentication and authorization:
- `authMiddleware`: Validates Bearer token, attaches user context
- `requireRole()`: Role-based access control
- `requireEmpresaCliente()`: Enterprise validation
- `requireEmpresaTransportista()`: Transporter validation

#### `db/pool.ts` (50 lines)
PostgreSQL connection pooling:
- `query()`: Execute parameterized SQL
- `getClient()`: Manual transaction management
- `closePool()`: Graceful shutdown
- `getPoolStats()`: Connection pool metrics

### Main Server

#### `server.ts` (100 lines)
Application entry point:
- Express app setup with CORS & middleware
- Route registration by role
- Error handling
- Graceful shutdown (signals, pool cleanup, cron stop)

## Key Statistics

| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| API Routes | 4 | 1270 | Request handlers for 4 roles |
| Services | 4 | 520 | Business logic layer |
| Middleware | 1 | 90 | Auth & authorization |
| Database | 1 | 50 | Connection pooling |
| Server | 1 | 100 | App initialization |
| **Total** | **11** | **~2030** | Complete backend |

## Code Patterns Used

### SQL Queries
- All parameterized with `$1, $2, $3...` notation
- Result accessed via `result.rows[0]` or `.rows`
- Explicit transactions with `BEGIN`/`COMMIT`/`ROLLBACK`

### Response Format
```typescript
// Success
res.json({ data: result.rows[0] })

// Error
res.status(400).json({ error: 'message' })
```

### Service Methods
- Always async/await
- Return raw query results or calculated objects
- No database transaction handling (left to routes)

### Middleware Chains
```typescript
app.use('/api/admin', 
  authMiddleware,
  requireRole(1),
  adminRoutes
)
```

## Database Assumptions

The code expects these tables:
- `usuarios` (id, rol, estado)
- `solicitudes` (id, empresa_cliente_id, conductor_id, estado, etc.)
- `asignaciones` (id, solicitud_id, conductor_id, estado, etc.)
- `empleados_autorizados` (id, empresa_cliente_id, cedula, limite_mensual, etc.)
- `conductores` (id, nombre, cedula, estado, etc.)
- `vehiculos` (id, conductor_id, estado, etc.)
- `tipos_servicio` (id, nombre, tarifa_base, tiempo_maximo_min, etc.)
- `empresas_clientes` (id, nombre, estado, etc.)
- `alertas` (id, tipo, estado, resuelta, etc.)

## Integration Points

### WhatsApp Integration
- Called in: `admin.routes.ts` (conductor assignment), `autorizador.routes.ts` (authorization)
- Method: `WhatsAppService.enviarNotificacion(phone, message)`
- Status: Placeholder, requires Twilio or WhatsApp Business API

### Authentication
- Expected: Bearer token with format `userId:rol:empresaClienteId:empresaTransportistaId`
- Validated in: `auth.middleware.ts`
- Attached to: `req.userId`, `req.userRol`, `req.empresaClienteId`, `req.empresaTransportistaId`

### Cron Jobs
- Started in: `server.ts` at app initialization
- Stopped on: Process signals (SIGTERM, SIGINT)
- Dependencies: `AlertaService`, raw `query()` calls

## Deployment Considerations

1. **Environment Variables Required**:
   - DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
   - PORT, JWT_SECRET

2. **Database Migrations**:
   - Not included in this codebase
   - Required before first run

3. **Dependencies**:
   - `express`, `cors`, `pg` (PostgreSQL)
   - `cron` (scheduled tasks)
   - `dotenv` (environment loading)

4. **Node.js Version**:
   - Minimum: 14.0.0 (async/await)
   - Recommended: 18.0.0+

