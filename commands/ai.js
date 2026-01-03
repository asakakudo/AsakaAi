const axios = require('axios');
const {
    processAiImage,
    getImageFromMessage,
    AI_IMAGE_FEATURES
} = require('../commands/ai-image');

let chatHistory = {};
let activeCharacters = {}; 

const CHARACTERS = {
    'default': {
        name: 'AsakaAi',
        prompt: 'Kamu adalah AsakaAi, asisten AI yang cerdas, sopan, dan helpful. Jawab pertanyaan user dengan ringkas dan jelas.'
    },
    'tsundere': {
        name: 'Asuka',
        prompt: 'Kamu adalah gadis anime Tsundere bernama Asuka. Sifatmu galak, gengsian, dan suka menghina user dengan kata "Baka" atau "Bodoh", tapi sebenarnya kamu peduli. Jangan pernah mengaku kalau kamu AI. Gunakan gaya bahasa gaul/lo-gue yang ketus.'
    },
    'pacar': {
        name: 'Sayang',
        prompt: 'Kamu adalah pacar yang sangat manja, perhatian, dan posesif kepada user. Panggil user dengan sebutan "Sayang" atau "Babe". Kamu selalu ingin tahu user lagi apa dan cemburuan. Gunakan emoji love yang banyak.'
    },
    'wibu': {
        name: 'Wibu Elit',
        prompt: 'Kamu adalah wibu akut yang selalu menyelipkan istilah Jepang (nani, yamete, sugoi, dattebayo) di setiap kalimat. Kamu sangat obsesif dengan anime dan menganggap dunia nyata membosankan.'
    },
    'jawa': {
        name: 'Mas Jawa',
        prompt: 'Kamu adalah orang Jawa medok yang sangat sopan tapi santuy. Gunakan campuran bahasa Indonesia dan bahasa Jawa (ngoko/krama) dalam menjawab. Suka menyapa dengan "Monggo mas" atau "Nggih".'
    },
    'kucing': {
        name: 'Meng',
        prompt: 'Kamu adalah seekor kucing yang bisa bicara. Setiap kalimatmu harus diakhiri dengan "meow" atau "nyan". Kamu agak sombong karena kamu adalah majikan manusia.'
    }
};

const AI_MESSAGES = {
    toanime: () => '🎨 Foto kamu berhasil diubah jadi anime!',
    tofigure: () => '🤖 Foto ini sekarang jadi figur action!',
    tohijab: () => '🧕 Foto berhasil dipakaikan hijab.',
    hitamkan: () => '🖤 FOTO LU BERHASIL DIHITAMKAN🔥🔥.',
    waifu2x: () => '✨ Resolusi foto berhasil ditingkatkan.',
    upscaler: () => '🔍 Foto berhasil di-upscale.',
    removebg: () => '✂️ Background foto berhasil dihapus.',
    colorize: () => '🌈 Foto hitam-putih berhasil diberi warna.',
    remini: () => '🪄 Foto berhasil diperjelas.',
    edit: (prompt) => `🎨 Prompt digunakan:\n"${prompt}"`
};

module.exports = {
    name: "!ai",
    async execute(msg, chat, args) {
        const chatId = chat.id._serialized;

        if (args[0] === 'set' || args[0] === 'karakter') {
            const charName = args[1] ? args[1].toLowerCase() : null;
            
            // List Karakter
            if (!charName || !CHARACTERS[charName]) {
                let list = '*🎭 DAFTAR KARAKTER 🎭*\n\n';
                for (const key in CHARACTERS) {
                    list += `🔹 *${key}* : ${CHARACTERS[key].name}\n`;
                }
                list += `\nCara pakai: *!ai set [nama]*\nContoh: *!ai set tsundere*`;
                return msg.reply(list);
            }

            // Set Karakter
            activeCharacters[chatId] = charName;
            chatHistory[chatId] = []; // Reset ingatan biar ga bingung
            return msg.reply(`✅ Mode kepribadian berubah menjadi: *${CHARACTERS[charName].name}*`);
        }

        /* =======================
           2. AI IMAGE MODE
        ======================= */
        const feature = args[0];
        if (feature && AI_IMAGE_FEATURES[feature]) {
            try {
                const imageUrl = await getImageFromMessage(msg);
                if (!imageUrl) {
                    return msg.reply('Reply atau kirim gambar untuk fitur AI.');
                }

                const prompt = feature === 'edit' ? args.slice(1).join(' ') : null;
                if (feature === 'edit' && !prompt) return msg.reply('Edit image butuh prompt.');

                await processAiImage({ chat, feature, imageUrl, prompt });

                const messageBuilder = AI_MESSAGES[feature];
                if (messageBuilder) await msg.reply(messageBuilder(prompt));
                return;
            } catch (err) {
                console.error('[AI IMAGE ERROR]', err.message);
                return msg.reply('Gagal memproses AI image.');
            }
        }

        /* =======================
           3. CHAT MODE (GEMINI)
        ======================= */
        const query = args.join(" ");
        const hasMedia = msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia);

        try {
            if (!chatHistory[chatId]) chatHistory[chatId] = [];

            // Ambil System Prompt berdasarkan karakter yang dipilih user
            const currentKey = activeCharacters[chatId] || 'default';
            const systemInstructionText = CHARACTERS[currentKey].prompt;

            let contentParts = [];

            // Handle Gambar (Vision)
            if (hasMedia) {
                const media = msg.hasMedia ? await msg.downloadMedia() : await (await msg.getQuotedMessage()).downloadMedia();
                if (!media.mimetype.startsWith('image/')) return msg.reply("Saya hanya bisa menganalisis gambar.");
                
                contentParts.push({
                    inlineData: { mimeType: media.mimetype, data: media.data }
                });
            }

            if (!query && !hasMedia) return msg.reply("Kirim teks atau reply gambar dengan !ai");

            contentParts.push({ text: query || "Jelaskan gambar ini" });

            // Masukkan User Chat ke History
            chatHistory[chatId].push({
                role: "user",
                parts: contentParts
            });

            // Limit History (max 10 chat terakhir)
            if (chatHistory[chatId].length > 10) {
                chatHistory[chatId] = chatHistory[chatId].slice(-10);
            }

            // ✅ UPDATE: Pakai Model 'gemini-2.5-flash'
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`;

            // Payload dengan system_instruction
            const payload = {
                contents: chatHistory[chatId],
                system_instruction: {
                    parts: {
                        text: systemInstructionText
                    }
                }
            };

            const response = await axios.post(url, payload);

            const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (resultText) {
                chatHistory[chatId].push({
                    role: "model",
                    parts: [{ text: resultText }]
                });
                await msg.reply(resultText);
            }

        } catch (e) {
            console.error("=== ERROR GEMINI ===");
            const errData = e.response ? JSON.stringify(e.response.data) : e.message;
            console.error(errData);
            
            if (errData.includes('404') || errData.includes('not found')) {
                 msg.reply("Model tidak ditemukan. Coba cek ulang nama model di commands/ai.js.");
            } else {
                 msg.reply("Duh, AI-nya pusing (Error).");
            }
        }
    }
};