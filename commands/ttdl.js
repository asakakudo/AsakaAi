const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!ttdl',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('Mana link TikToknya kocak');

        const apiUrl = `https://api.ryzumi.vip/api/downloader/tiktok?url=${url}`;

        try {
            msg.reply('Sabar kntl lagi download...');
            const response = await axios.get(apiUrl);
            const res = response.data;

            if (res.status && res.result) {
                const videoUrl = res.result.video || res.result.no_watermark;
                const media = await MessageMedia.fromUrl(videoUrl);
                await chat.sendMessage(media, { caption: 'Nih video lu dah gw download' });
            } else {
                msg.reply('Gagal mengambil data TikTok. Cek link-nya.');
            }
        } catch (err) {
            console.error(err);
            msg.reply('Error saat menghubungi server.');
        }
    }
};