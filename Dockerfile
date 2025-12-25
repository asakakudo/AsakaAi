FROM ghcr.io/puppeteer/puppeteer:latest

# Pindah ke user root sementara untuk mengatur folder
USER root

# Tentukan direktori kerja
WORKDIR /usr/src/app

# Copy package files duluan agar build lebih cepat (caching)
COPY package*.json ./

# Perbaiki izin akses folder agar bisa ditulis oleh npm
RUN chown -R pptruser:pptruser /usr/src/app

# Balik ke user pptruser (standar image puppeteer) untuk install & jalankan bot
USER pptruser

# Install dependencies (sekarang sudah punya izin akses)
RUN npm install

# Copy sisa file project
COPY --chown=pptruser:pptruser . .

# Jalankan aplikasi
CMD ["node", "index.js"]
