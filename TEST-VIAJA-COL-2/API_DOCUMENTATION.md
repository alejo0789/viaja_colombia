# VIAJA-COL Transportation System API v2

Complete rewrite of the VIAJA-COL backend using raw PostgreSQL queries instead of Supabase.

## Architecture

- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with connection pooling
- **Query Style**: Parameterized SQL with `pg` library
- **Authentication**: Token-based via `Authorization: Bearer <token>` header
- **Response Format**: JSON with consistent structure

## Database Connection

Located in `src/db/pool.ts`:

```typescript
import { query } from './db/pool';

// Basic query
const result = await query('SELECT * FROM usuarios WHERE id = $1', [userId]);

// Access rows
const user = result.rows[0];
```

## API Routes

### 1. Admin Routes (`/api/admin`)
**Role**: 1 (Admin Transportista)

#### GET /dashboard
Returns dashboard statistics:
- Solicitudes by estado (counts)
- Active conductores and vehicles
- Open alerts count

#### GET /solicitudes
List solicitudes with filters:
- Query params: `estado`, `page`, `limit`
- Returns: Solicitudes with empleado, tipo_servicio, empresa_cliente, and asignacion info

#### GET /solicitudes/:id
Get single solicitud with all details and asignacion information

#### POST /asignar-servicio
Assign service to conductor:
- Body: `{ solicitud_id, conductor_id }`
- Updates solicitud estado to 'asignada'
- Creates asignacion record
- Sends WhatsApp notification to conductor

#### GET /conductores
List all conductores with their assigned vehicle (if active)

#### POST /conductores
Create new conductor:
- Body: `{ nombre, cedula, telefono, email }`

#### PUT /conductores/:id
Update conductor info

#### GET /vehiculos
List all vehiculos with conductor info

#### POST /vehiculos
Create new vehicle:
- Body: `{ conductor_id, placa, marca, modelo, anio, capacidad_pasajeros }`

#### PUT /vehiculos/:id
Update vehicle info

#### GET /tipos-servicio
List service types with tariff info

#### PUT /tipos-servicio/:id
Update service type tariffs:
- Fields: `tarifa_base`, `tiempo_maximo_min`, `costo_extra`, `bloque_min`, `recargo_nocturnidad_pct`, `recargo_festivo_pct`

#### GET /empresas
List client companies

#### POST /empresas
Create new client company:
- Body: `{ nombre, email, telefono, nit, direccion, ciudad, contacto_nombre, contacto_email, contacto_telefono }`

#### GET /alertas
List unresolved alerts (resuelta=false), sorted by date DESC

#### PUT /alertas/:id/leer
Mark alert as read (leida=true)

#### PUT /alertas/:id/resolver
Resolve alert:
- Body: `{ notas_resolucion? }`
- Sets: resuelta=true, resuelta_por, fecha_resolucion, notas_resolucion

#### GET /ranking-conductores
Conductor ranking (last 30 days):
- Metrics: servicios_finalizados, duracion_promedio_min, tarifa_total, servicios_con_excedente
- Ordered by servicios_finalizados DESC

### 2. Conductor Routes (`/api/conductor`)
**Role**: 2 (Conductor)

#### GET /servicios-hoy
Today's assigned services:
- Filtered by conductor_id and DATE(fecha) = CURRENT_DATE
- Ordered by hora_programada ASC

#### GET /servicios
All assigned services with pagination:
- Query params: `page`, `limit`, `estado` (optional)
- Includes asignacion and solicitud details

#### GET /servicio/:id
Single service detail:
- Requires authorization (conductor_id match)
- Includes tariff info and all related data

#### POST /iniciar-servicio
Start a service:
- Body: `{ asignacion_id, cedula_pasajero }`
- Validates cedula against empleados_autorizados
- Checks service limit not exceeded
- Updates: asignacion (hora_inicio_real, cedula_confirmada, cedula_valida)
- Updates: solicitud estado to 'en_curso'

#### POST /finalizar-servicio
End a service:
- Body: `{ asignacion_id, notas? }`
- Calculates duration in minutes
- Determines if nocturno (22-5) and festivo
- Calls TarifaService.calcular() for tariff
- Updates: asignacion (hora_fin_real, duracion_min, tiempo_excedido_min, bloques_extra, costo_extra, tarifa_total)
- Updates: solicitud estado to 'finalizada'
- Increments: empleado_autorizado.servicios_usados_mes
- Transaction safe

