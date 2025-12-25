const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commands = require('./commands');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Asa siap bertugas.');
});

client.on('message', msg => {
    const text = msg.body.toLowerCase().trim();
    if (commands[text]) {
        commands[text](msg);
    }
});

client.initialize();
