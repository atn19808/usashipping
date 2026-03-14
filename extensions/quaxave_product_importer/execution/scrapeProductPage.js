'use strict';

/**
 * Execution: Scrape Costco Product Page via Puppeteer + residential proxy
 * Directive ref: directives/import_costco_product.md — Step 2
 *
 * Requires: PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS env vars
 *
 * @param {string} url  Validated Costco product page URL
 * @returns {Promise<{
 *   name: string|null,
 *   price: number|null,
 *   itemNumber: string,
 *   weight: number|null,
 *   features: string[],
 *   imageUrls: string[]
 * }>}
 */

const puppeteer = require('puppeteer');

const NAVIGATION_TIMEOUT = 45000;
const IDLE_WAIT_MS = 3000;

async function scrapeProductPage(url) {
  const { PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS } = process.env;

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--window-size=1366,768',
    `--user-data-dir=${require('os').tmpdir()}/costco-scraper-profile`,
  ];

  if (PROXY_HOST && PROXY_PORT) {
    args.push(`--proxy-server=${PROXY_HOST}:${PROXY_PORT}`);
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args });

    const page = await browser.newPage();

    if (PROXY_USER && PROXY_PASS) {
      await page.authenticate({ username: PROXY_USER, password: PROXY_PASS });
    }

    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

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
      // No banner — continue
    }

    await page.waitForSelector('h1', { timeout: NAVIGATION_TIMEOUT });
    await new Promise((r) => setTimeout(r, IDLE_WAIT_MS));

    // Expand accordions (Product Details, Specifications, etc.)
    await page.evaluate(() => {
      document.querySelectorAll('[class*="MuiAccordion"] button[aria-expanded="false"]').forEach((btn) => btn.click());
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Scroll through the page to trigger lazy-loaded carousel images
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 500));

    const data = await page.evaluate(() => {
      const name = document.querySelector('h1')?.textContent.trim() || null;

      // Try automation-id first (most reliable), then fall back to MUI text search
      let price = null;
      const autoIdPriceEl = document.querySelector('[automation-id="product-price"]');
      if (autoIdPriceEl) {
        const m = autoIdPriceEl.textContent.replace(/,/g, '').match(/\d+\.\d{2}/);
        if (m) price = parseFloat(m[0]);
      }
      if (price === null) {
        // Find deepest MUI leaf element whose own text starts with $ and is short
        const muiEls = Array.from(document.querySelectorAll('[class*="Mui"]'));
        const priceEl = muiEls.find((el) => {
          const t = el.textContent.trim();
          if (!/^\$[0-9]/.test(t)) return false;
          // Prefer elements where the first price-like token is the whole short text
          const firstPrice = t.match(/^\$[\d,]+\.\d{2}/);
          return firstPrice && firstPrice[0].length >= t.length - 1;
        });
        if (priceEl) {
          const m = priceEl.textContent.replace(/,/g, '').match(/\d+\.\d{2}/);
          if (m) price = parseFloat(m[0]);
        }
      }

      const bodyText = document.body.innerText;
      const itemMatch = bodyText.match(/Item\s*#?\s*([0-9]{6,})/i);
      const itemNumber = itemMatch ? itemMatch[1] : `costco-${Date.now()}`;

      const weightMatch = bodyText.match(/Weight[:\s]+([0-9.]+)\s*(lb|lbs|oz|kg|g\b)/i);
      const weight = weightMatch ? parseFloat(weightMatch[1]) : null;

      // Collect images from src and data-src; drop the /__[0-9] restriction
      // which is too strict for products using paths like /__web/ or hash-based paths
      const imageUrls = [...new Set(
        Array.from(document.querySelectorAll('img'))
          .flatMap((img) => [img.src, img.dataset.src, img.getAttribute('data-lazy-src')].filter(Boolean))
          .filter((src) => src.includes('bfasset.costco-static.com'))
          .map((src) => {
            const base = src.split('?')[0];
            return `${base}?format=jpg&width=1024&height=1024&fit=bounds&canvas=1024,1024`;
          })
      )];

      const features = Array.from(document.querySelectorAll('.MuiListItemText-root'))
        .map((el) => el.textContent.trim())
        .filter((t) => t.length > 0 && t.length < 300);

      return { name, price, itemNumber, weight, imageUrls, features };
    });

    return {
      name: data.name,
      price: data.price,
      itemNumber: data.itemNumber,
      weight: data.weight,
      features: data.features || [],
      imageUrls: data.imageUrls
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = scrapeProductPage;
