const { Paciente, Servicio, Profesional, Turno, ProfesionalServicio } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Service to handle business logic for WhatsApp booking.
 */
class WhatsAppService {
  /**
   * Find a patient by document number
   */
  async findPatientByDocument(numero_documento) {
    return await Paciente.findOne({ where: { numero_documento } });
  }

  /**
   * Create a new patient from collected data
   */
  async createPatient(data) {
    return await Paciente.create({
      nombre: data.nombre,
      apellido: data.apellido,
      tipo_documento: 'DNI',
      numero_documento: data.numero_documento,
      fecha_nacimiento: data.fecha_nacimiento,
      sexo: data.sexo,
      telefono: data.telefono,
      tipo_facturacion: 'B',
      condicion: 'Activo'
    });
  }

  /**
   * List available services
   */
  async listServices() {
    return await Servicio.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });
  }

  /**
   * List professionals for a specific service
   */
  async listProfessionalsByService(servicio_id) {
    const profServs = await ProfesionalServicio.findAll({
      where: { servicio_id },
      include: [{ 
        model: Profesional, 
        as: 'profesional', // Matches ProfesionalServicio model definition
        attributes: ['id', 'nombre', 'apellido'] 
      }]
    });
    
    if (profServs.length > 0) {
      return profServs.map(ps => ps.profesional);
    }

    // Fallback: if no specific association, list all active professionals
    return await Profesional.findAll({
      attributes: ['id', 'nombre', 'apellido'],
      order: [['apellido', 'ASC']]
    });
  }

  /**
   * Get available time slots for a professional and date
   */
  async getAvailability(profesional_id, fecha) {
    const baseSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    const existingTurnos = await Turno.findAll({
      where: {
        profesional_id,
        fecha,
        estado: { [Op.notIn]: ['Cancelado', 'Ausente'] }
      },
      attributes: ['hora_inicio']
    });

    const bookedHours = existingTurnos.map(t => t.hora_inicio.substring(0, 5));
    
    // Also filter slots that are in the past if date is today
    const now = moment();
    const isToday = moment(fecha).isSame(now, 'day');
    
    return baseSlots.filter(s => {
      if (bookedHours.includes(s)) return false;
      if (isToday) {
        const slotTime = moment(`${fecha} ${s}`, 'YYYY-MM-DD HH:mm');
        return slotTime.isAfter(now.add(1, 'hour')); // At least 1 hour in advance
      }
      return true;
    });
  }

  /**
   * Check if patient already has a turno this month
   */
  async hasTurnoThisMonth(paciente_id) {
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

    const existing = await Turno.findOne({
      where: {
        paciente_id,
        fecha: {
          [Op.between]: [startOfMonth, endOfMonth]
        },
        estado: { [Op.notIn]: ['Cancelado', 'Ausente'] }
      }
    });

    return !!existing;
  }

  /**
   * Create the actual turno
   */
  async confirmBooking(data) {
    const hora_inicio = data.hora;
    const hora_fin = moment(data.hora, 'HH:mm').add(30, 'minutes').format('HH:mm');

    return await Turno.create({
      paciente_id: data.paciente_id,
      profesional_id: data.profesional_id,
      servicio_id: data.servicio_id,
      fecha: data.fecha,
      hora_inicio,
      hora_fin,
      estado: 'Confirmado por Whatsapp'
    });
  }
}

module.exports = new WhatsAppService();
