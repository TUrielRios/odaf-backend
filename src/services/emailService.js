const nodemailer = require("nodemailer");

// Configurar transportador de email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Envía un email de confirmación de turno al paciente
 * @param {Object} turnoData - Datos del turno
 * @param {string} pacienteEmail - Email del paciente
 */
const enviarConfirmacionTurno = async (turnoData, pacienteEmail) => {
    try {
        const { paciente, profesional, servicio, fecha, hora_inicio, hora_fin } = turnoData;

        // Formatear fecha
        const fechaFormateada = new Date(fecha).toLocaleDateString("es-AR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const mailOptions = {
            from: `"Sistema de Turnos ODAF" <${process.env.EMAIL_USER}>`,
            to: pacienteEmail,
            subject: "✅ Confirmación de Turno - ODAF",
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .info-box {
              background-color: #f0f8ff;
              border-left: 4px solid #4CAF50;
              padding: 15px;
              margin: 20px 0;
            }
            .info-item {
              margin: 10px 0;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #777;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Turno Confirmado!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
              
              <p>Tu turno ha sido reservado exitosamente. A continuación, los detalles:</p>
              
              <div class="info-box">
                <div class="info-item">
                  <span class="info-label">📅 Fecha:</span> ${fechaFormateada}
                </div>
                <div class="info-item">
                  <span class="info-label">🕐 Horario:</span> ${hora_inicio} - ${hora_fin}
                </div>
                <div class="info-item">
                  <span class="info-label">👨‍⚕️ Profesional:</span> ${profesional.nombre} ${profesional.apellido}${profesional.especialidad ? ` - ${profesional.especialidad}` : ""}
                </div>
                <div class="info-item">
                  <span class="info-label">🦷 Servicio:</span> ${servicio.nombre}
                </div>
              </div>
              
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Por favor, llegá 10 minutos antes de tu turno</li>
                <li>Si necesitás cancelar o reprogramar, contactanos con al menos 24hs de anticipación</li>
                <li>Traé tu DNI y credencial de obra social (si corresponde)</li>
              </ul>
              
              <p>¡Te esperamos!</p>
              
              <div class="footer">
                <p>Este es un mensaje automático, por favor no respondas a este email.</p>
                <p>ODAF - Sistema de Gestión de Turnos</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email de confirmación enviado:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Error al enviar email de confirmación:", error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    enviarConfirmacionTurno,
};
