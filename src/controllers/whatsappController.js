const twilio = require('twilio');
const whatsappService = require('../services/whatsappService');
const conversationState = require('../services/conversationState');
const moment = require('moment');
require('moment/locale/es'); // Configure Spanish locale
moment.locale('es');

// Twilio Setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

console.log(`WhatsApp Controller Initialized with Number: ${fromNumber}`);

const STEPS = conversationState.constructor.STEPS;

/**
 * Controller to handle WhatsApp messages from Twilio
 */
const handleIncomingMessage = async (req, res) => {
  console.log('--- WhatsApp Incoming Webhook ---');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  const { From, Body, To } = req.body;
  const userPhone = From;
  const userInput = Body ? Body.trim() : '';

  console.log(`From: ${userPhone}, To: ${To}, Input: "${userInput}"`);

  try {
    let state = conversationState.get(userPhone);
    console.log(`Current State: ${state ? JSON.stringify(state) : 'None'}`);
    
    // Handle global commands
    if (userInput.toUpperCase() === 'CANCELAR' || userInput.toUpperCase() === 'INICIO') {
      console.log('Global command detected: CANCELAR/INICIO');
      conversationState.clear(userPhone);
      return sendResponse(userPhone, "Operación cancelada. Escribe 'Turno' para comenzar de nuevo.");
    }

    if (!state) {
      if (userInput.toLowerCase().includes('turno') || userInput.toLowerCase().includes('hola')) {
        console.log('Starting new booking flow');
        conversationState.set(userPhone, STEPS.AWAITING_DNI);
        return sendResponse(userPhone, "👋 ¡Hola! Bienvenido al sistema de turnos de ODAF. \n\nPara comenzar, por favor ingresa tu número de DNI (solo números).");
      }
      console.log('No state and input not matching "turno/hola"');
      return sendResponse(userPhone, "Bienvenido a ODAF. Escribe 'Turno' para reservar una cita.");
    }

    console.log(`Processing Step: ${state.step}`);

    // State Machine Dispatcher
    switch (state.step) {
      case STEPS.AWAITING_DNI:
        console.log('Step: AWAITING_DNI');
        return await handleDNIInput(userPhone, userInput);
      
      case STEPS.AWAITING_PATIENT_NAME:
        console.log('Step: AWAITING_PATIENT_NAME');
        conversationState.set(userPhone, STEPS.AWAITING_PATIENT_LASTNAME, { nombre: userInput });
        return sendResponse(userPhone, "Gracias. Ahora ingresa tu APELLIDO:");

      case STEPS.AWAITING_PATIENT_LASTNAME:
        console.log('Step: AWAITING_PATIENT_LASTNAME');
        conversationState.set(userPhone, STEPS.AWAITING_PATIENT_DOB, { apellido: userInput });
        return sendResponse(userPhone, "Ingresa tu FECHA DE NACIMIENTO (formato AAAA-MM-DD):");

      case STEPS.AWAITING_PATIENT_DOB:
        console.log('Step: AWAITING_PATIENT_DOB');
        if (!moment(userInput, 'YYYY-MM-DD', true).isValid()) {
          console.log('Invalid DOB format received');
          return sendResponse(userPhone, "Formato inválido. Por favor usa AAAA-MM-DD (ej: 1990-05-25):");
        }
        conversationState.set(userPhone, STEPS.AWAITING_PATIENT_GENDER, { fecha_nacimiento: userInput });
        return sendResponse(userPhone, "Finalmente, indica tu SEXO:\n1. Masculino\n2. Femenino\n3. Otro\n(Responde con el número)");

      case STEPS.AWAITING_PATIENT_GENDER:
        console.log('Step: AWAITING_PATIENT_GENDER');
        const genderMap = { '1': 'Masculino', '2': 'Femenino', '3': 'Otro' };
        if (!genderMap[userInput]) {
          console.log('Invalid gender selection');
          return sendResponse(userPhone, "Por favor selecciona 1, 2 o 3.");
        }
        
        const patientData = { ...state.data, sexo: genderMap[userInput], telefono: userPhone.replace('whatsapp:', '') };
        console.log('Creating new patient with data:', JSON.stringify(patientData));
        const newPatient = await whatsappService.createPatient(patientData);
        conversationState.set(userPhone, STEPS.SELECTING_SERVICE, { paciente_id: newPatient.id, patientName: `${newPatient.nombre} ${newPatient.apellido}` });
        return await showServices(userPhone);

      case STEPS.SELECTING_SERVICE:
        console.log('Step: SELECTING_SERVICE');
        return await handleServiceSelection(userPhone, userInput, state);

      case STEPS.SELECTING_PROFESIONAL:
        console.log('Step: SELECTING_PROFESIONAL');
        return await handleProfessionalSelection(userPhone, userInput, state);

      case STEPS.SELECTING_DATE:
        console.log('Step: SELECTING_DATE');
        return await handleDateSelection(userPhone, userInput, state);

      case STEPS.SELECTING_TIME:
        console.log('Step: SELECTING_TIME');
        return await handleTimeSelection(userPhone, userInput, state);

      case STEPS.CONFIRMING_BOOKING:
        console.log('Step: CONFIRMING_BOOKING');
        return await handleFinalConfirmation(userPhone, userInput, state);

      default:
        console.log(`Unknown step: ${state.step}`);
        conversationState.clear(userPhone);
        return sendResponse(userPhone, "Lo siento, ocurrió un error en el flujo. Escribe 'Turno' para empezar de nuevo.");
    }

  } catch (error) {
    console.error('CRITICAL: WhatsApp Controller Error:', error);
    return sendResponse(userPhone, "Ocurrió un error inesperado en el servidor. Por favor intenta más tarde.");
  } finally {
    console.log('--- End of Webhook Processing ---');
    res.set('Content-Type', 'text/xml');
    res.status(200).send('<Response></Response>');
  }
};

