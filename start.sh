#!/bin/bash
mkdir -p /home/media
rm -rf media
ln -sfn /home/media media
node_modules/@evershop/evershop/bin/evershop start
