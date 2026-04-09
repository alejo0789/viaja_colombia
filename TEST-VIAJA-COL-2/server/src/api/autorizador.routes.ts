import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/autorizador/solicitudes-pendientes
 * Get requests pending authorization
 */
router.get('/solicitudes-pendientes', requireRole('autorizador'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT s.*, e.nombre as empleado_nombre, e.cedula, ec.nombre as empresa_nombre, ts.nombre as tipo_servicio
       FROM solicitudes s
       JOIN empleados_autorizados e ON s.empleado_id = e.id
       JOIN empresas_clientes ec ON s.empresa_cliente_id = ec.id
       JOIN tipos_servicio ts ON s.tipo_servicio_id = ts.id
       WHERE s.estado = 'pendiente_autorizacion'
       ORDER BY s.created_at DESC`
    );

    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo solicitudes pendientes' });
  }
});

/**
 * POST /api/autorizador/solicitudes/:solicitudId/autorizar
 * Authorize a request
 */
router.post('/solicitudes/:solicitudId/autorizar', requireRole('autorizador'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `UPDATE solicitudes
       SET estado = 'autorizada', autorizado_por = $1, fecha_autorizacion = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.userId, req.params.solicitudId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada' });
      return;
    }

    res.json({ data: result.rows[0], message: 'Solicitud autorizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error autorizando solicitud' });
  }
});

/**
 * POST /api/autorizador/solicitudes/:solicitudId/rechazar
 * Reject a request
 */
router.post('/solicitudes/:solicitudId/rechazar', requireRole('autorizador'), async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;

    if (!motivo) {
      res.status(400).json({ error: 'Motivo del rechazo requerido' });
      return;
    }

    const result = await query(
      `UPDATE solicitudes
       SET estado = 'rechazada', autorizado_por = $1, fecha_autorizacion = NOW(), 
           motivo_rechazo = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [req.userId, motivo, req.params.solicitudId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada' });
      return;
    }

    res.json({ data: result.rows[0], message: 'Solicitud rechazada' });
  } catch (error) {
    res.status(500).json({ error: 'Error rechazando solicitud' });
  }
});

export default router;
