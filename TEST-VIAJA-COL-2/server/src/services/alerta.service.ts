import { query } from '../db/pool';

export class AlertaService {
  /**
   * Create a new alert
   */
  async crear(
    tipo: string,
    mensaje: string,
    datos?: any,
    solicitud_id?: string,
    asignacion_id?: string
  ): Promise<any> {
    const result = await query(
      `
      INSERT INTO alertas (tipo, mensaje, datos, solicitud_id, asignacion_id, leida, resuelta, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
      `,
      [tipo, mensaje, datos ? JSON.stringify(datos) : null, solicitud_id, asignacion_id, false, false]
    );

    return result.rows[0];
  }

  /**
   * Check for solicitudes that haven't been assigned within threshold
   */
  async verificarSolicitudesSinAsignar(minutosUmbral: number): Promise<void> {
    const result = await query(
      `
      SELECT s.id
      FROM solicitudes s
      WHERE s.estado = 'autorizada'
        AND s.created_at < NOW() - INTERVAL '1 minute' * $1
        AND NOT EXISTS (
          SELECT 1 FROM alertas a
          WHERE a.solicitud_id = s.id
            AND a.tipo = 'SOLICITUD_SIN_ASIGNAR'
            AND a.resuelta = false
        )
      `,
      [minutosUmbral]
    );

    // Create alert for each solicitud
    for (const row of result.rows) {
      await this.crear(
        'SOLICITUD_SIN_ASIGNAR',
        `Solicitud ${row.id} no ha sido asignada en ${minutosUmbral} minutos`,
        { solicitud_id: row.id, umbral_minutos: minutosUmbral },
        row.id
      );
    }
  }

  /**
   * Check for services that haven't started within threshold
   */
  async verificarServiciosSinIniciar(minutosUmbral: number): Promise<void> {
    const result = await query(
      `
      SELECT a.id, a.solicitud_id, s.hora_programada
      FROM asignaciones a
      JOIN solicitudes s ON a.solicitud_id = s.id
      WHERE a.estado = 'asignada'
        AND s.fecha::timestamp + s.hora_programada < NOW() - INTERVAL '1 minute' * $1
        AND NOT EXISTS (
          SELECT 1 FROM alertas al
          WHERE al.asignacion_id = a.id
            AND al.tipo = 'SERVICIO_SIN_INICIAR'
            AND al.resuelta = false
        )
      `,
      [minutosUmbral]
    );

    // Create alert for each asignacion
    for (const row of result.rows) {
      await this.crear(
        'SERVICIO_SIN_INICIAR',
        `Servicio ${row.id} no ha iniciado. Programado para: ${row.hora_programada}`,
        { asignacion_id: row.id, hora_programada: row.hora_programada },
        row.solicitud_id,
        row.id
      );
    }
  }

  /**
   * Verify data inconsistencies
   */
  async verificarInconsistencias(): Promise<void> {
    // Check for asignaciones without solicitudes
    const orfanosResult = await query(
      `
      SELECT a.id
      FROM asignaciones a
      WHERE NOT EXISTS (SELECT 1 FROM solicitudes s WHERE s.id = a.solicitud_id)
      `
    );

    for (const row of orfanosResult.rows) {
      await this.crear(
        'INCONSISTENCIA_DATOS',
        `Asignación ${row.id} no tiene solicitud asociada (datos huérfanos)`
      );
    }

    // Check for solicitudes with duration but no tariff
    const sinTarifaResult = await query(
      `
      SELECT s.id
      FROM solicitudes s
      JOIN asignaciones a ON s.id = a.solicitud_id
      WHERE s.estado = 'finalizada'
        AND a.hora_fin_real IS NOT NULL
        AND (a.tarifa_total IS NULL OR a.tarifa_total = 0)
      `
    );

    for (const row of sinTarifaResult.rows) {
      await this.crear(
        'INCONSISTENCIA_DATOS',
        `Solicitud finalizada ${row.id} no tiene tarifa calculada`,
        { solicitud_id: row.id }
      );
    }
  }

  /**
   * Mark alert as read
   */
  async marcarLeida(id: string): Promise<any> {
    const result = await query(
      `
      UPDATE alertas
      SET leida = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Resolve alert
   */
  async resolver(id: string, userId: string, notas?: string): Promise<any> {
    const result = await query(
      `
      UPDATE alertas
      SET
        resuelta = true,
        resuelta_por = $1,
        fecha_resolucion = NOW(),
        notas_resolucion = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [userId, notas, id]
    );

    return result.rows[0];
  }

  /**
   * Get unresolved alerts
   */
  async obtenerAbiertas(): Promise<any[]> {
    const result = await query(
      `
      SELECT * FROM alertas
      WHERE resuelta = false
      ORDER BY created_at DESC
      `
    );

    return result.rows;
  }

  /**
   * Get alerts by type
   */
  async obtenerPorTipo(tipo: string): Promise<any[]> {
    const result = await query(
      `
      SELECT * FROM alertas
      WHERE tipo = $1 AND resuelta = false
      ORDER BY created_at DESC
      `,
      [tipo]
    );

    return result.rows;
  }
}
