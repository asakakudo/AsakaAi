const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!tt',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('Mana link TikTok-nya?');

        try {
            console.log(`[DEBUG] Request TikTok ke Ryzumi: ${url}`);
            msg.reply('Sabar anjg lagi ngambil video TikTok...');

            const response = await axios.get(`https://api.ryzumi.vip/api/downloader/ttdl?url=${url}`);
            const res = response.data;

            const tikData = res.data && res.data.data ? res.data.data : (res.result || null);
            const videoLink = tikData ? (tikData.hdplay || tikData.play || tikData.wmplay) : null;

            if (videoLink) {
                console.log(`[DEBUG] Mendownload Buffer Video...`);
                
                const videoBuffer = await axios.get(videoLink, { 
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                const media = new MessageMedia(
                    'video/mp4', 
                    Buffer.from(videoBuffer.data).toString('base64'), 
                    'tiktok.mp4'
                );

                console.log('[DEBUG] Mengirim ke WhatsApp...');

                try {
                    await chat.sendMessage(media, { 
                        caption: `✅ *TikTok Success*\n📝 *Title:* ${tikData.title || 'No Title'}`,
                        sendMediaAsDocument: false 
                    });
                    console.log('[DEBUG] TikTok terkirim sebagai VIDEO!');
                } catch (sendError) {
                    console.error('[DEBUG] Gagal kirim video (Error t), mencoba kirim sebagai DOKUMEN...');
                    await chat.sendMessage(media, { 
                        caption: `✅ *TikTok Success (Dokumen)*\n📝 *Title:* ${tikData.title || 'No Title'}\n\n`,
                        sendMediaAsDocument: true 
                    });
                    console.log('[DEBUG] TikTok terkirim sebagai DOKUMEN!');
                }

            } else {
                msg.reply('Gagal: Link video tidak ditemukan.');
            }
        } catch (err) {
            console.error('=== ERROR TIKTOK ===');
            console.error(err.message);
            msg.reply(`Gagal: ${err.message}`);
        }
    }
};