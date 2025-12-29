const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const FormData = require('form-data');
const sharp = require('sharp');

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
    const inputBuffer = Buffer.from(media.data, 'base64');

    // 🔥 NORMALISASI IMAGE
    const jpegBuffer = await sharp(inputBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

    const form = new FormData();
    form.append('file', jpegBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
    });

    const res = await axios.post(
        'https://telegra.ph/upload',
        form,
        { headers: form.getHeaders() }
    );

    return `https://telegra.ph${res.data[0].src}`;
}

/* =======================
   GET IMAGE FROM MESSAGE
======================= */
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

/* =======================
   CORE IMAGE PROCESSOR
======================= */
async function processAiImage({ chat, feature, imageUrl }) {
    const endpoint = AI_IMAGE_FEATURES[feature];
    if (!endpoint) throw new Error('Fitur AI image tidak dikenali.');

    try {
        const response = await axios.get(
            `https://api.ryzumi.vip/api/ai/${endpoint}`,
            {
                params: {
                    imageUrl // ⬅️ PENTING: pakai params
                },
                headers: {
                    Accept: 'image/png'
                },
                responseType: 'arraybuffer',
                validateStatus: () => true // ⬅️ jangan auto-throw
            }
        );

        if (response.status !== 200) {
            console.error('[AI IMAGE API ERROR]');
            console.error('STATUS:', response.status);
            console.error('DATA:', response.data?.toString());
            throw new Error('AI image gagal diproses.');
        }

        const media = new MessageMedia(
            'image/png',
            Buffer.from(response.data).toString('base64')
        );

        await chat.sendMessage(media);

    } catch (err) {
        console.error('[AI IMAGE ERROR]', err.message);
        throw err;
    }
}

module.exports = {
    processAiImage,
    getImageFromMessage,
    AI_IMAGE_FEATURES
};
