const sharp = require('sharp');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: '!s',
    async execute(msg, chat, args) {
        if (!msg.hasMedia) return msg.reply('Kirim gambar lu dengan caption !s [teks atas] | [teks bawah]');

        try {
            const media = await msg.downloadMedia();
            let imageBuffer = Buffer.from(media.data, 'base64');
            
            const fullArgs = args.join(' ').split('|');
            const text = fullArgs[0]?.trim();
            const position = fullArgs[1]?.trim().toLowerCase() || 'bawah';

            if (text) {
                const svgText = `
                <svg width="512" height="512">
                    <style>
                        .title { fill: white; font-size: 50px; font-weight: bold; font-family: sans-serif; stroke: black; stroke-width: 2px; }
                    </style>
                    ${position === 'atas' || position === 'dua' ? `<text x="50%" y="15%" text-anchor="middle" class="title">${text}</text>` : ''}
                    ${position === 'bawah' || position === 'dua' ? `<text x="50%" y="90%" text-anchor="middle" class="title">${text}</text>` : ''}
                </svg>`;

                imageBuffer = await sharp(imageBuffer)
                    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
                    .webp()
                    .toBuffer();
                
                media.data = imageBuffer.toString('base64');
                media.mimetype = 'image/webp';
            }

            await chat.sendMessage(media, {
                sendMediaAsSticker: true,
                stickerName: "Dibuat dengan AsaAi",
                stickerAuthor: "AsaAi"
            });

        } catch (e) {
            console.error(e);
            msg.reply('Gagal memproses stiker dengan teks.');
        }
    }
};