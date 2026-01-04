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
    if (emojiCache.has(emoji)) return emojiCache.get(emoji);
    const parsed = twemoji.parse(emoji, { folder: '72x72', ext: '.png' });
    const match = parsed.match(/src="([^"]+)"/);
    if (!match) return null;
    const res = await fetch(match[1]);
    const buffer = await res.arrayBuffer();
    const img = await loadImage(Buffer.from(buffer));
    emojiCache.set(emoji, img);
    return img;
}

const MAX_CACHE = 100;
if (emojiCache.size > MAX_CACHE) emojiCache.clear();

module.exports = {
    name: '!s',
    async execute(msg, chat, args) {
        console.log('[STICKER] Execute function called!');
        
        await chat.sendSeen(); 
        
        let mediaMsg = msg;
        
        if (msg.hasQuotedMsg) {
            try {
                mediaMsg = await msg.getQuotedMessage();
                console.log('[STICKER] Using quoted message');
            } catch (err) {
                console.error('[STICKER] Error getting quoted:', err.message);
            }
        }
        
        if (!mediaMsg.hasMedia) {
            return msg.reply('Kirim/Reply gambar atau GIF dengan caption !s');
        }

        console.log(`[STICKER] Media detected - Type: ${mediaMsg.type}, Mime: ${mediaMsg._data?.mimetype || 'unknown'}`);

        let media = null;
      
        for (let i = 0; i < 5; i++) {
            try {
                console.log(`[STICKER] Download attempt ${i + 1}/5...`);
                
                if (msg.hasQuotedMsg && i > 0) {
                    console.log('[STICKER] Refreshing message from chat history...');
                    const fetched = await chat.fetchMessages({ limit: 100 });
                    const found = fetched.find(m => m.id._serialized === mediaMsg.id._serialized);
                    if (found) {
                        mediaMsg = found;
                        console.log('[STICKER] Message refreshed from history');
                    }
                }

                if (i === 1) {
                    try {
                        await mediaMsg.react('⏳');
                        console.log('[STICKER] Added reaction to trigger media load');
                    } catch (e) {
                        console.log('[STICKER] React failed:', e.message);
                    }
                }

                if (i === 2 && !media) {
                    console.log('[STICKER] Trying Forward-Download strategy...');
                    try {
                        const forwardedMsgs = await mediaMsg.forward(chat.id);
                        const forwardedMsg = Array.isArray(forwardedMsgs) ? forwardedMsgs[0] : forwardedMsgs;
                        
                        if (forwardedMsg) {
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            media = await forwardedMsg.downloadMedia();
                            
                            try {
                                await forwardedMsg.delete(true);
                                console.log('[STICKER] Forward message deleted');
                            } catch (e) {}
                            
                            if (media) {
                                console.log('[STICKER] Forward-Download SUCCESS!');
                                break;
                            }
                        }
                    } catch (err) {
                        console.error('[STICKER] Forward strategy failed:', err.message);
                    }
                }

                media = await mediaMsg.downloadMedia();
                
                if (media) {
                    console.log('[STICKER] Download successful!');
                    break;
                }
                
            } catch (e) {
                console.log(`[STICKER] Attempt ${i + 1} failed: ${e.message}`);
                if (i < 4) { 
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        try { 
            await mediaMsg.react(''); 
        } catch (e) {}

        if (!media) {
            console.error('[STICKER] All download attempts failed');
            return msg.reply('❌ Gagal download media setelah 5 percobaan.\n\n**Solusi:**\n1. Kirim media BARU (jangan forward)');
        }

        console.log('[STICKER] Media downloaded:', media.mimetype);
        console.log('[STICKER] Data size:', media.data?.length || 0);

        try {
            const isAnimated = media.mimetype.includes('video') || 
                              media.mimetype.includes('gif') ||
                              mediaMsg.type === 'video';

            const rawText = args.filter(arg => arg !== '!s').join(' ');
            console.log('[STICKER] Text overlay:', rawText || 'none');
            console.log('[STICKER] Is animated:', isAnimated);

            if (isAnimated || !rawText) {
                console.log('[STICKER] Sending as plain sticker...');
                await chat.sendMessage(media, {
                    sendMediaAsSticker: true,
                    stickerMetadata: {
                        author: 'AsakaAi',
                        pack: isAnimated ? 'Animated Pack' : 'Sticker Pack',
                        keepScale: true
                    }
                });
                console.log('[STICKER] Success!');
                return;
            }

            console.log('[STICKER] Creating text overlay with canvas...');
            
            const canvas = createCanvas(512, 512);
            const ctx = canvas.getContext('2d');

            const img = await loadImage(`data:${media.mimetype};base64,${media.data}`);
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
                    ctx.drawImage(emojiImg, startX, emojiY, emojiSize, emojiSize);
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
                    pack: 'Meme Pack',
                    keepScale: true
                }
            });

            console.log('[STICKER] Text sticker created successfully!');

        } catch (err) {
            console.error('[STICKER ERROR]', err.message);
            console.error('[STICKER STACK]', err.stack);
            msg.reply('❌ Gagal membuat stiker: ' + err.message);
        }
    }
};