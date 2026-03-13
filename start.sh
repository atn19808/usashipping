#!/bin/bash
apt-get install -y --no-install-recommends \
  libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libxkbcommon0 libatspi2.0-0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
  2>/dev/null
mkdir -p /home/home/media
rm -rf media
ln -sfn /home/home/media media
node_modules/@evershop/evershop/bin/evershop start
