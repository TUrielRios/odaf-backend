/**
 * Script to test the WhatsApp Webhook locally.
 * Usage: node test-whatsapp-local.js "Hola"
 */
const axios = require('axios');

const message = process.argv[2] || 'Hola';
const phone = 'whatsapp:+5491168890924';

const data = new URLSearchParams();
data.append('From', phone);
data.append('Body', message);
data.append('To', 'whatsapp:+5491168890924');

async function test() {
  console.log(`Simulando mensaje de WhatsApp: "${message}" desde ${phone}`);
  try {
    const response = await axios.post('http://localhost:3000/api/whatsapp/webhook', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('--- Respuesta del Servidor ---');
    console.log('Status:', response.status);
    console.log('Body:', response.data);
    console.log('\n✅ Revisa los logs de tu consola donde corre el backend para ver el flujo.');
  } catch (error) {
    console.error('❌ Error al conectar con el backend local:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.log('\n💡 Asegúrate de que el backend esté corriendo en http://localhost:3000');
  }
}

test();
