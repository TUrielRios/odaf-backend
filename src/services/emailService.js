const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const emailStyles = `
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
  .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
  .header.cancel { background-color: #EF4444; }
  .header.reschedule { background-color: #F59E0B; }
  .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
  .info-box { background-color: #F3F4F6; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px; }
  .info-item { margin: 10px 0; }
  .info-label { font-weight: bold; color: #555; }
  .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
  .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
  .button.cancel { background-color: #EF4444; }
  .button.secondary { background-color: #6B7280; }
  .text-center { text-align: center; }
</style>
`

const enviarConfirmacionTurno = async (turnoData, pacienteEmail) => {
  try {
    const { paciente, profesional, servicio, fecha, hora_inicio, hora_fin, turnoId } = turnoData

    const mailOptions = {
      from: `"ODAF Odontologia" <${process.env.EMAIL_USER}>`,
      to: pacienteEmail,
      subject: "Confirmacion de Turno - ODAF",
      html: `
<!DOCTYPE html>
<html>
<head>${emailStyles}</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Turno Confirmado</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
      <p>Tu turno ha sido reservado exitosamente. A continuacion, los detalles:</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">Fecha:</span> ${formatearFecha(fecha)}</div>
        <div class="info-item"><span class="info-label">Horario:</span> ${hora_inicio} - ${hora_fin}</div>
        <div class="info-item"><span class="info-label">Profesional:</span> ${profesional.nombre} ${profesional.apellido}${profesional.especialidad ? ` - ${profesional.especialidad}` : ""}</div>
        <div class="info-item"><span class="info-label">Servicio:</span> ${servicio.nombre}</div>
      </div>
      
      <p><strong>Recordatorios:</strong></p>
      <ul>
        <li>Por favor, llegá 10 minutos antes de tu turno</li>
        <li>Si necesitas cancelar, hacerlo con al menos 24hs de anticipacion</li>
        <li>Trae tu DNI y credencial de obra social (si corresponde)</li>
      </ul>
      
      <div class="text-center">
        <a href="${FRONTEND_URL}/paciente/turnos/${turnoId}/cancelar" class="button cancel">Cancelar Turno</a>
        <a href="${FRONTEND_URL}/paciente/login" class="button secondary">Ver en Mi Portal</a>
      </div>
      
      <div class="footer">
        <p>Este es un mensaje automatico.</p>
        <p>ODAF - Sistema de Gestion de Turnos</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email de confirmacion enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error al enviar email de confirmacion:", error)
    return { success: false, error: error.message }
  }
}

const enviarCancelacionTurno = async (turnoData, pacienteEmail) => {
  try {
    const { paciente, profesional, servicio, fecha, hora_inicio } = turnoData

    const mailOptions = {
      from: `"ODAF Odontologia" <${process.env.EMAIL_USER}>`,
      to: pacienteEmail,
      subject: "Turno Cancelado - ODAF",
      html: `
<!DOCTYPE html>
<html>
<head>${emailStyles}</head>
<body>
  <div class="container">
    <div class="header cancel">
      <h1>Turno Cancelado</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
      <p>Tu turno ha sido cancelado exitosamente. A continuacion, los datos del turno cancelado:</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">Fecha:</span> ${formatearFecha(fecha)}</div>
        <div class="info-item"><span class="info-label">Horario:</span> ${hora_inicio}</div>
        <div class="info-item"><span class="info-label">Profesional:</span> ${profesional.nombre} ${profesional.apellido}</div>
        <div class="info-item"><span class="info-label">Servicio:</span> ${servicio.nombre}</div>
      </div>
      
      <p>Si deseas reservar un nuevo turno, puedes hacerlo facilmente desde nuestro sistema online.</p>
      
      <div class="text-center">
        <a href="${FRONTEND_URL}/" class="button">Reservar Nuevo Turno</a>
      </div>
      
      <div class="footer">
        <p>Este es un mensaje automatico.</p>
        <p>ODAF - Sistema de Gestion de Turnos</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email de cancelacion enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error al enviar email de cancelacion:", error)
    return { success: false, error: error.message }
  }
}

const enviarReprogramacionTurno = async (turnoData, pacienteEmail, fechaAnterior) => {
  try {
    const { paciente, profesional, servicio, fecha, hora_inicio, hora_fin, turnoId } = turnoData

    const mailOptions = {
      from: `"ODAF Odontologia" <${process.env.EMAIL_USER}>`,
      to: pacienteEmail,
      subject: "Turno Reprogramado - ODAF",
      html: `
<!DOCTYPE html>
<html>
<head>${emailStyles}</head>
<body>
  <div class="container">
    <div class="header reschedule">
      <h1>Turno Reprogramado</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
      <p>Tu turno ha sido reprogramado exitosamente. Aqui estan los nuevos datos:</p>
      
      <div class="info-box" style="border-left-color: #F59E0B;">
        <p style="color: #EF4444; text-decoration: line-through;"><strong>Fecha anterior:</strong> ${formatearFecha(fechaAnterior)}</p>
        <p style="color: #10B981;"><strong>Nueva fecha:</strong> ${formatearFecha(fecha)}</p>
      </div>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">Fecha:</span> ${formatearFecha(fecha)}</div>
        <div class="info-item"><span class="info-label">Horario:</span> ${hora_inicio} - ${hora_fin}</div>
        <div class="info-item"><span class="info-label">Profesional:</span> ${profesional.nombre} ${profesional.apellido}${profesional.especialidad ? ` - ${profesional.especialidad}` : ""}</div>
        <div class="info-item"><span class="info-label">Servicio:</span> ${servicio.nombre}</div>
      </div>
      
      <div class="text-center">
        <a href="${FRONTEND_URL}/paciente/turnos/${turnoId}" class="button">Ver Turno</a>
      </div>
      
      <div class="footer">
        <p>Este es un mensaje automatico.</p>
        <p>ODAF - Sistema de Gestion de Turnos</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email de reprogramacion enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error al enviar email de reprogramacion:", error)
    return { success: false, error: error.message }
  }
}

module.exports = {
  enviarConfirmacionTurno,
  enviarCancelacionTurno,
  enviarReprogramacionTurno,
}
