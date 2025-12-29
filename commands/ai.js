const axios = require('axios');

let chatHistory = {};

module.exports = {
    name: "!ai",
    async execute(msg, chat, args) {
        const chatId = chat.id._serialized;
        const query = args.join(" ");
        
    
        const hasMedia = msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia);

        try {
            if (!chatHistory[chatId]) chatHistory[chatId] = [];

            let contentParts = [];

            // 1. LOGIKA HANDLE GAMBAR
            if (hasMedia) {
                console.log(`[DEBUG] Mengunduh media...`);
                const media = msg.hasMedia 
                    ? await msg.downloadMedia() 
                    : await (await msg.getQuotedMessage()).downloadMedia();

                if (media.mimetype.startsWith('image/')) {
                    contentParts.push({
                        inlineData: {
                            mimeType: media.mimetype,
                            data: media.data // Ini adalah string Base64
                        }
                    });
                } else {
                    return msg.reply("Maaf, saat ini saya hanya bisa menganalisis gambar.");
                }
            }

            // 2. LOGIKA HANDLE TEKS
            if (!query && !hasMedia) return msg.reply("Mau nanya apa? Kirim gambar dengan caption !ai atau kirim teks aja.");
            
            contentParts.push({ text: query || "Jelaskan gambar ini" });

            // Masukkan ke history
            chatHistory[chatId].push({
                role: "user",
                parts: contentParts
            });
            
            if (chatHistory[chatId].length > 5) chatHistory[chatId].shift();

            console.log(`[DEBUG] Menghubungi Gemini 3 Flash (Multimodal)...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_KEY}`;

            const response = await axios.post(url, {
                contents: chatHistory[chatId]
            });

            if (response.data.candidates && response.data.candidates[0].content) {
                const resultText = response.data.candidates[0].content.parts[0].text;
                
                chatHistory[chatId].push({
                    role: "model",
                    parts: [{ text: resultText }]
                });

                await msg.reply(resultText);
            }

        } catch (e) {
            console.error("=== ERROR API GEMINI ===");
            console.error(e.response ? JSON.stringify(e.response.data) : e.message);
            msg.reply("Gagal menganalisis. Coba kirim ulang gambarnya.");
        }
    }
};