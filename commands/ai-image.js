const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const FormData = require('form-data');

/* =======================
   FEATURE → ENDPOINT MAP
======================= */
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
    const buffer = Buffer.from(media.data, 'base64');

    const form = new FormData();
    form.append('file', buffer, {
        filename: 'image.jpg',
        contentType: media.mimetype
    });

    const res = await axios.post(
        'https://telegra.ph/upload',
        form,
        { headers: form.getHeaders() }
    );

    if (!Array.isArray(res.data) || !res.data[0]?.src) {
        throw new Error('Gagal upload ke telegra.ph');
    }

    // 🔥 DIRECT IMAGE URL (AMAN 100%)
    return `https://telegra.ph${res.data[0].src}`;
}

/* =======================
   GET IMAGE FROM MESSAGE
======================= */
async function getImageFromMessage(msg) {
    let media = null;

    if (msg.hasQuotedMsg) {
        const quoted = await msg.getQuotedMessage();
        if (quoted.hasMedia) {
            media = await quoted.downloadMedia();
        }
    } else if (msg.hasMedia) {
        media = await msg.downloadMedia();
    }

    if (!media || !media.mimetype.startsWith('image/')) {
        return null;
    }

    return await uploadImageBase64(media);
}

/* =======================
   CORE IMAGE PROCESSOR
======================= */
async function processAiImage({ chat, feature, imageUrl, prompt = null }) {
    const endpoint = AI_IMAGE_FEATURES[feature];
    if (!endpoint) throw new Error('Fitur AI image tidak dikenali.');

    // ✅ PARAMETER BENAR: img
    let apiUrl = `https://api.ryzumi.vip/api/ai/${endpoint}?imageUrl=${encodeURIComponent(imageUrl)}`;

    if (feature === 'edit') {
        if (!prompt) throw new Error('Prompt diperlukan.');
        apiUrl += `&prompt=${encodeURIComponent(prompt)}`;
    }

    try {
        const response = await axios.get(apiUrl);
        const res = response.data;

        if (!res.result?.url) {
            throw new Error('Response AI tidak valid.');
        }

        const media = await MessageMedia.fromUrl(res.result.url);
        await chat.sendMessage(media);

        return {
            feature,
            prompt,
            outputUrl: res.result.url
        };

    } catch (err) {
        if (err.response) {
            console.error('[AI IMAGE API ERROR]');
            console.error('STATUS:', err.response.status);
            console.error('DATA:', err.response.data);
        }
        throw err;
    }
}

module.exports = {
    processAiImage,
    getImageFromMessage,
    AI_IMAGE_FEATURES
};
