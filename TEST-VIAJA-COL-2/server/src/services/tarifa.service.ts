import { query } from '../db/pool';

export interface TarifaParams {
  tarifaBase: number;
  tiempoMaxMin: number;
  costoExtra: number;
  bloqueMin: number;
  duracionMin: number;
  esNocturno: boolean;
  esFestivo: boolean;
  recargNoctPct: number;
  recargFestPct: number;
}

export interface TarifaResult {
  tarifaBase: number;
  tiempoExcedidoMin: number;
  bloquesExtra: number;
  costoExtra: number;
  recargo: number;
  total: number;
}

export class TarifaService {
  /**
   * Calculate tariff based on parameters
   */
  async calcular(params: TarifaParams): Promise<TarifaResult> {
    const {
      tarifaBase,
      tiempoMaxMin,
      costoExtra,
      bloqueMin,
      duracionMin,
      esNocturno,
      esFestivo,
      recargNoctPct,
      recargFestPct
    } = params;

    // Calculate exceeded time
    const tiempoExcedidoMin = Math.max(0, duracionMin - tiempoMaxMin);

    // Calculate extra blocks
    const bloquesExtra = tiempoExcedidoMin > 0 ? Math.ceil(tiempoExcedidoMin / bloqueMin) : 0;

    // Calculate extra cost
    const costoExtraCalculado = bloquesExtra * costoExtra;

    // Calculate surcharges
    let recargo = 0;
    if (esNocturno) {
      recargo += (tarifaBase * recargNoctPct) / 100;
    }
    if (esFestivo) {
      recargo += (tarifaBase * recargFestPct) / 100;
    }

    // Calculate total
    const total = tarifaBase + costoExtraCalculado + recargo;

    return {
      tarifaBase,
      tiempoExcedidoMin,
      bloquesExtra,
      costoExtra: costoExtraCalculado,
      recargo,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Calculate tariff for a specific asignacion
   */
  async calcularParaAsignacion(asignacionId: string): Promise<TarifaResult> {
    const result = await query(
      `
      SELECT
        s.fecha,
        s.hora_programada,
        ts.tarifa_base,
        ts.tiempo_maximo_min,
        ts.costo_extra,
        ts.bloque_min,
        ts.recargo_nocturnidad_pct,
        ts.recargo_festivo_pct,
        EXTRACT(EPOCH FROM (a.hora_fin_real - a.hora_inicio_real)) / 60 as duracion_min
      FROM asignaciones a
      JOIN solicitudes s ON a.solicitud_id = s.id
      LEFT JOIN tipos_servicio ts ON s.tipo_servicio_id = ts.id
      WHERE a.id = $1
      `,
      [asignacionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Asignación no encontrada');
    }

    const row = result.rows[0];
    const hora = new Date(row.fecha).getHours();
    const esNocturno = hora >= 22 || hora < 5;

    // Simplified holiday check
    const esFestivo = false;

    return this.calcular({
      tarifaBase: row.tarifa_base || 0,
      tiempoMaxMin: row.tiempo_maximo_min || 0,
      costoExtra: row.costo_extra || 0,
      bloqueMin: row.bloque_min || 0,
      duracionMin: Math.round(row.duracion_min),
      esNocturno,
      esFestivo,
      recargNoctPct: row.recargo_nocturnidad_pct || 0,
      recargFestPct: row.recargo_festivo_pct || 0
    });
  }

  /**
   * Simulate tariff for a service type without saving
   */
  async simular(
    tipoServicioId: string,
    duracionMin: number,
    esNocturno: boolean = false,
    esFestivo: boolean = false
  ): Promise<TarifaResult> {
    const result = await query(
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
      [tipoServicioId]
    );

    if (result.rows.length === 0) {
      throw new Error('Tipo de servicio no encontrado');
    }

    const tipoServicio = result.rows[0];

    return this.calcular({
      tarifaBase: tipoServicio.tarifa_base,
      tiempoMaxMin: tipoServicio.tiempo_maximo_min,
      costoExtra: tipoServicio.costo_extra,
      bloqueMin: tipoServicio.bloque_min,
      duracionMin,
      esNocturno,
      esFestivo,
      recargNoctPct: tipoServicio.recargo_nocturnidad_pct,
      recargFestPct: tipoServicio.recargo_festivo_pct
    });
  }

  /**
   * Get tariff history for a conductor
   */
  async obtenerHistorialConductor(conductorId: string, dias: number = 30): Promise<any[]> {
    const result = await query(
      `
      SELECT
        a.id,
        a.solicitud_id,
        a.hora_inicio_real,
        a.hora_fin_real,
        a.duracion_min,
        a.tiempo_excedido_min,
        a.bloques_extra,
        a.costo_extra,
        a.tarifa_total,
        s.fecha,
        ts.nombre as tipo_servicio,
        ec.nombre as empresa_cliente
      FROM asignaciones a
      JOIN solicitudes s ON a.solicitud_id = s.id
      LEFT JOIN tipos_servicio ts ON s.tipo_servicio_id = ts.id
      LEFT JOIN empresas_clientes ec ON s.empresa_cliente_id = ec.id
      WHERE a.conductor_id = $1
        AND a.estado = 'finalizada'
        AND a.hora_fin_real >= NOW() - INTERVAL '1 day' * $2
      ORDER BY a.hora_fin_real DESC
      `,
      [conductorId, dias]
    );

    return result.rows;
  }

  /**
   * Get tariff statistics for a conductor
   */
  async obtenerEstadisticasConductor(conductorId: string, dias: number = 30): Promise<any> {
    const result = await query(
      `
      SELECT
        COUNT(*) as total_servicios,
        ROUND(SUM(a.tarifa_total)::numeric, 2) as ingresos_total,
        ROUND(AVG(a.tarifa_total)::numeric, 2) as tarifa_promedio,
        ROUND(AVG(a.duracion_min)::numeric, 2) as duracion_promedio_min,
        ROUND(SUM(a.costo_extra)::numeric, 2) as ingresos_extras,
        COUNT(CASE WHEN a.tiempo_excedido_min > 0 THEN 1 END) as servicios_con_excedente
      FROM asignaciones a
      WHERE a.conductor_id = $1
        AND a.estado = 'finalizada'
        AND a.hora_fin_real >= NOW() - INTERVAL '1 day' * $2
      `,
      [conductorId, dias]
    );

    return result.rows[0] || {
      total_servicios: 0,
      ingresos_total: 0,
      tarifa_promedio: 0,
      duracion_promedio_min: 0,
      ingresos_extras: 0,
      servicios_con_excedente: 0
    };
  }
}
