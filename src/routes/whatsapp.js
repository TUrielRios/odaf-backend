const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Webhook for Twilio WhatsApp
router.post('/webhook', whatsappController.handleIncomingMessage);

// Test route
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'WhatsApp route is active' });
});

module.exports = router;
