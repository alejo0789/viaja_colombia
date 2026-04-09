import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { TarifaService } from '../services/tarifa.service';

const router = Router();
const tarifaService = new TarifaService();

// GET /servicios-por-dia - Services grouped by date with cost totals
router.get('/servicios-por-dia', async (req: Request, res: Response) => {
  try {
    const { desde, hasta } = req.query;

    let sql = `
      SELECT
        DATE(s.fecha) as fecha,
        COUNT(DISTINCT s.id) as cantidad_servicios,
        COUNT(DISTINCT CASE WHEN s.estado = 'finalizada' THEN s.id END) as servicios_finalizados,
        ROUND(SUM(a.tarifa_total)::numeric, 2) as tarifa_total,
        ROUND(AVG(a.duracion_min)::numeric, 2) as duracion_promedio_min
      FROM solicitudes s
      LEFT JOIN asignaciones a ON s.id = a.solicitud_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (desde) {
      sql += ` AND DATE(s.fecha) >= $${params.length + 1}`;
      params.push(desde);
    }

    if (hasta) {
      sql += ` AND DATE(s.fecha) <= $${params.length + 1}`;
      params.push(hasta);
    }

    sql += ` GROUP BY DATE(s.fecha) ORDER BY fecha DESC`;

    const result = await query(sql, params);

    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /por-tipo-servicio - Services grouped by service type
router.get('/por-tipo-servicio', async (req: Request, res: Response) => {
  try {
    const { desde, hasta } = req.query;

    let sql = `
      SELECT
        ts.id,
        ts.nombre as tipo_servicio,
        COUNT(DISTINCT s.id) as cantidad_servicios,
        COUNT(DISTINCT CASE WHEN s.estado = 'finalizada' THEN s.id END) as servicios_finalizados,
        ROUND(AVG(a.duracion_min)::numeric, 2) as duracion_promedio_min,
        ROUND(SUM(a.tarifa_total)::numeric, 2) as tarifa_total,
        ROUND(AVG(a.tarifa_total)::numeric, 2) as tarifa_promedio
      FROM solicitudes s
      LEFT JOIN tipos_servicio ts ON s.tipo_servicio_id = ts.id
      LEFT JOIN asignaciones a ON s.id = a.solicitud_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (desde) {
      sql += ` AND DATE(s.fecha) >= $${params.length + 1}`;
      params.push(desde);
    }

    if (hasta) {
      sql += ` AND DATE(s.fecha) <= $${params.length + 1}`;
      params.push(hasta);
    }

    sql += ` GROUP BY ts.id, ts.nombre ORDER BY cantidad_servicios DESC`;

    const result = await query(sql, params);

    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /excedentes - Services with overtime charges
router.get('/excedentes', async (req: Request, res: Response) => {
  try {
    const { desde, hasta, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sql = `
      SELECT
        s.id as solicitud_id,
        s.solicitante_nombre,
        s.ubicacion_origen,
        s.ubicacion_destino,
        s.fecha,
        s.hora_programada,
        ts.nombre as tipo_servicio,
        a.duracion_min,
        a.tiempo_excedido_min,
        a.bloques_extra,
        a.costo_extra,
        a.tarifa_total,
        c.nombre as conductor_nombre
      FROM solicitudes s
      LEFT JOIN tipos_servicio ts ON s.tipo_servicio_id = ts.id
      LEFT JOIN asignaciones a ON s.id = a.solicitud_id
      LEFT JOIN conductores c ON a.conductor_id = c.id
      WHERE a.tiempo_excedido_min > 0
    `;

    const params: any[] = [];

    if (desde) {
      sql += ` AND DATE(s.fecha) >= $${params.length + 1}`;
      params.push(desde);
    }

    if (hasta) {
      sql += ` AND DATE(s.fecha) <= $${params.length + 1}`;
      params.push(hasta);
    }

    sql += ` ORDER BY s.fecha DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await query(sql, params);

    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /simular-tarifa - Simulate tariff without saving
router.get('/simular-tarifa', async (req: Request, res: Response) => {
  try {
    const { tipo_servicio_id, duracion_min, es_nocturno = false, es_festivo = false } = req.query;

    // Get tipo_servicio details
    const tipoResult = await query(
      `
      SELECT
        tarifa_base,
        tiempo_maximo_min,
        costo_extra,
        bloque_min,
        recargo_nocturnidad_pct,
        recargo_festivo_pct
      FROM tipos_servicio
      WHERE id = $1
      `,
      [tipo_servicio_id]
    );

    if (tipoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tipo de servicio no encontrado' });
    }

    const tipoServicio = tipoResult.rows[0];

    // Calculate tariff
    const tariffCalc = await tarifaService.calcular({
      tarifaBase: tipoServicio.tarifa_base,
      tiempoMaxMin: tipoServicio.tiempo_maximo_min,
      costoExtra: tipoServicio.costo_extra,
      bloqueMin: tipoServicio.bloque_min,
      duracionMin: Number(duracion_min),
      esNocturno: es_nocturno === 'true' || es_nocturno === true,
      esFestivo: es_festivo === 'true' || es_festivo === true,
      recargNoctPct: tipoServicio.recargo_nocturnidad_pct,
      recargFestPct: tipoServicio.recargo_festivo_pct
    });

    res.json({ data: tariffCalc });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /exportar - Export services as JSON for CSV conversion
router.get('/exportar', async (req: Request, res: Response) => {
  try {
    const { desde, hasta } = req.query;

    let sql = `
      SELECT
        s.id,
        s.solicitante_nombre,
        s.solicitante_telefono,
        s.ubicacion_origen,
        s.ubicacion_destino,
        DATE(s.fecha) as fecha,
        s.hora_programada,
        ts.nombre as tipo_servicio,
        s.estado,
        c.nombre as conductor_nombre,
        a.duracion_min,
        a.tiempo_excedido_min,
        a.tarifa_total,
        ec.nombre as empresa_cliente,
        s.created_at,
        s.updated_at
      FROM solicitudes s
      LEFT JOIN tipos_servicio ts ON s.tipo_servicio_id = ts.id
      LEFT JOIN asignaciones a ON s.id = a.solicitud_id
      LEFT JOIN conductores c ON a.conductor_id = c.id
      LEFT JOIN empresas_clientes ec ON s.empresa_cliente_id = ec.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (desde) {
      sql += ` AND DATE(s.fecha) >= $${params.length + 1}`;
      params.push(desde);
    }

    if (hasta) {
      sql += ` AND DATE(s.fecha) <= $${params.length + 1}`;
      params.push(hasta);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const result = await query(sql, params);

    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
