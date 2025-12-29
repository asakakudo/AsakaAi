const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!ig',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('Mana link Instagramnya?');

        const API_ENDPOINT = 'https://api.ryzumi.vip/api/downloader/igdl';

        try {
            console.log(`[DEBUG] Request IG ke Ryzumi: ${url}`);
            msg.reply('⏳ Sabar anjg lagi ngambil media Instagram...');

            const response = await axios.get(API_ENDPOINT, {
                params: { url }
            });

            const res = response.data;

            if (!res || !res.result || res.result.length === 0) {
                return msg.reply('Gagal: Media Instagram tidak ditemukan.');
            }
            
            for (const item of res.result) {
                const mediaUrl = item.url;
                console.log(`[DEBUG] Mengunduh media dari: ${mediaUrl}`);
                const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
                const caption = `✅ *Berhasil!*`;
                
                console.log('[DEBUG] Mengirim IG media ke WhatsApp...');
                try {
                    await chat.sendMessage(media, { caption: caption });
                } catch (err) {
                    console.error('[DEBUG] Gagal kirim sebagai media, mencoba kirim sebagai dokumen:', err.message);
                    await chat.sendMessage(media, { caption: caption, sendMediaAsDocument: true });
                }
            }
            console.log('[DEBUG] IG media terkirim!');
        } catch (err) {
            console.error('=== ERROR INSTAGRAM ===');
            console.error(err.message);
            msg.reply('Gagal mengambil media Instagram. Mungkin link tidak valid atau layanan sedang bermasalah.');
        }
    }
};
