#!/bin/bash
mkdir -p /home/home/media
rm -rf media
ln -sfn /home/home/media media
node_modules/@evershop/evershop/bin/evershop start
