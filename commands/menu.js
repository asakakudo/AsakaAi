const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

function formatDateTime() {
    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Makassar'
    });
    const waktu = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Makassar'
    });
    return { tanggal, waktu };
}

module.exports = {
    name: '!menu',
    async execute(msg, chat) {
        const name = msg._data.notifyName || 'User';
        const { tanggal, waktu } = formatDateTime();

        const imageDir = path.join(__dirname, '../assets/menu');
        let media = null;
        try {
            const images = fs.readdirSync(imageDir).filter(file => /\.(png|jpe?g|webp)$/i.test(file));
            if (images.length > 0) {
                const randomImage = images[Math.floor(Math.random() * images.length)];
                media = MessageMedia.fromFilePath(path.join(imageDir, randomImage));
            }
        } catch (err) {
            console.error('[MENU] Gagal muat gambar:', err.message);
        }

        const menuText = `
✨ *Halo, ${name}!* ✨
Selamat datang di **AsaAi**

"ga tau gabut aja gw bikin ginian"

📅 *Tanggal:* ${tanggal}
⏰ *Waktu:* ${waktu}

--- 🛠️ **DASHBOARD MENU** ---

🚀 **Main**
├ !menu - Menampilkan daftar ini
└ !ping - Cek status bot

🤖 **AI Image**
*(Gunakan prefix !ai diikuti fitur)*
├ !ai toanime (lagi error)
├ !ai upscaler - Upscale gambar
├ !ai tofigure - Ubah foto jadi Figure
├ !ai tohijab - Ubah foto jadi Berhijab
├ !ai hitamkan - HITAMKAN WAIFU TEMENLU🔥
├ !ai colorize - Warnai foto jadul
├ !ai waifu2x - HD-kan gambar anime
├ !ai remini - (lagi error)
├ !ai removebg - Hapus background
└ !ai edit [prompt] - Edit gambar via teks

💬 **AI Chat**
└ !ai [pertanyaan] - Ngobrol sama Gemini

📥 **Video & Music Downloader**
*(Gunakan command khusus ini)*
├ !tt [link] - TikTok (No WM)
├ !ig [link] - Instagram (Reels/Post)
├ !fb [link] - Facebook Video
├ !tw [link] - Twitter/X Video
├ !ytmp3 [link] - YouTube Audio
└ !ytmp4 [link] - YouTube Video

🔗 **Universal Downloader**
*(Gunakan !dl [link] untuk platform di bawah )*
├ Spotify • SoundCloud • Threads
├ Pinterest • Bilibili • MediaFire
└ Google Drive • Mega • dan Seluruh Social Media diatas juga bisa

🎨 **Sticker & Tools**
└ !s [teks] - Buat stiker (bisa pakai teks)

⚡ Powered by *AsakaProject*
        `.trim();

        if (media) {
            await chat.sendMessage(media, { caption: menuText });
        } else {
            await chat.sendMessage(menuText);
        }
    }
};