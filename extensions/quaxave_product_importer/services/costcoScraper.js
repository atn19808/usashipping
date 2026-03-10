'use strict';

/**
 * Scrapes a Costco product page using Puppeteer.
 *
 * Returns: { name, price, weight, description, itemNumber, imageUrls }
 */

const puppeteer = require('puppeteer');

const NAVIGATION_TIMEOUT = 45000;
const IDLE_WAIT_MS = 2000;

/**
 * @param {string} url  A Costco product page URL
 */
async function scrapeCostcoProduct(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1366,768',
        '--user-data-dir=/tmp/costco-scraper-profile'
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Hide automation signals
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });

    // Dismiss OneTrust cookie banner if present
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await page.click('#onetrust-accept-btn-handler');
      await new Promise((r) => setTimeout(r, 1000));
    } catch {
      // No cookie banner — continue
    }

    // Wait for product title to confirm page loaded
    await page.waitForSelector('[automation-id="product-Title"]', {
      timeout: NAVIGATION_TIMEOUT
    });

    await new Promise((r) => setTimeout(r, IDLE_WAIT_MS));

    const productData = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      // Product name
      const name =
        getText('[automation-id="product-Title"]') ||
        getText('h1.product-title') ||
        getText('h1');

      // Price — parse first "XX.XX" numeric pattern
      const priceRaw =
        getText('[automation-id="product-price"]') ||
        getText('.product-price span') ||
        '';
      const priceMatch = priceRaw.replace(/,/g, '').match(/\d+\.\d{2}/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : null;

      // Item number (used as SKU)
      const itemNumberRaw =
        getText('[automation-id="product-ItemNumber"]') ||
        getText('.item-number') ||
        '';
      const itemNumberMatch = itemNumberRaw.match(/\d+/);
      const itemNumber = itemNumberMatch ? itemNumberMatch[0] : `costco-${Date.now()}`;

      // Weight — look in specs table for "net weight N lb/oz/kg"
      const specsText = document.querySelector('.product-info-specs-table')?.textContent || '';
      const weightMatch = specsText.match(/net\s+weight[^0-9]*([0-9.]+)\s*(lb|lbs|oz|kg)/i);
      const weight = weightMatch ? parseFloat(weightMatch[1]) : null;

      // Description HTML
      const descEl = document.querySelector('[automation-id="product-Description"]');
      const featuresEl = document.querySelector('.product-info-overview-description');
      const description =
        (descEl ? descEl.innerHTML : '') +
        (featuresEl ? featuresEl.innerHTML : '');

      // Images — from carousel slides, strip CDN size params for full-res
      const imgEls = Array.from(
        document.querySelectorAll(
          '.product-image-slide img, [automation-id="product-image"] img'
        )
      );
      const imageUrls = [...new Set(
        imgEls
          .map((img) => img.src || img.dataset.src)
          .filter((src) => src && src.startsWith('http') && !src.includes('placeholder'))
          .map((src) => src.replace(/\?\$[A-Z_]+\$.*/, ''))
      )];

      return { name, price, itemNumber, weight, description, imageUrls };
    });

    // If no images from static DOM, scroll to trigger lazy-load and retry
    if (productData.imageUrls.length === 0) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await new Promise((r) => setTimeout(r, 1500));

      const lazyImages = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img[data-src], img[loading="lazy"]'))
          .map((img) => img.dataset.src || img.src)
          .filter((src) => src && src.startsWith('http') && src.includes('costco'))
      );
      productData.imageUrls = [...new Set(lazyImages)];
    }

    return {
      name: productData.name,
      price: productData.price,
      weight: productData.weight,
      description: productData.description || '',
      itemNumber: productData.itemNumber,
      imageUrls: productData.imageUrls
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = scrapeCostcoProduct;
