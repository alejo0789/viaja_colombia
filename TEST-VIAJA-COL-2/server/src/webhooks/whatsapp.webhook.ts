import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { WhatsAppService } from '../services/whatsapp.service';

const router = Router();

// Webhook verification (GET)
router.get('/', (req: Request, res: Response) => {
  const hubMode = req.query['hub.mode'];
  const hubVerifyToken = req.query['hub.verify_token'];
  const hubChallenge = req.query['hub.challenge'];

  if (hubMode === 'subscribe' && hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified');
    res.status(200).send(hubChallenge);
  } else {
    console.warn('[WhatsApp] Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// Incoming messages (POST)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { object, entry } = req.body;

    if (object !== 'whatsapp_business_account') {
      res.status(400).json({ error: 'Invalid object type' });
      return;
    }

    if (!entry || entry.length === 0) {
      res.status(200).json({ success: true });
      return;
    }

    const changes = entry[0]?.changes || [];
    const value = changes[0]?.value || {};

    // Handle incoming messages
    if (value.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const from = message.from; // phone number without +
      const messageType = message.type;

      console.log(`[WhatsApp] Incoming ${messageType} from ${from}`);

      if (messageType === 'text' && message.text?.body) {
        await handleTextMessage(from, message.text.body);
      } else if (messageType === 'interactive' && message.interactive?.button_reply?.id) {
        await handleButtonReply(from, message.interactive.button_reply.id);
      }
    }

    // Handle message status updates
    if (value.statuses && value.statuses.length > 0) {
      const status = value.statuses[0];
      console.log(`[WhatsApp] Message status: ${status.status} for ${status.id}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle text messages (chatbot state machine for passengers)
async function handleTextMessage(from: string, text: string): Promise<void> {
  try {
    // Normalize phone
    const phoneNormalized = from.replace(/^\+/, '');

    // Get or create passenger by phone
    let pasajeroResult = await query(`SELECT id FROM pasajeros WHERE telefono = $1`, [
      phoneNormalized,
    ]);

    let pasajeroId = pasajeroResult.rows[0]?.id;

    // Get session state
    let stateResult = await query(
      `SELECT estado, solicitud_id FROM estados_chat_pasajero WHERE pasajero_id = $1 ORDER BY creado_en DESC LIMIT 1`,
      [pasajeroId || null]
    );

    let estado = stateResult.rows[0]?.estado || 'INICIO';
    let solicitudId = stateResult.rows[0]?.solicitud_id;

    // Handle INICIO state
    if (estado === 'INICIO') {
      const response = `🚗 *¡Bienvenido a VIAJA COL!*\n\n` +
        `¿Qué deseas hacer hoy?\n\n` +
        `1️⃣  Solicitar transporte\n` +
        `2️⃣  Ver mis solicitudes\n\n` +
        `Responde con tu opción (1 o 2)`;

      await WhatsAppService.enviarMensaje(from, response);

      // If new passenger, create record
      if (!pasajeroId) {
        const insertResult = await query(
          `INSERT INTO pasajeros (telefono, estado) VALUES ($1, 'activo') RETURNING id`,
          [phoneNormalized]
        );
        pasajeroId = insertResult.rows[0].id;
      }

      // Update state
      await query(
        `INSERT INTO estados_chat_pasajero (pasajero_id, estado) VALUES ($1, 'MENU')`,
        [pasajeroId]
      );
      return;
    }

    // Handle MENU state
    if (estado === 'MENU') {
      if (text.includes('1')) {
        await WhatsAppService.enviarMensaje(
          from,
          `📍 *¿De dónde partirás?*\n\nIndica tu dirección de recogida:`
        );
        await query(
          `INSERT INTO estados_chat_pasajero (pasajero_id, estado) VALUES ($1, 'ESPERANDO_DIRECCION_RECOGIDA')`,
          [pasajeroId]
        );
      } else if (text.includes('2')) {
        // Show recent solicitudes
        const solicitudes = await query(
          `SELECT id, estado, fecha_servicio FROM solicitudes_transporte WHERE pasajero_id = $1 ORDER BY creado_en DESC LIMIT 5`,
          [pasajeroId]
        );

        if (solicitudes.rows.length === 0) {
          await WhatsAppService.enviarMensaje(from, `No tienes solicitudes pendientes.`);
        } else {
          const listado = solicitudes.rows
            .map(
              (s: any) =>
                `📋 #${s.id} - Estado: ${s.estado} (${s.fecha_servicio})`
            )
            .join('\n');
          await WhatsAppService.enviarMensaje(from, `Tus solicitudes:\n\n${listado}`);
        }
        await query(
          `INSERT INTO estados_chat_pasajero (pasajero_id, estado) VALUES ($1, 'MENU')`,
          [pasajeroId]
        );
      } else {
        await WhatsAppService.enviarMensaje(from, `Por favor, responde con 1 o 2.`);
      }
      return;
    }

    // Handle ESPERANDO_DIRECCION_RECOGIDA
    if (estado === 'ESPERANDO_DIRECCION_RECOGIDA') {
      // Create new solicitud
      const insertResult = await query(
        `INSERT INTO solicitudes_transporte (pasajero_id, direccion_recogida, estado)
         VALUES ($1, $2, 'pendiente') RETURNING id`,
        [pasajeroId, text]
      );
      solicitudId = insertResult.rows[0].id;

      await WhatsAppService.enviarMensaje(
        from,
        `🏁 *¿A dónde irás?*\n\nIndica tu dirección de destino:`
      );

      await query(
        `UPDATE estados_chat_pasajero SET estado = 'ESPERANDO_DIRECCION_DESTINO', solicitud_id = $1
         WHERE pasajero_id = $2 ORDER BY creado_en DESC LIMIT 1`,
        [solicitudId, pasajeroId]
      );
      return;
    }

    // Handle ESPERANDO_DIRECCION_DESTINO
    if (estado === 'ESPERANDO_DIRECCION_DESTINO') {
      await query(
        `UPDATE solicitudes_transporte SET direccion_destino = $1 WHERE id = $2`,
        [text, solicitudId]
      );

      await WhatsAppService.enviarMensaje(
        from,
        `📅 *¿Para qué fecha?*\n\nResponde en formato DD/MM/YYYY`
      );

      await query(
        `UPDATE estados_chat_pasajero SET estado = 'ESPERANDO_FECHA'
         WHERE pasajero_id = $1 ORDER BY creado_en DESC LIMIT 1`,
        [pasajeroId]
      );
      return;
    }

    // Handle ESPERANDO_FECHA
    if (estado === 'ESPERANDO_FECHA') {
      await query(
        `UPDATE solicitudes_transporte SET fecha_servicio = $1 WHERE id = $2`,
        [text, solicitudId]
      );

      await WhatsAppService.enviarMensaje(
        from,
        `🕐 *¿A qué hora?*\n\nResponde en formato HH:MM`
      );

      await query(
        `UPDATE estados_chat_pasajero SET estado = 'ESPERANDO_HORA'
         WHERE pasajero_id = $1 ORDER BY creado_en DESC LIMIT 1`,
        [pasajeroId]
      );
      return;
    }

    // Handle ESPERANDO_HORA
    if (estado === 'ESPERANDO_HORA') {
      await query(
        `UPDATE solicitudes_transporte SET hora_servicio = $1 WHERE id = $2`,
        [text, solicitudId]
      );

      await WhatsAppService.enviarMensaje(
        from,
        `🚘 *¿Qué tipo de transporte?*\n\n1️⃣  Económico\n2️⃣  Ejecutivo\n3️⃣  Van (6-8 pasajeros)\n\nResponde con tu opción:`
      );

      await query(
        `UPDATE estados_chat_pasajero SET estado = 'ESPERANDO_TIPO_SERVICIO'
         WHERE pasajero_id = $1 ORDER BY creado_en DESC LIMIT 1`,
        [pasajeroId]
      );
      return;
    }

    // Handle ESPERANDO_TIPO_SERVICIO
    if (estado === 'ESPERANDO_TIPO_SERVICIO') {
      const tiposMap: Record<string, string> = {
        '1': 'económico',
        '2': 'ejecutivo',
        '3': 'van',
      };

      const tipo = tiposMap[text.trim()];
      if (!tipo) {
        await WhatsAppService.enviarMensaje(from, `Por favor, responde con 1, 2 o 3.`);
        return;
      }

      await query(
        `UPDATE solicitudes_transporte SET tipo_servicio = $1 WHERE id = $2`,
        [tipo, solicitudId]
      );

      // Get solicitud details for confirmation
      const solicitudResult = await query(
        `SELECT direccion_recogida, direccion_destino, fecha_servicio, hora_servicio, tipo_servicio
         FROM solicitudes_transporte WHERE id = $1`,
        [solicitudId]
      );

      const sol = solicitudResult.rows[0];
      const confirmMsg = `📋 *Confirma tu solicitud:*\n\n` +
        `📍 Recogida: ${sol.direccion_recogida}\n` +
        `🏁 Destino: ${sol.direccion_destino}\n` +
        `📅 Fecha: ${sol.fecha_servicio}\n` +
        `🕐 Hora: ${sol.hora_servicio}\n` +
        `🚘 Tipo: ${sol.tipo_servicio}\n\n` +
        `¿Deseas confirmar esta solicitud?`;

      await WhatsAppService.enviarBotones({
        to: from,
        bodyText: confirmMsg,
        buttons: [
          { id: `CONFIRM_SI_${solicitudId}`, title: '✅ Confirmar' },
          { id: `CONFIRM_NO_${solicitudId}`, title: '❌ Cancelar' },
        ],
      });

      await query(
        `UPDATE estados_chat_pasajero SET estado = 'ESPERANDO_CONFIRMACION'
         WHERE pasajero_id = $1 ORDER BY creado_en DESC LIMIT 1`,
        [pasajeroId]
      );
      return;
    }

    // Default: unknown state
    console.warn(`[WhatsApp] Unknown state: ${estado}`);
  } catch (error) {
    console.error('[WhatsApp] Error handling text message:', error);
    await WhatsAppService.enviarMensaje(from, `❌ Error procesando tu mensaje. Intenta nuevamente.`);
  }
}

