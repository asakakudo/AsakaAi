const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!ytmp4', 
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('mana link YouTubenya kocak');

        const apiUrl = `https://api.ryzumi.vip/api/downloader/ytmp4?url=${url}`;

        try {
            msg.reply('Proses download video YouTube...');
            const response = await axios.get(apiUrl);
            const res = response.data;

            if (res.status && res.result) {
                const videoUrl = res.result.url; 
                const media = await MessageMedia.fromUrl(videoUrl);
                
                await chat.sendMessage(media, { 
                    caption: `Judul: ${res.result.title}\nResolusi: 720p`,
                    sendMediaAsDocument: false 
                });
            } else {
                msg.reply('Gagal download video.');
            }
        } catch (err) {
            console.error(err);
            msg.reply('Gagal koneksi ke API.');
        }
    }
};