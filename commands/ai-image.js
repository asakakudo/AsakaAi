const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const FormData = require('form-data');
const https = require('https');

const AI_IMAGE_FEATURES = {
    toanime: 'toanime',
    tofigure: 'tofigure',
    tohijab: 'tohijab',
    hitamkan: 'hitamkan',
    waifu2x: 'waifu2x',
    upscaler: 'upscaler',
    removebg: 'removebg',
    colorize: 'colorize',
    remini: 'remini',
    edit: 'edit'
};

async function uploadImageBase64(media) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', Buffer.from(media.data, 'base64'), {
        filename: 'image.png',
        contentType: 'image/png'
    });

    try {
        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        if (res.data && res.data.startsWith('http')) {
            console.log(`[UPLOAD SUCCESS] URL: ${res.data}`);
            return res.data.trim();
        } else {
            throw new Error('Upload ke Catbox gagal.');
        }
    } catch (err) {
        console.error('[UPLOAD ERROR]', err.message);
        throw new Error('Gagal mengupload gambar sementara.');
    }
}

async function getImageFromMessage(msg) {
    let media = null;

    if (msg.hasQuotedMsg) {
        const quoted = await msg.getQuotedMessage();
        if (quoted.hasMedia) media = await quoted.downloadMedia();
    } else if (msg.hasMedia) {
        media = await msg.downloadMedia();
    }

    if (!media || !media.mimetype.startsWith('image/')) return null;

    return await uploadImageBase64(media);
}

async function processAiImage({ chat, feature, imageUrl }) {
    const endpoint = AI_IMAGE_FEATURES[feature];
    if (!endpoint) throw new Error('Fitur AI image tidak dikenali.');

    console.log(`[AI IMAGE] Processing: ${feature} | Source: ${imageUrl}`);

    const agent = new https.Agent({  
        keepAlive: true,
        rejectUnauthorized: false 
    });

    try {
        const response = await axios.get(
            `https://api.ryzumi.vip/api/ai/${endpoint}`,
            {
                params: {
                    imageUrl: imageUrl 
                },
                headers: {
                    'Accept': 'image/png',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
                },
                responseType: 'arraybuffer',
                httpsAgent: agent,
                timeout: 60000
            }
        );

        if (response.status !== 200) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const media = new MessageMedia(
            'image/png',
            Buffer.from(response.data).toString('base64')
        );

        await chat.sendMessage(media);

    } catch (err) {
        if (err.code === 'ECONNRESET') {
            console.error('[AI IMAGE ERROR] Koneksi diputus oleh server (ECONNRESET).');
            throw new Error('Koneksi ke server AI terputus. Coba lagi nanti.');
        } else if (err.response && err.response.status === 400) {
            console.error('[AI IMAGE ERROR] 400 Bad Request. URL Gambar mungkin ditolak.');
            throw new Error('Server AI menolak gambar ini. Coba gunakan gambar lain.');
        } else {
            console.error('[AI IMAGE ERROR]', err.message);
            throw err;
        }
    }
}

module.exports = {
    processAiImage,
    getImageFromMessage,
    AI_IMAGE_FEATURES
};