// --- Step Handlers ---

const handleDNIInput = async (phone, dni) => {
  if (!/^\d+$/.test(dni)) return sendResponse(phone, "DNI inválido. Por favor ingresa solo números:");
  
  const patient = await whatsappService.findPatientByDocument(dni);
  if (patient) {
    // Check monthly limit
    const hasLimit = await whatsappService.hasTurnoThisMonth(patient.id);
    if (hasLimit) {
      conversationState.clear(phone);
      return sendResponse(phone, `Hola ${patient.nombre}, ya tienes un turno reservado este mes. Por políticas de la clínica, solo se permite un turno mensual. ¡Gracias!`);
    }

    conversationState.set(phone, STEPS.SELECTING_SERVICE, { 
      paciente_id: patient.id, 
      patientName: `${patient.nombre} ${patient.apellido}`,
      numero_documento: dni 
    });
    return await showServices(phone);
  } else {
    conversationState.set(phone, STEPS.AWAITING_PATIENT_NAME, { numero_documento: dni });
    return sendResponse(phone, "No te encontramos en nuestra base. Vamos a registrarte.\n\nPor favor, ingresa tu NOMBRE:");
  }
};

const showServices = async (phone) => {
  const services = await whatsappService.listServices();
  let message = "Selecciona el servicio que necesitas:\n\n";
  services.forEach((s, i) => {
    message += `${i + 1}. ${s.nombre}\n`;
  });
  conversationState.set(phone, STEPS.SELECTING_SERVICE, { availableServices: services.map(s => s.id) });
  return sendResponse(phone, message);
};

const handleServiceSelection = async (phone, input, state) => {
  const index = parseInt(input) - 1;
  const services = state.data.availableServices;
  if (isNaN(index) || index < 0 || index >= services.length) return sendResponse(phone, "Selección inválida. Elige un número de la lista.");

  const serviceId = services[index];
  const professionals = await whatsappService.listProfessionalsByService(serviceId);
  
  let message = "Selecciona un profesional:\n\n";
  professionals.forEach((p, i) => {
    message += `${i + 1}. ${p.nombre} ${p.apellido}\n`;
  });
  
  conversationState.set(phone, STEPS.SELECTING_PROFESIONAL, { 
    servicio_id: serviceId, 
    availableProfessionals: professionals.map(p => ({ id: p.id, name: `${p.nombre} ${p.apellido}` })) 
  });
  return sendResponse(phone, message);
};

