/**
 * Service to manage WhatsApp conversation states in memory.
 * For production with multiple instances, use Redis or a database.
 */
class ConversationState {
  constructor() {
    this.states = new Map();
    // Default TTL for conversations: 1 hour
    this.ttl = 3600000;
  }

  /**
   * Get the current state for a phone number
   * @param {string} phone - The phone number
   * @returns {Object|null}
   */
  get(phone) {
    const data = this.states.get(phone);
    if (!data) return null;

    // Check if state expired
    if (Date.now() - data.lastUpdate > this.ttl) {
      this.states.delete(phone);
      return null;
    }

    return data;
  }

  /**
   * Set or update state for a phone number
   * @param {string} phone - The phone number
   * @param {string} step - Current step in the flow
   * @param {Object} data - Additional data accumulated
   */
  set(phone, step, data = {}) {
    const current = this.get(phone) || { data: {} };
    this.states.set(phone, {
      step,
      data: { ...current.data, ...data },
      lastUpdate: Date.now()
    });
  }

  /**
   * Clear state for a phone number
   * @param {string} phone - The phone number
   */
  clear(phone) {
    this.states.delete(phone);
  }

  /**
   * State Constants
   */
  static get STEPS() {
    return {
      START: 'START',
      AWAITING_DNI: 'AWAITING_DNI',
      AWAITING_PATIENT_NAME: 'AWAITING_PATIENT_NAME',
      AWAITING_PATIENT_LASTNAME: 'AWAITING_PATIENT_LASTNAME',
      AWAITING_PATIENT_DOB: 'AWAITING_PATIENT_DOB',
      AWAITING_PATIENT_GENDER: 'AWAITING_PATIENT_GENDER',
      SELECTING_SERVICE: 'SELECTING_SERVICE',
      SELECTING_PROFESIONAL: 'SELECTING_PROFESIONAL',
      SELECTING_DATE: 'SELECTING_DATE',
      SELECTING_TIME: 'SELECTING_TIME',
      CONFIRMING_BOOKING: 'CONFIRMING_BOOKING'
    };
  }
}

module.exports = new ConversationState();
