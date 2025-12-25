FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Instal library tambahan untuk sistem (opsional tapi disarankan)
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Buat folder auth secara manual dan beri izin ke pptruser
RUN mkdir -p .wwebjs_auth && chown -R pptruser:pptruser /usr/src/app

COPY --chown=pptruser:pptruser package*.json ./

USER pptruser

RUN npm install

COPY --chown=pptruser:pptruser . .

CMD ["node", "index.js"]
