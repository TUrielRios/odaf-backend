/**
 * WhatsApp Notifications Service
 * Send WhatsApp notifications using Twilio WhatsApp Business API
 * 
 * IMPORTANT: For WhatsApp Business API, you need approved message templates
 * Create templates in Twilio Console: https://console.twilio.com/us1/develop/sms/overview
 */

const twilio = require("twilio");

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send a WhatsApp message notification
 * For Business API, messages must use approved templates or be in response to user messages
 * 
 * @param {string} to - Recipient phone number (format: +549...)
 * @param {string} body - Message content
 */
const enviarMensajeWhatsApp = async (to, body) => {
    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            body: body,
        });
        console.log("WhatsApp message sent:", message.sid);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error("Error sending WhatsApp message:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment confirmation notification
 * @param {Object} datos - Appointment data
 */
const enviarConfirmacionTurnoWhatsApp = async (datos) => {
    const {
        telefono,
        paciente_nombre,
        paciente_apellido,
        servicio_nombre,
        profesional_nombre,
        profesional_apellido,
        fecha,
        hora_inicio,
        hora_fin,
    } = datos;

    const fechaFormateada = new Date(fecha).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const mensaje = `✅ ¡Tu turno ha sido confirmado!

━━━━━━━━━━━━━━━
👤 Paciente: ${paciente_nombre} ${paciente_apellido}
🏥 Servicio: ${servicio_nombre}
👨‍⚕️ Profesional: ${profesional_nombre} ${profesional_apellido}
📅 Fecha: ${fechaFormateada}
🕐 Horario: ${hora_inicio} - ${hora_fin}
━━━━━━━━━━━━━━━

Te esperamos! 

ODAF - Centro Odontológico`;

    return await enviarMensajeWhatsApp(telefono, mensaje);
};

/**
 * Send appointment reminder notification (24hs before)
 * @param {Object} datos - Appointment data
 */
const enviarRecordatorioTurnoWhatsApp = async (datos) => {
    const {
        telefono,
        paciente_nombre,
        paciente_apellido,
        servicio_nombre,
        profesional_nombre,
        profesional_apellido,
        fecha,
        hora_inicio,
    } = datos;

    const fechaFormateada = new Date(fecha).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const mensaje = `⏰ RECORDATORIO

Tienes un turno mañana ${fechaFormateada} a las ${hora_inicio}

━━━━━━━━━━━━━━━
👤 Paciente: ${paciente_nombre} ${paciente_apellido}
🏥 Servicio: ${servicio_nombre}
👨‍⚕️ Profesional: ${profesional_nombre} ${profesional_apellido}
━━━━━━━━━━━━━━━

¿No puedes asistir? Responde CANCELAR para cancelar tu turno.

ODAF - Centro Odontológico`;

    return await enviarMensajeWhatsApp(telefono, mensaje);
};

/**
 * Send appointment cancellation notification
 * @param {Object} datos - Appointment data
 */
const enviarCancelacionTurnoWhatsApp = async (datos) => {
    const {
        telefono,
        paciente_nombre,
        paciente_apellido,
        fecha,
        hora_inicio,
    } = datos;

    const mensaje = `❌ Turno cancelado

━━━━━━━━━━━━━━━
👤 Paciente: ${paciente_nombre} ${paciente_apellido}
📅 Fecha: ${fecha}
🕐 Horario: ${hora_inicio}
━━━━━━━━━━━━━━━

Tu turno ha sido cancelado. Para reservar nuevamente, usa el bot de WhatsApp o contacta a la clínica.

ODAF - Centro Odontológico`;

    return await enviarMensajeWhatsApp(telefono, mensaje);
};

/**
 * Check if WhatsApp number is valid and can receive messages
 * @param {string} phoneNumber - Phone number to check
 */
const verificarNumeroWhatsApp = async (phoneNumber) => {
    try {
        // Normalize phone number
        let normalized = phoneNumber.replace(/\D/g, "");

        // Add country code if not present (Argentina: +54)
        if (normalized.length === 10) {
            normalized = "54" + normalized;
        }
        if (normalized.length === 11 && normalized.startsWith("0")) {
            normalized = "54" + normalized.substring(1);
        }

        return { valid: true, phoneNumber: `+${normalized}` };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

module.exports = {
    enviarMensajeWhatsApp,
    enviarConfirmacionTurnoWhatsApp,
    enviarRecordatorioTurnoWhatsApp,
    enviarCancelacionTurnoWhatsApp,
    verificarNumeroWhatsApp,
};