#### GET /historial
Service history with pagination and filters:
- Query params: `page`, `limit`, `desde`, `hasta` (dates)
- Only returns finalizadas services
- Ordered by fecha DESC, hora_programada DESC

### 3. Autorizador Routes (`/api/autorizador`)
**Role**: 4 (Autorizador Empresa Cliente)

Requires `empresaClienteId` in request context.

#### GET /solicitudes
List solicitudes for this empresa_cliente:
- Query params: `page`, `limit`, `estado` (optional)
- Ordered by created_at DESC

#### POST /autorizar
Authorize or reject a solicitud:
- Body: `{ solicitud_id, autorizado: boolean, observaciones? }`
- Updates: solicitud (estado, autorizado_por, fecha_autorizacion, motivo_rechazo)
- Sends WhatsApp to passenger with authorization result

#### GET /estadisticas
Statistics for this empresa_cliente:
- total_solicitudes, servicios_finalizados, servicios_cancelados
- costo_total, costo_promedio, duracion_promedio_min
- servicios_con_excedente, costo_excedentes

#### GET /empleados
List empleados_autorizados for this empresa:
- Query params: `page`, `limit`

#### POST /empleados
Create new authorized employee:
- Body: `{ cedula, nombre, email, telefono, cargo, departamento, limite_mensual? }`

#### PUT /empleados/:id
Update employee:
- Fields: `nombre`, `email`, `telefono`, `cargo`, `departamento`, `limite_mensual`, `estado`

#### DELETE /empleados/:id
Soft delete (set estado='inactivo')

### 4. Reportes Routes (`/api/reportes`)
**Role**: 1 (Admin)

#### GET /servicios-por-dia
Services grouped by date:
- Query params: `desde`, `hasta` (dates)
- Returns: fecha, cantidad_servicios, servicios_finalizados, tarifa_total, duracion_promedio_min

#### GET /por-tipo-servicio
Services grouped by service type:
- Query params: `desde`, `hasta`
- Returns: tipo_servicio, cantidad_servicios, servicios_finalizados, duracion_promedio_min, tarifa_total, tarifa_promedio

#### GET /excedentes
Services with overtime charges:
- Query params: `desde`, `hasta`, `page`, `limit`
- Filters: tiempo_excedido_min > 0
- Includes: conductor, costo_extra details

#### GET /simular-tarifa
Simulate tariff calculation:
- Query params: `tipo_servicio_id`, `duracion_min`, `es_nocturno?`, `es_festivo?`
- Returns: tarifaBase, tiempoExcedidoMin, bloquesExtra, costoExtra, recargo, total
- Does NOT save to database

#### GET /exportar
Export services as JSON for CSV conversion:
- Query params: `desde`, `hasta`
- Returns: Array of service records with all relevant data
- For frontend CSV export

## Services

### TarifaService
Located in `src/services/tarifa.service.ts`

```typescript
// Main calculation
const result = await tarifaService.calcular({
  tarifaBase: 50000,
  tiempoMaxMin: 30,
  costoExtra: 5000,
  bloqueMin: 15,
  duracionMin: 45,
  esNocturno: true,
  esFestivo: false,
  recargNoctPct: 20,
  recargFestPct: 15
});
// Returns: { tarifaBase, tiempoExcedidoMin, bloquesExtra, costoExtra, recargo, total }

// Calculate for existing asignacion
const result = await tarifaService.calcularParaAsignacion(asignacionId);

// Simulate without saving
const result = await tarifaService.simular(tipoServicioId, duracionMin, esNocturno, esFestivo);
```

### AlertaService
Located in `src/services/alerta.service.ts`

```typescript
// Create alert
await alertaService.crear('SOLICITUD_SIN_ASIGNAR', 'Message', { data: 'value' }, solicitud_id);

// Verify unassigned solicitudes
await alertaService.verificarSolicitudesSinAsignar(30); // 30 minutes threshold

// Verify services not started
await alertaService.verificarServiciosSinIniciar(15); // 15 minutes threshold

// Check data inconsistencies
await alertaService.verificarInconsistencias();

// Mark as read
await alertaService.marcarLeida(alerta_id);

// Resolve
await alertaService.resolver(alerta_id, userId, 'Resolution notes');
```

### CronService
Located in `src/services/cron.service.ts`

