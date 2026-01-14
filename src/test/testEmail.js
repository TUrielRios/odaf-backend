/**
 * Script de prueba para verificar el envío de emails
 * Ejecutar con: node src/test/testEmail.js
 */

require('dotenv').config();
const { enviarConfirmacionTurno } = require('../services/emailService');

const testEmailSending = async () => {
    console.log('🧪 Iniciando prueba de envío de email...\n');

    // Verificar variables de entorno
    console.log('📋 Configuración de email:');
    console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '***configurada***' : '❌ NO CONFIGURADA'}\n`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Error: Las credenciales de email no están configuradas en el archivo .env');
        console.log('\n💡 Asegúrate de configurar:');
        console.log('   - EMAIL_HOST');
        console.log('   - EMAIL_PORT');
        console.log('   - EMAIL_USER');
        console.log('   - EMAIL_PASS');
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
    console.log(`   Destinatario: ${process.env.EMAIL_USER}\n`);

    try {
        const result = await enviarConfirmacionTurno(turnoDataPrueba, process.env.EMAIL_USER);

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
        console.error('   1. Credenciales incorrectas');
        console.error('   2. Gmail bloqueando "aplicaciones menos seguras"');
        console.error('   3. Necesitas crear una "contraseña de aplicación" en Gmail');
        console.error('   4. Problemas de conectividad de red');
        console.error('\n💡 Para Gmail:');
        console.error('   - Ve a tu cuenta de Google');
        console.error('   - Seguridad > Verificación en dos pasos (actívala)');
        console.error('   - Seguridad > Contraseñas de aplicaciones');
        console.error('   - Genera una contraseña para "Correo" y úsala en EMAIL_PASS');
    }
};

testEmailSending();
