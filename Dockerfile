FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Instal dependensi sistem yang diperlukan
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy sisa kode project
COPY . .

# --- BAGIAN PENTING UNTUK VOLUME ---
# Pastikan folder auth ada dan dimiliki oleh pptruser
RUN mkdir -p .wwebjs_auth && chown -R pptruser:pptruser /usr/src/app

# Jalankan perintah perbaikan izin setiap kali container start
# Ini memastikan Volume yang di-mount tetap bisa ditulis oleh bot
ENTRYPOINT ["/bin/sh", "-c", "chown -R pptruser:pptruser /usr/src/app/.wwebjs_auth && exec run-user pptruser node index.js"]
