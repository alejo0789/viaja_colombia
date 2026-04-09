import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/pool';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/admin/usuarios
 * List all users (admin only)
 */
router.get('/usuarios', requireRole('admin_transportista'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, nombre, rol, estado, created_at
       FROM usuarios
       ORDER BY created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

/**
 * GET /api/admin/usuarios/:userId
 * Get user details
 */
router.get('/usuarios/:userId', requireRole('admin_transportista'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, nombre, rol, estado, empresa_cliente_id, empresa_transportista_id, created_at
       FROM usuarios WHERE id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

/**
 * PATCH /api/admin/usuarios/:userId
 * Update user status/role
 */
router.patch('/usuarios/:userId', requireRole('admin_transportista'), async (req: Request, res: Response) => {
  try {
    const { estado, rol } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (estado) {
      updates.push(`estado = $${paramIndex++}`);
      values.push(estado);
    }
    if (rol) {
      updates.push(`rol = $${paramIndex++}`);
      values.push(rol);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No campos para actualizar' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.userId);

    const result = await query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, nombre, rol, estado`,
      values
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

/**
 * GET /api/admin/conductores
 * List all drivers
 */
router.get('/conductores', requireRole('admin_transportista'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT c.*, u.email, u.nombre as usuario_nombre
       FROM conductores c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       ORDER BY c.created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo conductores' });
  }
});

/**
 * GET /api/admin/vehiculos
 * List all vehicles
 */
router.get('/vehiculos', requireRole('admin_transportista'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM vehiculos ORDER BY created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo vehículos' });
  }
});

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
router.get('/stats', requireRole('admin_transportista'), async (req: Request, res: Response) => {
  try {
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM conductores) as total_conductores,
        (SELECT COUNT(*) FROM vehiculos) as total_vehiculos,
        (SELECT COUNT(*) FROM solicitudes WHERE estado = 'pendiente_autorizacion') as solicitudes_pendientes,
        (SELECT COUNT(*) FROM solicitudes WHERE estado = 'en_curso') as solicitudes_activas,
        (SELECT COUNT(*) FROM alertas WHERE resuelta = false) as alertas_sin_resolver
    `);

    res.json({ data: statsResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

export default router;
