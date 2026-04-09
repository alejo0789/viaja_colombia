import { query } from '../db/pool';
import { WhatsAppService } from '../services/whatsapp.service';

/**
 * Handles authorization button replies from autorizadores
 * Processes AUTH_SI_* and AUTH_NO_* button IDs
 */
export async function handleAuthorizationReply(
  from: string,
  buttonId: string
): Promise<void> {
  try {
    // AUTH_SI_<solicitudId> or AUTH_NO_<solicitudId>
    const isApproved = buttonId.startsWith('AUTH_SI_');
    const solicitudId = parseInt(buttonId.split('_').pop() || '0');

    if (!solicitudId || isNaN(solicitudId)) {
      console.warn('[AuthWebhook] Invalid button ID format:', buttonId);
      return;
    }

    // Get solicitud details
    const solicitudResult = await query(
      `SELECT pasajero_id, direccion_recogida, direccion_destino, fecha_servicio, hora_servicio, tipo_servicio
       FROM solicitudes_transporte WHERE id = $1`,
      [solicitudId]
    );

    if (solicitudResult.rows.length === 0) {
      console.warn('[AuthWebhook] Solicitud not found:', solicitudId);
      await WhatsAppService.enviarMensaje(from, `❌ No se encontró la solicitud.`);
      return;
    }

    const solicitud = solicitudResult.rows[0];

    // Get pasajero details
    const pasajeroResult = await query(
      `SELECT id, telefono, nombre, empresa_cliente_id FROM pasajeros WHERE id = $1`,
      [solicitud.pasajero_id]
    );

    const pasajero = pasajeroResult.rows[0];

    if (isApproved) {
      // Update solicitud to autorizado
      await query(
        `UPDATE solicitudes_transporte SET estado = 'autorizado', autorizado_por = $1 WHERE id = $2`,
        [from, solicitudId]
      );

      // Notify pasajero
      await WhatsAppService.notificarPasajeroEstado({
        telefonoPasajero: pasajero.telefono,
        estado: 'autorizado',
      });

      // Alert admin to assign driver
      const adminResult = await query(
        `SELECT telefono FROM usuarios WHERE empresa_cliente_id = $1 AND rol = 'admin_transportista' LIMIT 1`,
        [pasajero.empresa_cliente_id]
      );

      if (adminResult.rows[0]) {
        await WhatsAppService.alertaNuevaSolicitud({
          telefonoAdmin: adminResult.rows[0].telefono,
          nombrePasajero: pasajero.nombre,
          empresa: 'VIAJA COL',
          tipoServicio: solicitud.tipo_servicio,
          direccionRecogida: solicitud.direccion_recogida,
          fecha: solicitud.fecha_servicio,
          hora: solicitud.hora_servicio,
          numeroSolicitud: solicitudId,
        });
      }

      // Confirm to autorizador
      await WhatsAppService.enviarMensaje(
        from,
        `✅ *Solicitud autorizada*\n\n📋 #${solicitudId}\n👤 ${pasajero.nombre}\n\nSe notificó al administrador para asignar conductor.`
      );

      console.log(`[AuthWebhook] Solicitud ${solicitudId} approved by ${from}`);
    } else {
      // AUTH_NO_ - Rejected
      await query(
        `UPDATE solicitudes_transporte SET estado = 'rechazado', rechazado_por = $1 WHERE id = $2`,
        [from, solicitudId]
      );

      // Notify pasajero
      await WhatsAppService.notificarPasajeroEstado({
        telefonoPasajero: pasajero.telefono,
        estado: 'rechazado',
        detalles: { motivoRechazo: 'Autorización denegada' },
      });

      // Confirm to autorizador
      await WhatsAppService.enviarMensaje(
        from,
        `❌ *Solicitud rechazada*\n\n📋 #${solicitudId}\n👤 ${pasajero.nombre}\n\nSe notificó al pasajero.`
      );

      console.log(`[AuthWebhook] Solicitud ${solicitudId} rejected by ${from}`);
    }
  } catch (error) {
    console.error('[AuthWebhook] Error handling authorization reply:', error);
    await WhatsAppService.enviarMensaje(
      from,
      `❌ Error procesando la autorización. Intenta nuevamente.`
    );
  }
}
