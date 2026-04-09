interface SendMessageParams {
  to: string; // phone number with country code, no +
  message: string;
}

interface ButtonMessage {
  to: string;
  bodyText: string;
  buttons: Array<{ id: string; title: string }>;
}

export class WhatsAppService {
  private static baseUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  private static headers = {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Clean phone number (remove +, spaces, 'whatsapp:')
  static cleanPhone(phone: string): string {
    return phone.replace(/whatsapp:|\+|\s/g, '').trim();
  }

  // Send plain text message
  static async enviarMensaje(to: string, message: string): Promise<void> {
    const cleanTo = this.cleanPhone(to);
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: { preview_url: false, body: message },
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[WhatsApp] Error enviando mensaje:', error);
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }
  }

  // Send interactive buttons message (for Yes/No authorization)
  static async enviarBotones(params: ButtonMessage): Promise<void> {
    const cleanTo = this.cleanPhone(params.to);
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: params.bodyText },
        action: {
          buttons: params.buttons.map((btn) => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title },
          })),
        },
      },
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[WhatsApp] Error enviando botones:', error);
    }
  }

  // Notify driver of new assignment
  static async notificarAsignacionConductor(params: {
    telefonoConductor: string;
    nombrePasajero: string;
    direccionRecogida: string;
    direccionDestino: string;
    fecha: string;
    hora: string;
    empresa: string;
    numeroSolicitud: number;
  }): Promise<void> {
    const mensaje =
      `🚗 *Nueva asignación de servicio*\n\n` +
      `📋 Solicitud #${params.numeroSolicitud}\n` +
      `👤 Pasajero: ${params.nombrePasajero}\n` +
      `🏢 Empresa: ${params.empresa}\n` +
      `📍 Recogida: ${params.direccionRecogida}\n` +
      `🏁 Destino: ${params.direccionDestino}\n` +
      `📅 Fecha: ${params.fecha}\n` +
      `🕐 Hora: ${params.hora}\n\n` +
      `Por favor confirme el inicio del servicio en el panel de conductor.`;

    await this.enviarMensaje(params.telefonoConductor, mensaje);
  }

  // Alert admin of new authorized request
  static async alertaNuevaSolicitud(params: {
    telefonoAdmin: string;
    nombrePasajero: string;
    empresa: string;
    tipoServicio: string;
    direccionRecogida: string;
    fecha: string;
    hora: string;
    numeroSolicitud: number;
  }): Promise<void> {
    const mensaje =
      `🔔 *Nueva solicitud autorizada*\n\n` +
      `📋 Solicitud #${params.numeroSolicitud}\n` +
      `👤 ${params.nombrePasajero} - ${params.empresa}\n` +
      `🚘 Tipo: ${params.tipoServicio}\n` +
      `📍 Recogida: ${params.direccionRecogida}\n` +
      `📅 ${params.fecha} a las ${params.hora}\n\n` +
      `Accede al panel para asignar conductor y vehículo.`;

    await this.enviarMensaje(params.telefonoAdmin, mensaje);
  }

  // Request authorization from autorizador (with interactive buttons)
  static async solicitarAutorizacion(params: {
    telefonoAutorizador: string;
    nombreEmpleado: string;
    tipoServicio: string;
    direccionRecogida: string;
    direccionDestino: string;
    fecha: string;
    hora: string;
    numeroSolicitud: number;
  }): Promise<void> {
    const bodyText =
      `🔐 *Solicitud de autorización #${params.numeroSolicitud}*\n\n` +
      `👤 ${params.nombreEmpleado}\n` +
      `🚘 ${params.tipoServicio}\n` +
      `📍 ${params.direccionRecogida} → ${params.direccionDestino}\n` +
      `📅 ${params.fecha} ${params.hora}\n\n` +
      `¿Autoriza este servicio?`;

    await this.enviarBotones({
      to: params.telefonoAutorizador,
      bodyText,
      buttons: [
        { id: `AUTH_SI_${params.numeroSolicitud}`, title: '✅ Autorizar' },
        { id: `AUTH_NO_${params.numeroSolicitud}`, title: '❌ Rechazar' },
      ],
    });
  }

  // Notify passenger of status update
  static async notificarPasajeroEstado(params: {
    telefonoPasajero: string;
    estado: 'autorizado' | 'rechazado' | 'asignado' | 'en_curso' | 'finalizado';
    detalles?: {
      conductor?: string;
      vehiculo?: string;
      placa?: string;
      motivoRechazo?: string;
    };
  }): Promise<void> {
    const mensajes: Record<string, string> = {
      autorizado: `✅ Tu solicitud ha sido *autorizada*. Pronto se te asignará un conductor.`,
      rechazado: `❌ Tu solicitud fue *rechazada*${params.detalles?.motivoRechazo ? `: ${params.detalles.motivoRechazo}` : '.'}`,
      asignado: `🚗 Se te asignó un conductor:\n👤 ${params.detalles?.conductor}\n🚘 ${params.detalles?.vehiculo} (${params.detalles?.placa})`,
      en_curso: `▶️ Tu servicio ha *iniciado*. ¡Buen viaje!`,
      finalizado: `🏁 Tu servicio ha *finalizado*. ¡Gracias por usar VIAJA COL!`,
    };

    await this.enviarMensaje(
      params.telefonoPasajero,
      mensajes[params.estado] || 'Estado actualizado.'
    );
  }

  // Alert about exceeded time
  static async alertaTiempoExcedido(params: {
    telefonoAdmin: string;
    numeroSolicitud: number;
    minutosExcedidos: number;
    conductor: string;
  }): Promise<void> {
    const mensaje =
      `⚠️ *Alerta: Tiempo excedido*\n\n` +
      `📋 Solicitud #${params.numeroSolicitud}\n` +
      `👤 Conductor: ${params.conductor}\n` +
      `⏱ Tiempo excedido: ${params.minutosExcedidos} minutos\n\n` +
      `Se generará cargo adicional automáticamente.`;

    await this.enviarMensaje(params.telefonoAdmin, mensaje);
  }
}
