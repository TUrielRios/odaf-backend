/**
 * Script de prueba para verificar el envío de emails
 * Ejecutar con: node src/test/testEmail.js
 */

require('dotenv').config();
const { enviarConfirmacionTurno } = require('../services/emailService');

const testEmailSending = async () => {
    console.log('🧪 Iniciando prueba de envío de email...\n');

    // Verificar variables de entorno
    console.log('📋 Configuración de email (Brevo):');
    console.log(`   BREVO_API_KEY: ${process.env.BREVO_API_KEY ? '***configurada***' : '❌ NO CONFIGURADA'}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);
    console.log(`   EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || 'ODAF Odontologia'}\n`);

    const emailDestino = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    if (!process.env.BREVO_API_KEY || !emailDestino) {
        console.error('❌ Error: La configuración de Brevo no está completa en el archivo .env');
        console.log('\n💡 Asegúrate de configurar:');
        console.log('   - BREVO_API_KEY');
        console.log('   - EMAIL_FROM (remitente verificado en Brevo)');
        console.log('   - EMAIL_FROM_NAME (opcional)');
        process.exit(1);
    }

    // Datos de prueba
    const turnoDataPrueba = {
        paciente: {
            nombre: 'Juan',
            apellido: 'Pérez',
        },
        profesional: {
            nombre: 'Dra. María',
            apellido: 'González',
            especialidad: 'Odontología General'
        },
        servicio: {
            nombre: 'Consulta General'
        },
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '10:00',
        hora_fin: '11:00'
    };

    console.log('📧 Intentando enviar email de prueba...');
    console.log(`   Destinatario: ${emailDestino}\n`);

    try {
        const result = await enviarConfirmacionTurno(turnoDataPrueba, emailDestino);

        if (result.success) {
            console.log('✅ ¡Email enviado exitosamente!');
            console.log(`   Message ID: ${result.messageId}`);
            console.log('\n✨ El servicio de email está funcionando correctamente.');
            console.log('   Verifica tu bandeja de entrada (y spam) para el email de prueba.');
        } else {
            console.error('❌ Error al enviar el email:', result.error);
        }
    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
        console.error('\n🔍 Posibles causas:');
        console.error('   1. BREVO_API_KEY incorrecta o revocada');
        console.error('   2. El remitente (EMAIL_FROM) no está verificado en Brevo');
        console.error('   3. Cuenta de Brevo no activada o límite diario alcanzado');
        console.error('\n💡 Para Brevo:');
        console.error('   - Verifica el remitente en Senders, Domains & Dedicated IPs > Senders');
        console.error('   - Genera/revisa la API key en Settings > SMTP & API > API Keys');
    }
};

testEmailSending();