Automatic tasks:
- Check unassigned solicitudes every 5 minutes (30-min threshold)
- Check unstarted services every 10 minutes (15-min threshold)
- Verify data inconsistencies daily at 2 AM
- Clean up resolved alerts older than 30 days (Sunday 3 AM)
- Reset monthly service limits (1st of month at 00:00)

```typescript
cronService.initializeJobs(); // Start all jobs
cronService.stopAllJobs();    // Stop all jobs
cronService.getJobStatus('alertaSolicitudesSinAsignar'); // Check specific job
```

## Request/Response Format

### Successful Response (2xx)
```json
{
  "data": {
    "id": "...",
    "field": "value"
  }
}
```

Or for lists:
```json
{
  "data": [
    { "id": "...", "field": "value" },
    { "id": "...", "field": "value" }
  ]
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": "Error message describing what went wrong"
}
```

## Authentication

All routes under `/api/` require an `Authorization` header:

```
Authorization: Bearer <token>
```

Token format: `userId:rol:empresaClienteId:empresaTransportistaId`

Example:
```
Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000:1:ec-123:et-456
```

The token is validated in `src/middleware/auth.middleware.ts`.

## Environment Variables

```
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=viaja_col
PORT=3000
JWT_SECRET=your-secret-key
```

## Transaction Examples

### Assign Service (Transaction)
```sql
BEGIN;
INSERT INTO asignaciones (...) RETURNING *;
UPDATE solicitudes SET estado = 'asignada' WHERE id = $1;
COMMIT;
```

### Finalize Service (Transaction)
```sql
BEGIN;
UPDATE asignaciones SET ... WHERE id = $1;
UPDATE solicitudes SET estado = 'finalizada' WHERE id = $2;
UPDATE empleados_autorizados SET servicios_usados_mes = servicios_usados_mes + 1 WHERE id = $3;
COMMIT;
```

## Pagination

Query params: `page` (default 1), `limit` (default 20)

Offset calculation:
```
offset = (page - 1) * limit
```

SQL:
```sql
LIMIT $n OFFSET $m
```

## Date/Time Handling

- All timestamps stored as `timestamp with time zone` in PostgreSQL
- Query results include ISO 8601 formatted strings
- Use `DATE(column)` for date-only comparisons
- Nighttime check: `hour >= 22 || hour < 5`

## Error Handling

All routes use try-catch blocks with consistent error responses:

```typescript
catch (error) {
  res.status(500).json({ error: String(error) });
}
```

For validation errors, use 400 status:
```typescript
if (condition) {
  return res.status(400).json({ error: 'Validation message' });
}
```

For not found, use 404:
```typescript
if (result.rows.length === 0) {
  return res.status(404).json({ error: 'Resource not found' });
}
```

For authorization, use 403:
```typescript
return res.status(403).json({ error: 'Insufficient permissions' });
```

## Performance Considerations

1. **Connection Pooling**: Pool managed by `pg` library (default 10 connections)
2. **Parameterized Queries**: All queries use `$1, $2...` to prevent SQL injection
3. **Indexing**: Recommend indexes on:
   - `solicitudes.estado`, `solicitudes.created_at`, `solicitudes.empresa_cliente_id`
   - `asignaciones.conductor_id`, `asignaciones.estado`
   - `alertas.resuelta`, `alertas.created_at`
   - `empleados_autorizados.empresa_cliente_id`

4. **Query Optimization**:
   - Use JOINs for related data instead of multiple queries
   - Filter early in WHERE clause
   - ORDER BY indexed columns
   - Limit result sets with pagination

## Migration from Supabase

Key differences from Supabase implementation:

1. **No RLS**: Row-level security now handled in application code
2. **Manual Transactions**: Use `BEGIN`/`COMMIT` instead of Supabase's built-in transaction support
3. **Direct SQL**: No ORM layer (like Supabase SDK), all direct `pg` queries
4. **Connection Management**: Must manage pool lifecycle (closePool on shutdown)
5. **Error Messages**: Less abstraction, raw PostgreSQL errors

## Development Setup

```bash
# Install dependencies
npm install

# Copy .env
cp .env.example .env

# Run migrations (create schema)
npm run migrate

# Start development server
npm run dev

# Run tests
npm test
```

## Production Deployment

1. Set environment variables in production environment
2. Run database migrations
3. Start with `npm start`
4. Use process manager (PM2, systemd, etc.)
5. Configure reverse proxy (nginx, etc.)
6. Enable HTTPS
7. Monitor pool statistics and cron job health

