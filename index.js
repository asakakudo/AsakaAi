require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const isLinux = process.platform === 'linux';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: isLinux ? true : false, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        executablePath: isLinux ? '/usr/bin/chromium-browser' : undefined 
    }
});

client.commands = new Map();

const commandPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandPath)) fs.mkdirSync(commandPath);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    
    if (command.name) {
        client.commands.set(command.name, command);
        console.log(`[LOAD] Perintah dimuat: ${command.name}`);
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