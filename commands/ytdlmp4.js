const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!ytmp4',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('Mana link YouTube-nya?');

        try {
            console.log(`[DEBUG] Memulai request ke Ryzumi untuk: ${url}`);
            msg.reply('Sabar anjg lagi ngambil video YouTube...');

            const response = await axios.get(`https://api.ryzumi.vip/api/downloader/ytmp4?url=${url}`);
            const res = response.data;
            console.log('[DEBUG] Respons API diterima');

            if (res.url) {
                const videoUrl = res.url;
                const videoTitle = res.title || 'Video YouTube';
                console.log(`[DEBUG] Mendownload video dari: ${videoUrl}`);

                console.log(`[DEBUG] Mendownload video dari: ${videoUrl}`);

                const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true }).catch(e => {
                    console.error('[DEBUG] Gagal download file media:', e.message);
                    return null;
                });

                if (!media) {
                    return msg.reply('Gagal mendownload file video.');
                }

                media.mimetype = 'video/mp4';
                media.filename = `${res.title || 'video'}.mp4`;

                console.log('[DEBUG] Mengirim video ke WhatsApp...');
                
                await chat.sendMessage(media, { 
                    caption: `✅ *Berhasil!*\n🎬 *Judul:* ${videoTitle}`,
                    sendMediaAsDocument: false
                }).catch(async (err) => {
                    console.error('[DEBUG] Gagal kirim video, kemungkinan masalah di Puppeteer/Node v24:', err.message);
                    await chat.sendMessage(media, { sendMediaAsDocument: true });
                });

                console.log('[DEBUG] Selesai proses pengiriman.');
            } else {
                console.log('[DEBUG] Link download tidak ditemukan dalam JSON');
                msg.reply('Gagal, Coba link video lain.');
            }
        } catch (err) {
            console.error('=== LOG ERROR ===');
            console.error(err.message);
            msg.reply(`Terjadi kesalahan: ${err.message}`);
        }
    }
};