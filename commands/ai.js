const axios = require('axios');
const {
    processAiImage,
    getImageFromMessage,
    AI_IMAGE_FEATURES
} = require('../commands/ai-image');

let chatHistory = {};

/* =======================
   CUSTOM MESSAGE MAP
======================= */
const AI_MESSAGES = {
    toanime: () => '🎨 Foto kamu berhasil diubah jadi anime!',
    tofigure: () => '🤖 Foto ini sekarang jadi figur action!',
    tohijab: () => '🧕 Foto berhasil dipakaikan hijab.',
    hitamkan: () => '🖤 FOTO LU BERHASIL DIHITAMKAN🔥🔥',
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

        // AI IMAGE MODE
        const feature = args[0];
        if (feature && AI_IMAGE_FEATURES[feature]) {
            try {
                const imageUrl = await getImageFromMessage(msg);
                if (!imageUrl) {
                    return msg.reply('Reply atau kirim gambar untuk fitur AI.');
                }

                const prompt =
                    feature === 'edit'
                        ? args.slice(1).join(' ')
                        : null;

                if (feature === 'edit' && !prompt) {
                    return msg.reply('Edit image butuh prompt.');
                }

                await processAiImage({
                    chat,
                    feature,
                    imageUrl,
                    prompt
                });

                const messageBuilder = AI_MESSAGES[feature];
                if (messageBuilder) {
                    await msg.reply(messageBuilder(prompt));
                }

                return;
            } catch (err) {
                console.error('[AI IMAGE ERROR]', err.message);
                return msg.reply('Gagal memproses AI image.');
            }
        }

        // CHAT MODE (GEMINI)
        const query = args.join(" ");
        const hasMedia =
            msg.hasMedia ||
            (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia);

        try {
            if (!chatHistory[chatId]) chatHistory[chatId] = [];

            let contentParts = [];

            if (hasMedia) {
                const media = msg.hasMedia
                    ? await msg.downloadMedia()
                    : await (await msg.getQuotedMessage()).downloadMedia();

                if (!media.mimetype.startsWith('image/')) {
                    return msg.reply("Saya hanya bisa menganalisis gambar.");
                }

                contentParts.push({
                    inlineData: {
                        mimeType: media.mimetype,
                        data: media.data
                    }
                });
            }

            if (!query && !hasMedia) {
                return msg.reply("Kirim teks atau reply gambar dengan !ai");
            }

            contentParts.push({
                text: query || "Jelaskan gambar ini"
            });

            chatHistory[chatId].push({
                role: "user",
                parts: contentParts
            });

            if (chatHistory[chatId].length > 5) {
                chatHistory[chatId].shift();
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_KEY}`;

            const response = await axios.post(url, {
                contents: chatHistory[chatId]
            });

            const resultText =
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (resultText) {
                chatHistory[chatId].push({
                    role: "model",
                    parts: [{ text: resultText }]
                });
                await msg.reply(resultText);
            }

        } catch (e) {
            console.error("=== ERROR GEMINI ===");
            console.error(e.response ? JSON.stringify(e.response.data) : e.message);
            msg.reply("Gagal memproses permintaan.");
        }
    }
};
