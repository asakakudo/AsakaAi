require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--disable-web-security', 
            '--disable-features=IsolateOrigins,site-per-process',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        executablePath: process.env.CHROME_BIN || undefined
    }
});

client.commands = new Map();

const commandPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandPath)) fs.mkdirSync(commandPath);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        
        if (command.name) {
            client.commands.set(command.name, command);
            console.log(`[LOAD] Perintah dimuat: ${command.name}`);
        }
    } catch (e) {
        console.warn(`[SKIP] Gagal memuat command ${file}: ${e.message}`);
    }
}

client.on('qr', qr => {
    console.log('SCAN QR CODE DI BAWAH INI:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('AsaAi Ready!');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const sender = msg.from;
    if (msg.fromMe) return;

    const parts = msg.body.trim().split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (client.commands.has(commandName)) {
        try {
            await sleep(1000, 2000);
            await chat.sendSeen();

            await sleep(1000, 3000);
            await chat.sendStateTyping();
            await sleep(2000, 4000);
            await client.commands.get(commandName).execute(msg, chat, args);
            
        } catch (error) {
            console.error(error);
            msg.reply('Error!');
        } finally {
            await chat.clearState();
        }
    }
});

const sleep = (min, max) => {
    const duration = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, duration));
};

client.initialize();