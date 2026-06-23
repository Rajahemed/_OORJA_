const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

function initializeWhatsApp() {
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('\n========================================================================');
        console.log('📱 WhatsApp Web Login Required!');
        console.log('Scan the QR code below using your WhatsApp app to enable sending OTPs.');
        console.log('========================================================================\n');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Web Client is READY!');
        isReady = true;
    });

    client.on('authenticated', () => {
        console.log('✅ WhatsApp Web Client Authenticated');
    });

    client.on('auth_failure', msg => {
        console.error('❌ WhatsApp Web Authentication failure:', msg);
    });

    client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp Web Client was disconnected:', reason);
        isReady = false;
        // Optionally reconnect
        client.initialize();
    });

    client.initialize().catch(err => {
        console.error('❌ Failed to initialize WhatsApp client:', err);
    });
}

async function sendWhatsAppMessage(phone, message) {
    if (!client || !isReady) {
        throw new Error('WhatsApp client is not ready yet.');
    }
    // Strip non-digits
    let formattedPhone = phone.replace(/\D/g, '');
    
    // If it's a 10-digit number, prepend India country code 91
    if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
    }
    
    try {
        // Verify if number is registered on WhatsApp to prevent crash
        const numberId = await client.getNumberId(formattedPhone);
        if (!numberId) {
            throw new Error('Number is not registered on WhatsApp');
        }
        
        const response = await client.sendMessage(numberId._serialized, message);
        return response;
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        throw error;
    }
}

module.exports = {
    initializeWhatsApp,
    sendWhatsAppMessage,
    isClientReady: () => isReady
};
