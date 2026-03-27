# WhatsApp Business API - Message Templates

Para usar WhatsApp Business API con números de teléfono reales (no sandbox), necesitas crear **Message Templates** aprobados en Twilio Console.

## Pasos para crear templates en Twilio Console:

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Navega a **Messaging** > **Templates** (o busca "WhatsApp Templates")
3. Crea cada template siguiendo el formato exacto

---

## Templates requeridos:

### 1. Confirmación de Turno (appointment_confirmation)

**Nombre:** `appointment_confirmation`  
**Categoría:** `APPOINTMENT_UPDATE`  
**Idioma:** Español (es)

**Contenido:**
```
{{1}}, tu turno ha sido confirmado!

━━━━━━━━━━━━━━━
👤 Paciente: {{2}} {{3}}
🏥 Servicio: {{4}}
👨‍⚕️ Profesional: {{5}} {{6}}
📅 Fecha: {{7}}
🕐 Horario: {{8}} - {{9}}
━━━━━━━━━━━━━━━

Te esperamos! 

ODAF - Centro Odontológico
```

**Variables:**
- {{1}} - Saludo (ej: "Hola Juan")
- {{2}} - Nombre del paciente
- {{3}} - Apellido del paciente
- {{4}} - Nombre del servicio
- {{5}} - Nombre del profesional
- {{6}} - Apellido del profesional
- {{7}} - Fecha formateada
- {{8}} - Hora inicio
- {{9}} - Hora fin

---

### 2. Recordatorio de Turno (appointment_reminder)

**Nombre:** `appointment_reminder`  
**Categoría:** `APPOINTMENT_REMINDER`  
**Idioma:** Español (es)

**Contenido:**
```
⏰ RECORDATORIO

Tienes un turno mañana {{1}} a las {{2}}

━━━━━━━━━━━━━━━
👤 Paciente: {{3}} {{4}}
🏥 Servicio: {{5}}
👨‍⚕️ Profesional: {{6}} {{7}}
━━━━━━━━━━━━━━━

¿No puedes asistir? Responde CANCELAR para cancelar tu turno.

ODAF - Centro Odontológico
```

**Variables:**
- {{1}} - Fecha formateada
- {{2}} - Hora
- {{3}} - Nombre del paciente
- {{4}} - Apellido del paciente
- {{5}} - Nombre del servicio
- {{6}} - Nombre del profesional
- {{7}} - Apellido del profesional

---

### 3. Turno Cancelado (appointment_cancelled)

**Nombre:** `appointment_cancelled`  
**Categoría:** `APPOINTMENT_UPDATE`  
**Idioma:** Español (es)

**Contenido:**
```
 
```

**Variables:**
- {{1}} - Nombre del paciente
- {{2}} - Apellido del paciente
- {{3}} - Fecha
- {{4}} - Horario

---

## Cómo usar los templates en código:

Una vez aprobados los templates, puedes usarlos así:

```javascript
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Enviar usando template
await client.messages.create({
  from: 'MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Tu WhatsApp Business SID
  to: 'whatsapp:+549XXXXXXXXXX',
  contentSid: 'HXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // SID del template aprobado
  contentVariables: JSON.stringify({
    '1': 'Juan',
    '2': 'Pérez',
    // ... más variables
  })
});
```

---

## Alternativa: Usar Sandbox de Twilio

Si no quieres esperar la aprobación de templates, puedes usar el **Sandbox de Twilio**:

1. En Twilio Console, activa el Sandbox de WhatsApp
2. Añade tu número de teléfono al sandbox
3. Envía "join <palabra-clave>" al número sandbox

**Limitaciones del Sandbox:**
- Solo funciona con números registrados
- Los mensajes deben seguir las políticas de WhatsApp
- No puedes enviar mensajes proactivos (debes responder a un mensaje del usuario)

---

## Verificar estado de templates:

```bash
# Listar templates aprobados
curl -X GET "https://messaging.twilio.com/v1/WhatsApp/Templates" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

---

## Errores comunes:

| Error | Causa | Solución |
|--------|-------|----------|
| 63008 | Template no aprobado | Espera aprobación o usa sandbox |
| 63015 | Número no verificado | Verifica el número en Twilio |
| 63016 | Número no opted-in | Usuario debe enviar mensaje primero |
| 63023 | Contenido rechazado | Revisa políticas de WhatsApp |
