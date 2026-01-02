const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

const MAX_SIZE_MB = 90;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function bytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}

function isTooLarge(bytes) {
    return bytes && bytes > MAX_SIZE_BYTES;
}

function detectPlatform(url) {
    if (/instagram\.com/.test(url)) return 'ig';
    if (/facebook\.com|fb\.watch/.test(url)) return 'fb';
    if (/tiktok\.com/.test(url)) return 'tt';
    if (/bilibili\.(tv|com)/.test(url)) return 'bili';
    if (/pinterest\.com/.test(url)) return 'pin';
    if (/youtube\.com|youtu\.be/.test(url)) return 'yt';
    if (/open\.spotify\.com|spotify\.link/.test(url)) return 'sp';
    if (/soundcloud\.com|on\.soundcloud\.com/.test(url)) return 'sc';
    if (/threads\.(net|com)/.test(url)) return 'thr';
    if (/twitter\.com|x\.com/.test(url)) return 'tw';
    if (/mediafire\.com/.test(url)) return 'mf';
    if (/mega\.nz/.test(url)) return 'mg';
    if (/drive\.google\.com/.test(url)) return 'dr';
    return null;
}

module.exports = {
    name: '!dl',
    async execute(msg, chat, args) {
        const url = args[0];
        if (!url) return msg.reply('Kirim link dulu.');

        const platform = detectPlatform(url);
        if (!platform) return msg.reply('Platform tidak didukung.');

        try {
            let apiUrl;
            let res;

            msg.reply(`⏳ Detected: ${platform.toUpperCase()}`);

            switch (platform) {
                case 'ig':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/igdl?url=${url}`;
                    break;
                case 'fb':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/fbdl?url=${url}`;
                    break;
                case 'tt':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/ttdl?url=${url}`;
                    break;
                case 'bili':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/bilibili?url=${url}`;
                    break;
                case 'pin':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/pinterest?url=${url}`;
                    break;
                case 'sp':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/spotify?url=${url}`;
                    break;
                case 'sc':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/soundcloud?url=${url}`;
                    break;
                case 'thr':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/threads?url=${url}`;
                    break;
                case 'tw':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/twitter?url=${url}`;
                    break;
                case 'mf':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/mediafire?url=${url}`;
                    break;
                case 'mg':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/mega?url=${url}`;
                    break;
                case 'dr':
                    apiUrl = `https://api.ryzumi.vip/api/downloader/gdrive?url=${url}`;
                    break;
                case 'yt': {
                    const format = args[1];
                    if (!['mp3', 'mp4'].includes(format)) {
                        return msg.reply('YouTube perlu format: mp3 / mp4');
                    }
                    apiUrl =
                        format === 'mp3'
                            ? `https://api.ryzumi.vip/api/downloader/ytmp3?url=${url}`
                            : `https://api.ryzumi.vip/api/downloader/ytmp4?url=${url}`;
                    break;
                }
            }

            res = (await axios.get(apiUrl)).data;

            if (platform === 'ig' || platform === 'thr') {
                if (!res.result?.length) return msg.reply('Media tidak ditemukan.');

                for (const m of res.result) {
                    if (isTooLarge(m.filesize)) {
                        await msg.reply(
                            `⚠️ Skip media (${bytesToMB(m.filesize)} MB) — terlalu besar`
                        );
                        continue;
                    }
                    const media = await MessageMedia.fromUrl(m.url);
                    await chat.sendMessage(media, { sendMediaAsDocument: true });
                }
            }

            if (platform === 'fb' || platform === 'tw') {
                const videoUrl = res.result?.hd || res.result?.sd;
                const size = res.result?.filesize;

                if (!videoUrl) return msg.reply('Video tidak ditemukan.');
                if (isTooLarge(size)) {
                    return msg.reply(
                        `❌ Video terlalu besar (${bytesToMB(size)} MB)`
                    );
                }

                const media = await MessageMedia.fromUrl(videoUrl);
                await chat.sendMessage(media, { sendMediaAsDocument: true });
            }

            if (platform === 'tt' || platform === 'bili') {
                const videoUrl = res.result.video || res.result.url;
                const size = res.result.filesize;

                if (!videoUrl) return msg.reply('Video tidak ditemukan.');
                if (isTooLarge(size)) {
                    return msg.reply(
                        `❌ Video terlalu besar (${bytesToMB(size)} MB)`
                    );
                }

                const media = await MessageMedia.fromUrl(videoUrl);
                await chat.sendMessage(media, { sendMediaAsDocument: true });
            }

            if (platform === 'sp' || platform === 'sc') {
                const size = res.result.filesize;

                if (!res.result?.url) return msg.reply('Audio tidak ditemukan.');
                if (isTooLarge(size)) {
                    return msg.reply(
                        `❌ Audio terlalu besar (${bytesToMB(size)} MB)`
                    );
                }

                const media = await MessageMedia.fromUrl(res.result.url);
                await chat.sendMessage(media, {
                    sendMediaAsDocument: true,
                    caption: res.result.title || 'Audio'
                });
            }

            if (['mf', 'mg', 'dr'].includes(platform)) {
                const size = res.result.filesize || res.result.size;

                if (!res.result?.url) return msg.reply('File tidak ditemukan.');
                if (isTooLarge(size)) {
                    return msg.reply(
                        `❌ File terlalu besar (${bytesToMB(size)} MB)\nLimit WhatsApp: ${MAX_SIZE_MB} MB`
                    );
                }

                const media = await MessageMedia.fromUrl(res.result.url);
                await chat.sendMessage(media, {
                    sendMediaAsDocument: true,
                    caption: res.result.filename || 'File'
                });
            }

            if (platform === 'yt') {
                const size = res.result.filesize || res.result.size;

                if (!res.result?.url) return msg.reply('Media YouTube tidak ditemukan.');
                if (isTooLarge(size)) {
                    return msg.reply(
                        `❌ File terlalu besar (${bytesToMB(size)} MB).`
                    );
                }

                const media = await MessageMedia.fromUrl(res.result.url);
                await chat.sendMessage(media, {
                    sendMediaAsDocument: true,
                    caption: res.result.title || 'YouTube'
                });
            }

            console.log(`[DEBUG] Download ${platform} sukses`);
        } catch (err) {
            console.error('[DL ERROR]', err.message);
            msg.reply('Terjadi error saat download.');
        }
    }
};
