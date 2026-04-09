# VIAJA-COL Backend Server v2.0 - Delivery Summary

## Overview
Complete rewrite of the VIAJA-COL transportation management backend with:
- **Database**: Neon (PostgreSQL with `pg` driver)
- **Authentication**: Clerk (@clerk/express)
- **Messaging**: Meta WhatsApp Business Cloud API
- **Framework**: Express.js with TypeScript

## Delivered Files

### Core Configuration
- **package.json** - All dependencies (pg, @clerk/express, express, cors, helmet, morgan, svix)
- **tsconfig.json** - TypeScript config (ES2022, commonjs, strict mode)
- **.env.example** - Environment variable template
- **.gitignore** - Git ignore rules
- **README.md** - Setup and usage documentation

### Database
- **src/db/pool.ts** - PostgreSQL connection pool with Neon SSL support
  - Singleton Pool instance
  - Query function with slow query warnings (>1s)
  - Connection pooling: max 20 connections
  - Error handling for idle clients

- **src/db/migrate.ts** - Migration runner
  - Reads SQL files from src/db/migrations/ in order
  - Tracks executed migrations in database
  - Idempotent execution

- **src/db/migrations/001_init_schema.sql** - Initial database schema
  - empresas_cliente (client companies)
  - empresas_transportista (transportation companies)
  - usuarios (Clerk-integrated users with clerk_user_id)
  - pasajeros (passengers with phone tracking)
  - vehiculos (vehicles)
  - solicitudes_transporte (service requests)
  - estados_chat_pasajero (WhatsApp chatbot state)
  - Indexes for performance

### Authentication & Middleware
- **src/middleware/auth.middleware.ts** - Clerk-based auth
  - loadUser() - Extracts Clerk user ID and loads user from DB
  - requireRole(...roles) - Role-based access control
  - Validates user status (must be 'activo')
  - Extends Express Request with userId, userRol, empresaClienteId, empresaTransportistaId

### Services
- **src/services/whatsapp.service.ts** - Meta WhatsApp Business API client
  - enviarMensaje() - Send plain text messages
  - enviarBotones() - Send interactive button messages
  - notificarAsignacionConductor() - Alert driver of assignment
  - alertaNuevaSolicitud() - Alert admin of authorized request
  - solicitarAutorizacion() - Request authorization with buttons
  - notificarPasajeroEstado() - Notify passenger of status changes
  - alertaTiempoExcedido() - Alert admin of time overages
  - cleanPhone() - Normalize phone numbers (remove +, spaces, 'whatsapp:')
  - Uses fetch API (native Node.js)

### Webhooks
- **src/webhooks/whatsapp.webhook.ts** - Meta WhatsApp webhook handler
  - GET / - Webhook verification (checks hub.verify_token)
  - POST / - Incoming messages with full state machine
  - Full chatbot state machine for passengers:
    - INICIO → MENU → ESPERANDO_DIRECCION_RECOGIDA → ESPERANDO_DIRECCION_DESTINO
    - → ESPERANDO_FECHA → ESPERANDO_HORA → ESPERANDO_TIPO_SERVICIO → ESPERANDO_CONFIRMACION
  - Handles text messages and interactive button replies
  - Creates/updates solicitudes in real-time
  - Integrates WhatsAppService for notifications
  - Uses raw SQL via query() from pool

- **src/webhooks/whatsapp-autorizador.webhook.ts** - Authorization handler
  - Processes AUTH_SI_* and AUTH_NO_* button replies
  - Updates solicitud state (autorizado/rechazado)
  - Notifies passenger and admin
  - Called from main webhook handler

### Main Server (Express Entry Point)
- **src/index.ts** - Complete Express application
  - Middleware setup: helmet, cors, morgan, clerkMiddleware
  - Health check endpoint: GET /health
  - WhatsApp webhook: GET/POST /webhook/whatsapp (no auth)
  - Admin routes (requireRole 'admin_transportista'):
    - GET /api/admin/solicitudes - List all solicitudes
    - POST /api/admin/asignar-conductor - Assign conductor to solicitud
  - Conductor routes (requireRole 'conductor'):
    - GET /api/conductor/asignaciones - Get my assignments
    - POST /api/conductor/iniciar-servicio - Mark service as started
    - POST /api/conductor/finalizar-servicio - Mark service completed
  - Autorizador routes (requireRole 'autorizador'):
    - GET /api/autorizador/solicitudes - List pending authorizations
    - POST /api/autorizador/autorizar - Approve solicitud
    - POST /api/autorizador/rechazar - Reject solicitud
  - Reports route (loadUser):
    - GET /api/reportes/mis-solicitudes - Get my solicitudes
  - Global error handler