// Handle button replies (confirmations, authorizations)
async function handleButtonReply(from: string, buttonId: string): Promise<void> {
  try {
    const phoneNormalized = from.replace(/^\+/, '');

    // Check if it's a confirmation (CONFIRM_SI_/CONFIRM_NO_)
    if (buttonId.startsWith('CONFIRM_SI_')) {
      const solicitudId = parseInt(buttonId.replace('CONFIRM_SI_', ''));

      // Update solicitud to pendiente_autorizacion
      const solicitudResult = await query(
        `UPDATE solicitudes_transporte SET estado = 'pendiente_autorizacion' WHERE id = $1 RETURNING *`,
        [solicitudId]
      );

      const sol = solicitudResult.rows[0];

      // Get pasajero
      const pasajeroResult = await query(
        `SELECT empresa_cliente_id FROM pasajeros WHERE id = $1`,
        [sol.pasajero_id]
      );

      const empresaClienteId = pasajeroResult.rows[0]?.empresa_cliente_id;

      // Get autorizador for this empresa
      if (empresaClienteId) {
        const autorizadorResult = await query(
          `SELECT telefono, nombre FROM usuarios WHERE empresa_cliente_id = $1 AND rol = 'autorizador' LIMIT 1`,
          [empresaClienteId]
        );

        if (autorizadorResult.rows[0]) {
          const autorizador = autorizadorResult.rows[0];

          // Get pasajero name
          const pasajeroNameResult = await query(
            `SELECT nombre FROM pasajeros WHERE id = $1`,
            [sol.pasajero_id]
          );

          const nombrePasajero = pasajeroNameResult.rows[0]?.nombre || 'Cliente';

          // Send authorization request
          await WhatsAppService.solicitarAutorizacion({
            telefonoAutorizador: autorizador.telefono,
            nombreEmpleado: nombrePasajero,
            tipoServicio: sol.tipo_servicio,
            direccionRecogida: sol.direccion_recogida,
            direccionDestino: sol.direccion_destino,
            fecha: sol.fecha_servicio,
            hora: sol.hora_servicio,
            numeroSolicitud: solicitudId,
          });
        }
      }

      await WhatsAppService.enviarMensaje(
        from,
        `✅ *Solicitud confirmada*\n\n` +
          `Tu solicitud está siendo procesada. Pronto te notificaremos el estado.`
      );

      // Reset state
      const pasajeroResult2 = await query(
        `SELECT id FROM pasajeros WHERE telefono = $1`,
        [phoneNormalized]
      );

      await query(
        `INSERT INTO estados_chat_pasajero (pasajero_id, estado) VALUES ($1, 'MENU')`,
        [pasajeroResult2.rows[0]?.id]
      );
      return;
    }

    if (buttonId.startsWith('CONFIRM_NO_')) {
      const solicitudId = parseInt(buttonId.replace('CONFIRM_NO_', ''));

      // Delete solicitud
      await query(`DELETE FROM solicitudes_transporte WHERE id = $1`, [solicitudId]);

      await WhatsAppService.enviarMensaje(
        from,
        `❌ *Solicitud cancelada*\n\n¿Deseas crear una nueva solicitud?`
      );

      // Reset state
      const pasajeroResult = await query(
        `SELECT id FROM pasajeros WHERE telefono = $1`,
        [phoneNormalized]
      );

      await query(
        `INSERT INTO estados_chat_pasajero (pasajero_id, estado) VALUES ($1, 'MENU')`,
        [pasajeroResult.rows[0]?.id]
      );
      return;
    }

    console.warn(`[WhatsApp] Unknown button ID: ${buttonId}`);
  } catch (error) {
    console.error('[WhatsApp] Error handling button reply:', error);
    await WhatsAppService.enviarMensaje(
      from,
      `❌ Error procesando tu respuesta. Intenta nuevamente.`
    );
  }
}

export default router;
