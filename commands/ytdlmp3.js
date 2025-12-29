const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!ytmp3',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('Mana link YouTube-nya?');
        
        try {
            console.log(`[DEBUG] Memulai request MP3 ke Ryzumi untuk: ${url}`);
            msg.reply('Lagi mengonversi ke Audio...');

            const response = await axios.get(`https://api.ryzumi.vip/api/downloader/ytmp3?url=${url}`);
            const res = response.data;

            if (res.url) {
                const audioUrl = res.url;
                console.log(`[DEBUG] Mendownload MP3 dari: ${audioUrl}`);

                const media = await MessageMedia.fromUrl(audioUrl, { unsafeMime: true }).catch(e => {
                    console.error('[DEBUG] Gagal download file audio:', e.message);
                    return null;
                });

                if (!media) {
                    return msg.reply('Gagal mengambil audio dari server.');
                }

                media.mimetype = 'audio/mp4'; 
                media.filename = `${res.title || 'audio'}.mp3`;

                console.log('[DEBUG] Mengirim Audio ke WhatsApp...');
                
                await chat.sendMessage(media, { 
                    sendAudioAsVoice: false 
                });
                
                console.log('[DEBUG] Audio terkirim!');

            } else {
                console.log('[DEBUG] Link download MP3 tidak ditemukan');
                msg.reply('Gagal mendapatkan link audio.');
            }
        } catch (err) {
            console.error('=== LOG ERROR MP3 ===');
            console.error(err.message);
            msg.reply(`Terjadi kesalahan MP3: ${err.message}`);
        }
    }
};