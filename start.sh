#!/bin/bash
apt-get install -y --no-install-recommends \
  libnspr4 libnss3 libnssutil3 libsmime3 \
  libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 \
  libcups2 libxkbcommon0 libgbm1 libasound2 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
  libdbus-1-3 libfontconfig1 libx11-xcb1 libxcb1 \
  libxcursor1 libxi6 libxrender1 libxss1 libxtst6 \
  fonts-liberation libgcc1 libstdc++6 \
  2>/dev/null
mkdir -p /home/home/media
rm -rf media
ln -sfn /home/home/media media
node_modules/@evershop/evershop/bin/evershop start
