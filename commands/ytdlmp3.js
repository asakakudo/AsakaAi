const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!ytmp3',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('mana link YouTubenya kocak');

        const apiUrl = `https://api.ryzumi.vip/api/downloader/ytmp3?url=${url}`;

        try {
            msg.reply('Sabar anjg lagi mengkonversi ke Audio...');
            const response = await axios.get(apiUrl);
            const res = response.data;

            if (res.status && res.result) {
                const media = await MessageMedia.fromUrl(res.result.url);
                await chat.sendMessage(media, { sendAudioAsVoice: false });
            } else {
                msg.reply('Gagal mengambil audio.');
            }
        } catch (err) {
            console.error(err);
            msg.reply('Error server API.');
        }
    }
};