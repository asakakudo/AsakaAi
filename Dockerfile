FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Instal dependensi sistem dan su-exec untuk manajemen user
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    su-exec \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy sisa kode project
COPY . .

# Pastikan folder auth ada
RUN mkdir -p .wwebjs_auth

# Gunakan ENTRYPOINT untuk memperbaiki izin Volume setiap kali bot start
# Kemudian jalankan bot sebagai pptruser menggunakan su-exec
ENTRYPOINT ["/bin/sh", "-c", "chown -R pptruser:pptruser /usr/src/app && exec su-exec pptruser node index.js"]
