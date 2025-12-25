FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Instal dependensi sistem dan gosu untuk manajemen user
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    gosu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files sesuai struktur repo Anda
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy sisa kode project
COPY . .

# Pastikan folder auth ada
RUN mkdir -p .wwebjs_auth

# Gunakan ENTRYPOINT untuk memperbaiki izin Volume dan jalankan sebagai pptruser menggunakan gosu
ENTRYPOINT ["/bin/sh", "-c", "chown -R pptruser:pptruser /usr/src/app && exec gosu pptruser node index.js"]
