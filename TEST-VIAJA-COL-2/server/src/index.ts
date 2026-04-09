import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { closePool } from './db/pool';
import { authMiddleware, requireRole } from './middleware/auth.middleware';
import authRoutes from './api/auth.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============ Middleware ============
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ Health Check ============
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ Public Routes ============

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// WhatsApp webhook (public - Meta verification)
app.get('/webhook/whatsapp', (req: Request, res: Response) => {
  const token = req.query.hub_verify_token;
  const challenge = req.query.hub_challenge;

  if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.send(challenge);
  } else {
    res.status(403).json({ error: 'Token inválido' });
  }
});

app.post('/webhook/whatsapp', (req: Request, res: Response) => {
  // TODO: Implement WhatsApp webhook handler
  console.log('[WhatsApp] Webhook received:', req.body);
  res.sendStatus(200);
});

// ============ Protected Routes (require JWT) ============

// Admin routes
app.use('/api/admin', authMiddleware, requireRole('admin_transportista'));

// Conductor routes
app.use('/api/conductor', authMiddleware, requireRole('conductor'));

// Autorizador routes
app.use('/api/autorizador', authMiddleware, requireRole('autorizador'));

// Reportes routes
app.use('/api/reportes', authMiddleware);

// ============ 404 Handler ============
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ============ Error Handler ============
app.use((err: any, req: Request, res: Response) => {
  console.error('[Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ============ Graceful Shutdown ============
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Shutdown] Señal recibida: ${signal}`);
  try {
    await closePool();
    console.log('[Shutdown] Pool de DB cerrado');
    process.exit(0);
  } catch (err) {
    console.error('[Shutdown] Error:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============ Start Server ============
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           VIAJA-COL Backend Server v2.0.0              ║
║                JWT Authentication                       ║
╠════════════════════════════════════════════════════════╣
║ Port:        ${PORT}
║ Environment: ${process.env.NODE_ENV || 'development'}
║ Frontend:    ${process.env.FRONTEND_URL || 'http://localhost:8080'}
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
