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
        const images = fs.readdirSync(imageDir)
            .filter(file => /\.(png|jpe?g|webp)$/i.test(file));

        let media = null;

        if (images.length > 0) {
            const randomImage =
                images[Math.floor(Math.random() * images.length)];

            const imagePath = path.join(imageDir, randomImage);
            media = MessageMedia.fromFilePath(imagePath);
        }

        const menuText = `
✨ *Halo, ${name}!* ✨
Selamat datang di **AsaAi**

📅 *Tanggal:* ${tanggal}
⏰ *Waktu:* ${waktu}

--- 🛠️ **COMMAND LIST** ---

(on development, kalo ownernya ga sibuk scroll ig ama fesnuk)

🚀 **Main Menu**
├ !menu - Menampilkan menu
└ !ping - Cek bot

🤖 **AI & Chat**
├ !ai [tanya] - Tanya apa saja ke AI
├ !toanime - ubah gambar jadi anime
├ !tofigure - ubah gambar jadi figur
├ !tohijab - ubah gambar jadi berhijab
├ !hitamkan - RAMAIKAN LALU HITAMKAN🔥🔥
├ !waifu2x - ubah foto anime lu jadi hd
├ !upscaler / !remini - ubah semua foto jadi makin HD
├ !removebg - hapus background gambar
└ !edit [prompt] - Edit gambar dengan prompt ai


📥 **Downloader**
├ !dl [link] - Download Media dari berbagai platform
├ !fb [link] - Download Facebook Video
├ !tw [link] - Download Twitter Video
├ !tt [link] - Download TikTok Video
├ !ytmp4 [link] - Download YT Video
├ !ytmp3 [link] - Download YT Audio (MP3)
└ !ig [link] - Download Instagram Video

🎨 **Media & Tools**
├ !s - Ubah gambar jadi stiker


--- 📜 **INFO** ---
Bot nya jangan di spam ya anjg soalnya ownernya masi belum pake vps wkwk. Jika bot tidak merespons, kemungkinan server sedang maintenance atau ownernya belum nyalain laptop.

Powered by *AsakaProject* ⚡
        `.trim();

        // KIRIM MENU + GAMBAR
        if (media) {
            await chat.sendMessage(media, { caption: menuText });
        } else {
            await chat.sendMessage(menuText);
        }

    }
};