const handleProfessionalSelection = async (phone, input, state) => {
  const index = parseInt(input) - 1;
  const pros = state.data.availableProfessionals;
  if (isNaN(index) || index < 0 || index >= pros.length) return sendResponse(phone, "Selección inválida.");

  const selectedPro = pros[index];
  
  // Offer next 5 available days (excluding Sundays)
  let message = "¿Para cuándo deseas tu turno?:\n\n";
  const dates = [];
  let current = moment();
  while (dates.length < 5) {
    current.add(1, 'day');
    if (current.day() !== 0) { // No Sundays
      dates.push(current.format('YYYY-MM-DD'));
      const dayName = current.format('dddd');
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      message += `${dates.length}. ${capitalizedDay} ${current.format('DD/MM')}\n`;
    }
  }

  conversationState.set(phone, STEPS.SELECTING_DATE, { 
    profesional_id: selectedPro.id, 
    proName: selectedPro.name,
    availableDates: dates 
  });
  return sendResponse(phone, message);
};

const handleDateSelection = async (phone, input, state) => {
  const index = parseInt(input) - 1;
  const dates = state.data.availableDates;
  if (isNaN(index) || index < 0 || index >= dates.length) return sendResponse(phone, "Selección inválida.");

  const selectedDate = dates[index];
  const slots = await whatsappService.getAvailability(state.data.profesional_id, selectedDate);

  if (slots.length === 0) {
    return sendResponse(phone, "Lo siento, no hay horarios disponibles para ese día. Por favor elige otra fecha.");
  }

  let message = `Horarios disponibles para el ${moment(selectedDate).format('DD/MM')}:\n\n`;
  slots.forEach((s, i) => {
    message += `${i + 1}. ${s}\n`;
  });

  conversationState.set(phone, STEPS.SELECTING_TIME, { 
    fecha: selectedDate, 
    availableSlots: slots 
  });
  return sendResponse(phone, message);
};

const handleTimeSelection = async (phone, input, state) => {
  const index = parseInt(input) - 1;
  const slots = state.data.availableSlots;
  if (isNaN(index) || index < 0 || index >= slots.length) return sendResponse(phone, "Selección inválida.");

  const selectedTime = slots[index];
  
  const summary = `📋 *Resumen de tu reserva:*\n\n` +
    `👤 Paciente: ${state.data.patientName}\n` +
    `👨‍⚕️ Profesional: ${state.data.proName}\n` +
    `📅 Fecha: ${moment(state.data.fecha).format('DD/MM/YYYY')}\n` +
    `🕐 Hora: ${selectedTime}\n\n` +
    `¿Confirmas la reserva? Responde *SÍ* o *NO*.`;

  conversationState.set(phone, STEPS.CONFIRMING_BOOKING, { hora: selectedTime });
  return sendResponse(phone, summary);
};

const handleFinalConfirmation = async (phone, input, state) => {
  console.log(`Final confirmation input: "${input}"`);
  if (input.toUpperCase() === 'SÍ' || input.toUpperCase() === 'SI' || input.toUpperCase() === 'CONFIRMAR') {
    console.log('User confirmed. Proceeding to book.');
    const turno = await whatsappService.confirmBooking(state.data);
    console.log('Turno created success:', turno.id);
    conversationState.clear(phone);
    return sendResponse(phone, `✅ ¡Excelente! Tu turno ha sido confirmado.\n\nTe esperamos el ${moment(state.data.fecha).format('DD/MM')} a las ${state.data.hora}.\n\n¡Gracias por confiar en ODAF!`);
  } else if (input.toUpperCase() === 'NO') {
    console.log('User declined. Clearing state.');
    conversationState.clear(phone);
    return sendResponse(phone, "Reserva cancelada. Puedes empezar de nuevo cuando quieras escribiendo 'Turno'.");
  } else {
    console.log('Ambiguous confirmation input');
    return sendResponse(phone, "Por favor responde *SÍ* para confirmar o *NO* para cancelar.");
  }
};

// --- Helper Functions ---

const sendResponse = async (to, message) => {
  console.log(`Sending WhatsApp response to ${to}...`);
  console.log(`Message Content: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    console.log(`Message sent! SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('TWILIO SEND ERROR:', error.message);
    if (error.code) console.error(`Error Code: ${error.code}`);
    throw error; // Rethrow to be caught by the main try-catch
  }
};

module.exports = {
  handleIncomingMessage
};
