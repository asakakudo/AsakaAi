FROM ghcr.io/puppeteer/puppeteer:latest

# Pindah ke direktori kerja
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua file project
COPY . .

# Jalankan bot
CMD ["node", "index.js"]