# VIAJA-COL Backend v2.0 - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Neon Database (get from neon.tech)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/viajacol?sslmode=require

# Clerk (get from clerk.com)
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Meta WhatsApp (get from business.facebook.com)
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=my_secret_token_12345
WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

### 3. Initialize Database
```bash
npm run db:migrate
```

This will:
- Create all tables (usuarios, pasajeros, solicitudes_transporte, etc.)
- Set up indexes for performance
- Track migrations to prevent re-running

### 4. Start Development Server
```bash
npm run dev
```

Server will be ready at `http://localhost:3001`

### 5. Verify Webhook
Test your WhatsApp webhook URL in Meta dashboard:

```
URL: https://yourdomain.com/webhook/whatsapp
Verify Token: (same as WHATSAPP_VERIFY_TOKEN in .env)
```

Meta will send a GET request with `hub.challenge` parameter. Your server will respond with it automatically.

## Testing the System

### Health Check
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2026-04-08T10:30:00.000Z"
}
```

### Test WhatsApp Message
Send a message from your phone to the WhatsApp Business number. The chatbot will:
1. Welcome you (INICIO state)
2. Show menu options (MENU state)
3. Walk you through service request flow
4. Create solicitud in database
5. Trigger authorization flow if configured

### Check Database
```bash
psql "postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/viajacol?sslmode=require"

SELECT * FROM usuarios;
SELECT * FROM pasajeros;
SELECT * FROM solicitudes_transporte;
SELECT * FROM estados_chat_pasajero;
```

## API Endpoints

### Public (No Auth)
```
GET  /health                                    Server status
GET  /webhook/whatsapp                         Webhook verification
POST /webhook/whatsapp                         Incoming messages
```

### Admin Routes (Clerk auth + admin_transportista role)
```
GET  /api/admin/solicitudes                    List all requests
POST /api/admin/asignar-conductor              Assign driver
```

### Conductor Routes (Clerk auth + conductor role)
```
GET  /api/conductor/asignaciones               Get my assignments
POST /api/conductor/iniciar-servicio           Start service
POST /api/conductor/finalizar-servicio         Complete service
```

### Autorizador Routes (Clerk auth + autorizador role)
```
GET  /api/autorizador/solicitudes              List pending authorizations
POST /api/autorizador/autorizar                Approve request
POST /api/autorizador/rechazar                 Reject request
```

### Reports (Clerk auth required)
```
GET  /api/reportes/mis-solicitudes             Get my requests
```

## Authentication Flow

1. User signs in with Clerk on frontend
2. Frontend receives session token
3. Frontend sends requests with `Authorization: Bearer <token>`
4. Server validates token with Clerk
5. Server looks up user in database by Clerk ID
6. Server checks role and returns data

Example request:
```bash
curl http://localhost:3001/api/admin/solicitudes \
  -H "Authorization: Bearer your_clerk_session_token"
```

## WhatsApp Chatbot Flow

User sends message → Server processes → Database updated → User notified

```
1. User sends "1" → Create new service
   ↓
2. Server asks for pickup location
   ↓
3. User sends address → Stored in solicitud
   ↓
4. Server asks for destination
   ↓
5. User sends address → Stored
   ↓
6. Server asks for date
   ↓
7. User sends date (DD/MM/YYYY) → Stored
   ↓
8. Server asks for time
   ↓
9. User sends time (HH:MM) → Stored
   ↓
10. Server shows service types with buttons
    ↓
11. User clicks button (1-Economico, 2-Ejecutivo, 3-Van)
    ↓
12. Server shows confirmation with all details
    ↓
13. User clicks Confirm/Cancel
    ↓
14. If confirmed: solicitud status = 'pendiente_autorizacion'
    Authorization request sent to autorizador via WhatsApp
    ↓
15. Autorizador receives buttons (Approve/Reject)
    ↓
16. Autorizador clicks button
    ↓
17. Admin notified → Assigns conductor
    ↓
18. Conductor notified → Starts service
    ↓
19. Passenger notified of status changes
```

## Database Schema

### Key Tables

**usuarios** (Users with Clerk integration)
- id, clerk_user_id (Clerk's ID), nombre, email, telefono
- rol (admin_transportista, conductor, autorizador, admin_cliente)
- empresa_cliente_id, empresa_transportista_id

**pasajeros** (Passengers)
- id, empresa_cliente_id, telefono, nombre, email, estado

**solicitudes_transporte** (Service Requests)
- id, pasajero_id, conductor_id, vehiculo_id
- direccion_recogida, direccion_destino, fecha_servicio, hora_servicio
- tipo_servicio (economico, ejecutivo, van)
- estado (pendiente, pendiente_autorizacion, autorizado, rechazado, asignado, en_curso, finalizado)
- autorizado_por, rechazado_por, inicio_en, fin_en

**estados_chat_pasajero** (WhatsApp Chatbot State)
- pasajero_id, solicitud_id, estado, creado_en

## Troubleshooting

### WhatsApp Messages Not Received
1. Check webhook URL is public and HTTPS
2. Verify WHATSAPP_VERIFY_TOKEN matches Meta dashboard
3. Check server logs: `npm run dev` shows all activity
4. Test with: `curl -v http://localhost:3001/webhook/whatsapp`

### Database Connection Error
1. Verify DATABASE_URL format:
   `postgresql://user:password@host:port/dbname?sslmode=require`
2. Test connection: `psql "your_database_url"`
3. Check Neon console for allowlist/firewall rules

### Auth Token Invalid
1. Verify CLERK_SECRET_KEY is correct
2. Check token is being sent in Authorization header
3. Verify user exists in database with matching clerk_user_id

### Slow Queries
1. Check logs for "[DB] Slow query:" warnings
2. View query in warning and optimize
3. Add indexes if needed (see migrations)

## Production Deployment

### Environment Setup
```bash
NODE_ENV=production
CLERK_SECRET_KEY=sk_live_xxx  (use production key)
WHATSAPP_ACCESS_TOKEN=EAAV... (use production token)
PORT=3001
```

### Build & Start
```bash
npm run build
npm start
```

### Database Migrations
```bash
npm run db:migrate  # Run before every deploy
```

### Health Check (from container orchestrator)
```bash
curl http://localhost:3001/health
```

### Logging
All logs are written to stdout with prefixes:
- `[Server]` - Server lifecycle
- `[DB]` - Database operations
- `[WhatsApp]` - WhatsApp API calls
- `[Auth]` - Authentication events
- `[API]` - API endpoint activity

Monitor these in your logging service (Datadog, Sentry, CloudWatch, etc).

## Files Modified
All code is in `/sessions/sweet-compassionate-hawking/mnt/outputs/VIAJA-COL-V2/server/`

Key files to reference:
- **src/index.ts** - All Express routes
- **src/db/pool.ts** - Database connection
- **src/webhooks/whatsapp.webhook.ts** - Chatbot state machine
- **src/services/whatsapp.service.ts** - WhatsApp API wrapper
- **src/middleware/auth.middleware.ts** - Clerk authentication

## Support

- Neon Database: https://neon.tech/docs
- Clerk Auth: https://clerk.com/docs
- WhatsApp API: https://developers.facebook.com/docs/whatsapp
- Express.js: https://expressjs.com/

---

Ready to build? Start with `npm install` and `npm run dev`!