## Key Features Implemented

### Authentication Flow
1. User logs in via frontend (Clerk handles authentication)
2. Frontend sends API requests with Clerk session token
3. clerkMiddleware verifies token globally
4. loadUser middleware fetches user from DB using Clerk ID
5. requireRole checks user's role for protected endpoints

### WhatsApp Chatbot
- Stateless design (all state in database)
- Full conversation flow for service requests
- Interactive buttons for service type selection and confirmation
- Integration with authorization system
- Status notifications throughout lifecycle

### Database Integration
- PostgreSQL via Neon with SSL/TLS
- Raw SQL queries with parameter injection (safe from SQL injection)
- Connection pooling with sensible defaults
- Migration system for schema versioning

### Error Handling
- Try-catch blocks with structured logging
- Error messages in Spanish (Spanish-speaking system)
- Consistent error response format
- Logging prefixes for easy filtering ([DB], [WhatsApp], [Auth], [API])

## Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with Neon credentials, Clerk keys, WhatsApp tokens

# 3. Run migrations
npm run db:migrate

# 4. Start development server
npm run dev
# Server listens on localhost:3001

# 5. Production build
npm run build
npm start
```

## Architecture Decisions

### Why Neon over Supabase
- Direct PostgreSQL access with `pg` driver
- Lower latency for connection-heavy systems
- Better control over pooling
- Serverless PostgreSQL scales with Vercel/Cloudflare

### Why Meta WhatsApp over Twilio
- Native WhatsApp UX (not green-coded SMS)
- Lower cost per message
- Better delivery rates for WhatsApp platform
- Interactive buttons out of the box

### Why Clerk over Custom Auth
- External identity provider (no password management)
- Built-in social login support
- Server-side token verification
- Easy to add frontend authentication

### State Machine in Database
- Stateless server design
- Session persistence across restarts
- Supports load balancing
- Easy to debug (can see state in DB)

## Missing Files (Not in Spec)

The following files exist but were NOT in the specification. They were likely auto-generated:
- src/api/admin.routes.ts
- src/api/autorizador.routes.ts
- src/api/conductor.routes.ts
- src/api/reportes.routes.ts
- src/server.ts
- src/services/alerta.service.ts
- src/services/cron.service.ts
- src/services/tarifa.service.ts

**These should be deleted** - all routes are implemented inline in src/index.ts per specification.

## File Locations

All files are in:
```
/sessions/sweet-compassionate-hawking/mnt/outputs/VIAJA-COL-V2/server/
```

## Database Schema Summary

### usuarios (Users)
```
id, clerk_user_id (unique), nombre, email, telefono, rol, 
empresa_cliente_id, empresa_transportista_id, estado, creado_en
```

### pasajeros (Passengers)
```
id, empresa_cliente_id, telefono (unique per empresa), nombre, email, 
estado, creado_en
```

### solicitudes_transporte (Service Requests)
```
id, pasajero_id, empresa_cliente_id, empresa_transportista_id,
conductor_id, vehiculo_id, direccion_recogida, direccion_destino,
fecha_servicio, hora_servicio, tipo_servicio, estado,
autorizado_por, rechazado_por, inicio_en, fin_en, creado_en
```

## Next Steps for Implementation

1. **Delete extra files** (src/api/*, src/services/alerta|cron|tarifa.service.ts, src/server.ts)
2. **Create frontend** with Clerk auth integration
3. **Deploy to Vercel** with environment variables
4. **Set up Neon database** with provided migration script
5. **Configure WhatsApp webhook** in Meta dashboard pointing to `/webhook/whatsapp`
6. **Test webhook verification** with WHATSAPP_VERIFY_TOKEN
7. **Load test** connection pool under high load
8. **Monitor slow queries** in production logs

## Support Contacts

- **Neon Support**: https://neon.tech/docs
- **Clerk Docs**: https://clerk.com/docs
- **Meta WhatsApp API**: https://developers.facebook.com/docs/whatsapp/
- **Express.js Guide**: https://expressjs.com/

---

**Delivery Date**: 2026-04-08
**Server Version**: 2.0.0
**Status**: Ready for integration testing
