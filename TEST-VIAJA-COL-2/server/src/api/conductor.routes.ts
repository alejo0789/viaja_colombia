import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/conductor/perfil
 * Get conductor profile
 */
router.get('/perfil', requireRole('conductor'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT c.*, u.email, u.nombre
       FROM conductores c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.usuario_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Perfil de conductor no encontrado' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

/**
 * GET /api/conductor/asignaciones
 * Get active assignments
 */
router.get('/asignaciones', requireRole('conductor'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT a.*, s.numero_solicitud, s.direccion_recogida, s.direccion_destino,
              s.hora_programada, s.estado as solicitud_estado, v.placa
       FROM asignaciones a
       JOIN solicitudes s ON a.solicitud_id = s.id
       JOIN vehiculos v ON a.vehiculo_id = v.id
       WHERE a.conductor_id = (SELECT id FROM conductores WHERE usuario_id = $1)
       AND a.hora_fin_real IS NULL
       ORDER BY a.fecha_asignacion DESC`,
      [req.userId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo asignaciones' });
  }
});

/**
 * POST /api/conductor/asignaciones/:asignacionId/confirmar-inicio
 * Confirm service start
 */
router.post('/asignaciones/:asignacionId/confirmar-inicio', requireRole('conductor'), async (req: Request, res: Response) => {
  try {
    const { cedulaEmpleado } = req.body;

    if (!cedulaEmpleado) {
      res.status(400).json({ error: 'Cédula del empleado requerida' });
      return;
    }

    const result = await query(
      `UPDATE asignaciones
       SET hora_inicio_real = NOW(), cedula_confirmada = $1
       WHERE id = $2 AND conductor_id = (SELECT id FROM conductores WHERE usuario_id = $3)
       RETURNING *`,
      [cedulaEmpleado, req.params.asignacionId, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Asignación no encontrada' });
      return;
    }

    res.json({ data: result.rows[0], message: 'Servicio iniciado' });
  } catch (error) {
    res.status(500).json({ error: 'Error confirmando inicio' });
  }
});

/**
 * POST /api/conductor/asignaciones/:asignacionId/finalizar
 * Complete service
 */
router.post('/asignaciones/:asignacionId/finalizar', requireRole('conductor'), async (req: Request, res: Response) => {
  try {
    const { cedulaConfirmada } = req.body;

    const result = await query(
      `UPDATE asignaciones
       SET hora_fin_real = NOW(), cedula_valida = COALESCE($1::boolean, cedula_valida)
       WHERE id = $2 AND conductor_id = (SELECT id FROM conductores WHERE usuario_id = $3)
       RETURNING *`,
      [cedulaConfirmada, req.params.asignacionId, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Asignación no encontrada' });
      return;
    }

    // TODO: Calculate charges based on duration and service type
    res.json({ data: result.rows[0], message: 'Servicio finalizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error finalizando servicio' });
  }
});

export default router;
