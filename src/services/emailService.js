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
  if (!fecha) return ""
  let dateStr = fecha
  if (fecha instanceof Date) {
    dateStr = fecha.toISOString().split('T')[0]
  } else if (typeof fecha === 'string' && fecha.includes('T')) {
    dateStr = fecha.split('T')[0]
  }
  return new Date(dateStr + 'T12:00:00').toLocaleDateString("es-AR", {
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

const enviarTurnoPendiente = async (turnoData, pacienteEmail) => {
  try {
    const { paciente, profesional, servicio, fecha, hora_inicio, hora_fin } = turnoData

    const mailOptions = {
      from: `"ODAF Odontologia" <${process.env.EMAIL_USER}>`,
      to: pacienteEmail,
      subject: "Turno Recibido (Pendiente de Aprobación) - ODAF",
      html: `
<!DOCTYPE html>
<html>
<head>${emailStyles}</head>
<body>
  <div class="container">
    <div class="header reschedule" style="background-color: #F59E0B;">
      <h1>Turno en Revisión</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
      <p>Hemos recibido tu solicitud de turno. Tu reserva se encuentra <strong>pendiente de aprobación</strong> por parte de nuestro equipo médico.</p>
      
      <div class="info-box" style="border-left-color: #F59E0B;">
        <div class="info-item"><span class="info-label">Fecha:</span> ${formatearFecha(fecha)}</div>
        <div class="info-item"><span class="info-label">Horario:</span> ${hora_inicio} - ${hora_fin}</div>
        <div class="info-item"><span class="info-label">Profesional:</span> ${profesional.nombre} ${profesional.apellido}</div>
        <div class="info-item"><span class="info-label">Servicio:</span> ${servicio.nombre}</div>
      </div>
      
      <p><strong>¿Qué sigue?</strong></p>
      <p>Una vez que confirmemos tu disponibilidad en la agenda, recibirás un nuevo correo confirmando definitivamente tu turno con todas las indicaciones necesarias.</p>
      
      <div class="footer">
        <p>Este es un mensaje automático.</p>
        <p>ODAF - Centro Odontológico</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email de turno pendiente enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error al enviar email de turno pendiente:", error)
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

const enviarRecordatorioTurno = async (turnoData, pacienteEmail, customTemplate = null) => {
  try {
    const { paciente, profesional, servicio, fecha, hora_inicio, hora_fin } = turnoData

    // Si hay un template personalizado, reemplazar variables
    let contenidoPersonalizado = ""
    if (customTemplate) {
      contenidoPersonalizado = customTemplate
        .replace(/\{nombre\}/g, paciente.nombre)
        .replace(/\{apellido\}/g, paciente.apellido)
        .replace(/\{fecha\}/g, formatearFecha(fecha))
        .replace(/\{hora_inicio\}/g, hora_inicio)
        .replace(/\{hora_fin\}/g, hora_fin || "")
        .replace(/\{profesional\}/g, `${profesional.nombre} ${profesional.apellido}`)
        .replace(/\{servicio\}/g, servicio.nombre)
    }

    const mailOptions = {
      from: `"ODAF Odontologia" <${process.env.EMAIL_USER}>`,
      to: pacienteEmail,
      subject: "Recordatorio de Turno - ODAF",
      html: `
<!DOCTYPE html>
<html>
<head>${emailStyles}</head>
<body>
  <div class="container">
    <div class="header" style="background-color: #3B82F6;">
      <h1>Recordatorio de Turno</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
      ${customTemplate
        ? `<p>${contenidoPersonalizado}</p>`
        : `<p>Te recordamos que tenés un turno programado. A continuación, los detalles:</p>`
      }
      
      <div class="info-box" style="border-left-color: #3B82F6;">
        <div class="info-item"><span class="info-label">Fecha:</span> ${formatearFecha(fecha)}</div>
        <div class="info-item"><span class="info-label">Horario:</span> ${hora_inicio}${hora_fin ? ` - ${hora_fin}` : ""}</div>
        <div class="info-item"><span class="info-label">Profesional:</span> ${profesional.nombre} ${profesional.apellido}${profesional.especialidad ? ` - ${profesional.especialidad}` : ""}</div>
        <div class="info-item"><span class="info-label">Servicio:</span> ${servicio.nombre}</div>
      </div>
      
      <p><strong>Recordatorios:</strong></p>
      <ul>
        <li>Por favor, llegá 10 minutos antes de tu turno</li>
        <li>Si necesitás cancelar, hacelo con al menos 24hs de anticipación</li>
        <li>Traé tu DNI y credencial de obra social (si corresponde)</li>
      </ul>

      <div style="margin-top: 25px; border-top: 1px solid #E5E7EB; padding-top: 15px;">
        <p style="margin: 0; font-weight: bold; color: #1E3A8A; font-size: 15px;">¡Te esperamos!</p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #4B5563; line-height: 1.5;">
          Tel: 7711-5716<br/>
          Whatsaap 1140483693<br/>
          2 de Mayo 2930 Lanus Oeste
        </p>
      </div>
      
      <div class="footer">
        <p>ODAF - Centro Odontológico</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email de recordatorio enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error al enviar email de recordatorio:", error)
    return { success: false, error: error.message }
  }
}

const generarPreviewRecordatorio = (turnoData, customTemplate = null) => {
  const { paciente, profesional, servicio, fecha, hora_inicio, hora_fin } = turnoData

  let contenidoPersonalizado = ""
  if (customTemplate) {
    contenidoPersonalizado = customTemplate
      .replace(/\{nombre\}/g, paciente.nombre)
      .replace(/\{apellido\}/g, paciente.apellido)
      .replace(/\{fecha\}/g, formatearFecha(fecha))
      .replace(/\{hora_inicio\}/g, hora_inicio)
      .replace(/\{hora_fin\}/g, hora_fin || "")
      .replace(/\{profesional\}/g, `${profesional.nombre} ${profesional.apellido}`)
      .replace(/\{servicio\}/g, servicio.nombre)
  }

  return `
<!DOCTYPE html>
<html>
<head>${emailStyles}</head>
<body>
  <div class="container">
    <div class="header" style="background-color: #3B82F6;">
      <h1>Recordatorio de Turno</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
      ${customTemplate
        ? `<p>${contenidoPersonalizado}</p>`
        : `<p>Te recordamos que tenés un turno programado. A continuación, los detalles:</p>`
      }
      
      <div class="info-box" style="border-left-color: #3B82F6;">
        <div class="info-item"><span class="info-label">Fecha:</span> ${formatearFecha(fecha)}</div>
        <div class="info-item"><span class="info-label">Horario:</span> ${hora_inicio}${hora_fin ? ` - ${hora_fin}` : ""}</div>
        <div class="info-item"><span class="info-label">Profesional:</span> ${profesional.nombre} ${profesional.apellido}${profesional.especialidad ? ` - ${profesional.especialidad}` : ""}</div>
        <div class="info-item"><span class="info-label">Servicio:</span> ${servicio.nombre}</div>
      </div>
      
      <p><strong>Recordatorios:</strong></p>
      <ul>
        <li>Por favor, llegá 10 minutos antes de tu turno</li>
        <li>Si necesitás cancelar, hacelo con al menos 24hs de anticipación</li>
        <li>Traé tu DNI y credencial de obra social (si corresponde)</li>
      </ul>

      <div style="margin-top: 25px; border-top: 1px solid #E5E7EB; padding-top: 15px;">
        <p style="margin: 0; font-weight: bold; color: #1E3A8A; font-size: 15px;">¡Te esperamos!</p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #4B5563; line-height: 1.5;">
          Tel: 7711-5716<br/>
          Whatsaap 1140483693<br/>
          2 de Mayo 2930 Lanus Oeste
        </p>
      </div>
      
      <div class="footer">
        <p>ODAF - Centro Odontológico</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

module.exports = {
  enviarConfirmacionTurno,
  enviarCancelacionTurno,
  enviarReprogramacionTurno,
  enviarRecordatorioTurno,
  enviarTurnoPendiente,
  generarPreviewRecordatorio,
}
