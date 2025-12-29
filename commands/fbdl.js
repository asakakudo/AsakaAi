const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!fb',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('Mana link Facebooknya?');

        const API_ENDPOINT = 'https://api.ryzumi.vip/api/downloader/fbdl';

        try {
            console.log(`[DEBUG] Request FB ke Ryzumi: ${url}`);
            msg.reply('Sabar anjg lagi ngambil video Facebook...');

            const response = await axios.get(API_ENDPOINT, {
                params: { url }
            });

            const apiResult = response.data.result;

            if (!apiResult || (!apiResult.hd && !apiResult.sd)) {
                return msg.reply('Gagal: Video Facebook tidak ditemukan.');
            }

            const videoUrl = apiResult.hd || apiResult.sd;
            const videoTitle = apiResult.title || 'Video Facebook';
            const caption = `✅ *Berhasil!*\n🎬 *Judul:* ${videoTitle}`;

            console.log('[DEBUG] Mengunduh media dari URL...');
            const media = await MessageMedia.fromUrl(videoUrl);

            console.log('[DEBUG] Mengirim FB video ke WhatsApp...');
            try {
                await chat.sendMessage(media, {
                    caption: caption,
                    sendMediaAsDocument: false
                });
            } catch (err) {
                console.error('[DEBUG] Gagal kirim sebagai video, mencoba kirim sebagai dokumen:', err.message);
            await chat.sendMessage(media, { caption: caption, sendMediaAsDocument: true });
            }
            console.log('[DEBUG] FB media terkirim!');
        } catch (err) {
            console.error('=== ERROR FACEBOOK ===');
            console.error(err.message);
            msg.reply('Gagal mengambil video Facebook. Mungkin link tidak valid atau layanan sedang bermasalah.');
        }
    }
};
