import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { closePool } from './db/pool';
import { authMiddleware, requireRole, requireEmpresaCliente } from './middleware/auth.middleware';
import { cronService } from './services/cron.service';

// Import routes
import adminRoutes from './api/admin.routes';
import conductorRoutes from './api/conductor.routes';
import autorizadorRoutes from './api/autorizador.routes';
import reportesRoutes from './api/reportes.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware (applies to all protected routes)
app.use('/api', authMiddleware);

// Routes by role
// Admin routes (Rol 1 - Admin Transportista)
app.use('/api/admin', requireRole(1), adminRoutes);

// Conductor routes (Rol 2 - Conductor)
app.use('/api/conductor', requireRole(2), conductorRoutes);

// Autorizador routes (Rol 4 - Autorizador Empresa Cliente)
app.use('/api/autorizador', requireRole(4), requireEmpresaCliente, autorizadorRoutes);

// Reports routes (accessible to Rol 1)
app.use('/api/reportes', requireRole(1), reportesRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize cron jobs
  cronService.initializeJobs();
  console.log('Cron jobs initialized');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');

  // Stop cron jobs
  cronService.stopAllJobs();

  // Close database pool
  await closePool();

  // Close HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
