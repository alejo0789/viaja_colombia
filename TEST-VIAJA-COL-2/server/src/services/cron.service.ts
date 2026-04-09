import { CronJob } from 'cron';
import { AlertaService } from './alerta.service';
import { query } from '../db/pool';

const alertaService = new AlertaService();

export class CronService {
  private jobs: Map<string, CronJob> = new Map();

  /**
   * Initialize all scheduled tasks
   */
  initializeJobs(): void {
    this.setupAlertaSolicitudesSinAsignar();
    this.setupAlertaServiciosSinIniciar();
    this.setupVerificacionInconsistencias();
    this.setupLimpiezaAlertas();
    this.setupRestablecerLimitesEmpodeados();

    console.log('Cron jobs initialized');
  }

  /**
   * Check for unassigned solicitudes every 5 minutes
   */
  private setupAlertaSolicitudesSinAsignar(): void {
    const job = new CronJob('*/5 * * * *', async () => {
      try {
        console.log('[CRON] Verificando solicitudes sin asignar...');
        await alertaService.verificarSolicitudesSinAsignar(30); // 30 minutes threshold
      } catch (error) {
        console.error('[CRON] Error verificando solicitudes sin asignar:', error);
      }
    });

    job.start();
    this.jobs.set('alertaSolicitudesSinAsignar', job);
  }

  /**
   * Check for services not started every 10 minutes
   */
  private setupAlertaServiciosSinIniciar(): void {
    const job = new CronJob('*/10 * * * *', async () => {
      try {
        console.log('[CRON] Verificando servicios sin iniciar...');
        await alertaService.verificarServiciosSinIniciar(15); // 15 minutes threshold
      } catch (error) {
        console.error('[CRON] Error verificando servicios sin iniciar:', error);
      }
    });

    job.start();
    this.jobs.set('alertaServiciosSinIniciar', job);
  }

  /**
   * Verify data inconsistencies daily at 2 AM
   */
  private setupVerificacionInconsistencias(): void {
    const job = new CronJob('0 2 * * *', async () => {
      try {
        console.log('[CRON] Verificando inconsistencias en datos...');
        await alertaService.verificarInconsistencias();
      } catch (error) {
        console.error('[CRON] Error verificando inconsistencias:', error);
      }
    });

    job.start();
    this.jobs.set('verificacionInconsistencias', job);
  }

  /**
   * Clean up resolved alerts older than 30 days
   */
  private setupLimpiezaAlertas(): void {
    const job = new CronJob('0 3 * * 0', async () => {
      try {
        console.log('[CRON] Limpiando alertas resueltas antiguas...');
        await query(
          `
          DELETE FROM alertas
          WHERE resuelta = true
            AND fecha_resolucion < NOW() - INTERVAL '30 days'
          `
        );
        console.log('[CRON] Limpieza de alertas completada');
      } catch (error) {
        console.error('[CRON] Error limpiando alertas:', error);
      }
    });

    job.start();
    this.jobs.set('limpiezaAlertas', job);
  }

  /**
   * Reset monthly service limits for empleados at 12:00 AM on the 1st
   */
  private setupRestablecerLimitesEmpodeados(): void {
    const job = new CronJob('0 0 1 * *', async () => {
      try {
        console.log('[CRON] Restableciendo límites mensuales de empleados...');
        await query(
          `
          UPDATE empleados_autorizados
          SET servicios_usados_mes = 0, updated_at = NOW()
          WHERE estado = 'activo'
          `
        );
        console.log('[CRON] Límites mensuales restablecidos');
      } catch (error) {
        console.error('[CRON] Error restableciendo límites:', error);
      }
    });

    job.start();
    this.jobs.set('restablecerLimitesEmpleados', job);
  }

  /**
   * Start all jobs
   */
  startAllJobs(): void {
    this.jobs.forEach((job) => {
      if (!job.running) {
        job.start();
      }
    });
    console.log('All cron jobs started');
  }

  /**
   * Stop all jobs
   */
  stopAllJobs(): void {
    this.jobs.forEach((job) => {
      if (job.running) {
        job.stop();
      }
    });
    console.log('All cron jobs stopped');
  }

  /**
   * Get job status
   */
  getJobStatus(jobName: string): boolean | null {
    const job = this.jobs.get(jobName);
    return job ? job.running : null;
  }

  /**
   * List all jobs
   */
  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}

// Export singleton
export const cronService = new CronService();
