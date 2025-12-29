const { createCanvas, registerFont, loadImage } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');
const twemoji = require('twemoji');
const path = require('path');
const emojiCache = new Map();


try {
    registerFont(path.join(__dirname, '../assets/fonts/impact.ttf'), {
        family: 'ImpactMeme'
    });
} catch (e) {
    console.error('[ERROR] Font Impact gagal dimuat:', e.message);
}


function splitTextAndEmoji(text) {
    const emojiRegex = /\p{Extended_Pictographic}/gu;
    const emojis = text.match(emojiRegex) || [];
    const cleanText = text.replace(emojiRegex, '').trim();
    return { cleanText, emojis };
}

async function loadEmojiImage(emoji) {
    if (emojiCache.has(emoji)) {
        return emojiCache.get(emoji);
    }

    const parsed = twemoji.parse(emoji, {
        folder: '72x72',
        ext: '.png'
    });

    const match = parsed.match(/src="([^"]+)"/);
    if (!match) return null;

    const url = match[1];

    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const img = await loadImage(Buffer.from(buffer));

    emojiCache.set(emoji, img);

    return img;
}

const MAX_CACHE = 100;

if (emojiCache.size > MAX_CACHE) {
    emojiCache.clear();
}

module.exports = {
    name: '!s',
    async execute(msg, chat, args) {
        if (!msg.hasMedia) {
            return msg.reply('Kirim / balas gambar dengan caption !s teks');
        }

        try {
            const media = await msg.downloadMedia();
            const rawText = args.join(' ');

            if (!rawText) {
                return chat.sendMessage(media, {
                    sendMediaAsSticker: true,
                    stickerMetadata: {
                        author: 'AsakaAi',
                        pack: 'Sticker Pack'
                    }
                });
            }

            const canvas = createCanvas(512, 512);
            const ctx = canvas.getContext('2d');

            const img = await loadImage(
                `data:${media.mimetype};base64,${media.data}`
            );
            ctx.drawImage(img, 0, 0, 512, 512);

            const { cleanText, emojis } = splitTextAndEmoji(rawText);

            ctx.font = '70px ImpactMeme';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom'; 
            ctx.lineJoin = 'round';

            const textY = 482;

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 7;
            ctx.strokeText(cleanText.toUpperCase(), 256, textY);

            ctx.fillStyle = 'white';
            ctx.fillText(cleanText.toUpperCase(), 256, textY);

            if (emojis.length > 0 && cleanText.length > 0) {
                const emojiSize = 56;

                const metrics = ctx.measureText(cleanText.toUpperCase());
                const textWidth = metrics.width;
                const ascent = metrics.actualBoundingBoxAscent;

                let startX = 256 + textWidth / 2 + 8;
                const emojiY = textY - ascent;

            for (const emoji of emojis) {
                const emojiImg = await loadEmojiImage(emoji);
            if (!emojiImg) continue;

                ctx.drawImage(
                    emojiImg,
                    startX,
                    emojiY,
                    emojiSize,
                    emojiSize
                );

            startX += emojiSize + 4;
                }
            }

            const buffer = canvas.toBuffer('image/png');
            const sticker = new MessageMedia(
                'image/png',
                buffer.toString('base64'),
                'sticker.png'
            );

            await chat.sendMessage(sticker, {
                sendMediaAsSticker: true,
                stickerMetadata: {
                    author: 'AsakaAi',
                    pack: 'Meme Pack'
                }
            });

        } catch (err) {
            console.error(err);
            msg.reply('Gagal membuat stiker.');
        }
    }
};
