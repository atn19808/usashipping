'use strict';

/**
 * Execution: Download Remote Images and Upload to EverShop Media Storage
 * Directive ref: directives/import_costco_product.md — Step 3
 *
 * @param {string[]} imageUrls  Array of remote image URLs to download and upload
 * @returns {Promise<string[]>}  EverShop static asset URLs for successfully uploaded images
 */

const path = require('path');
const https = require('https');
const http = require('http');
const { uploadFile } = require('@evershop/evershop/src/modules/cms/services/uploadFile');
const {
  generateFileName
} = require('@evershop/evershop/src/modules/cms/services/generateFileName');

function downloadImageBuffer(imageUrl) {
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https') ? https : http;
    const req = client.get(imageUrl, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadImageBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${imageUrl}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Image download timed out'));
    });
  });
}

async function downloadAndUploadImages(imageUrls) {
  const uploaded = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const buffer = await downloadImageBuffer(imageUrls[i]);
      const ext = path.extname(new URL(imageUrls[i]).pathname) || '.jpg';
      const filename = generateFileName(`costco-product-${i + 1}${ext}`);

      const results = await uploadFile(
        [{ filename, buffer, minetype: 'image/jpeg', size: buffer.length }],
        'products/costco'
      );
      uploaded.push(results[0].url);
    } catch (err) {
      console.error(`[downloadAndUploadImages] Skipping image ${i + 1}: ${err.message}`);
    }
  }

  return uploaded;
}

module.exports = downloadAndUploadImages;
