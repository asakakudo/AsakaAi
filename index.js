const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const commands = require('./commands');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth' // Memastikan folder ini yang digunakan
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

client.on('qr', qr => {
    // Menampilkan link agar Anda bisa scan via browser
    console.log('------------------------------------------------');
    console.log('SCAN QR DI LINK INI:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
    console.log('------------------------------------------------');
    
    // Tetap tampilkan di terminal sebagai cadangan
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



