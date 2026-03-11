'use strict';

/**
 * Execution: Scrape Costco Product Page
 * Directive ref: directives/import_costco_product.md — Step 2
 *
 * @param {string} url  Validated Costco product page URL
 * @returns {Promise<{
 *   name: string|null,
 *   price: number|null,
 *   itemNumber: string,
 *   weight: number|null,
 *   description: string,
 *   imageUrls: string[]
 * }>}
 */

const puppeteer = require('puppeteer');

const NAVIGATION_TIMEOUT = 45000;
const IDLE_WAIT_MS = 3000;

async function scrapeProductPage(url) {
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
        `--user-data-dir=${require('os').tmpdir()}/costco-scraper-profile`
      ]
    });

    const page = await browser.newPage();
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

    // Wait for the product title H1 to confirm page loaded
    await page.waitForSelector('h1', { timeout: NAVIGATION_TIMEOUT });
    await new Promise((r) => setTimeout(r, IDLE_WAIT_MS));

    // Expand all accordions (Product Details, Specifications, etc.)
    await page.evaluate(() => {
      document.querySelectorAll('[class*="MuiAccordion"] button[aria-expanded="false"]').forEach((btn) => btn.click());
    });
    await new Promise((r) => setTimeout(r, 1500));

    const data = await page.evaluate(() => {
      // --- Name ---
      const name = document.querySelector('h1')?.textContent.trim() || null;

      // --- Price ---
      // Find the first MUI element whose text starts with "$NN.NN"
      const priceEl = Array.from(document.querySelectorAll('[class*="Mui"]'))
        .find((el) => /^\$[0-9]/.test(el.textContent.trim()) && el.textContent.trim().length < 20);
      const priceRaw = priceEl ? priceEl.textContent.trim() : '';
      const priceMatch = priceRaw.replace(/,/g, '').match(/\d+\.\d{2}/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : null;

      // --- Item Number ---
      // Extract from body text: "Item #XXXXXX" pattern (6+ digits)
      const bodyText = document.body.innerText;
      const itemMatch = bodyText.match(/Item\s*#?\s*([0-9]{6,})/i);
      const itemNumber = itemMatch ? itemMatch[1] : `costco-${Date.now()}`;

      // --- Weight ---
      // Look for weight in spec table rows or body text
      const weightMatch = bodyText.match(/Weight[:\s]+([0-9.]+)\s*(lb|lbs|oz|kg|g\b)/i);
      const weight = weightMatch ? parseFloat(weightMatch[1]) : null;

      // --- Images ---
      // Costco now uses bfasset.costco-static.com CDN
      // Product shots have "__N" in their path (e.g. 416076-847__1, 416076-847__2)
      // Request 1024×1024 for good resolution
      const imageUrls = [...new Set(
        Array.from(document.querySelectorAll('img'))
          .filter((img) => img.src && img.src.includes('bfasset.costco-static.com') && /__[0-9]/.test(img.src))
          .map((img) => {
            const base = img.src.split('?')[0];
            return `${base}?auto=webp&format=jpg&width=1024&height=1024&fit=bounds&canvas=1024,1024`;
          })
      )];

      // --- Description ---
      // Combine product feature bullets + spec table rows
      const features = Array.from(document.querySelectorAll('.MuiListItemText-root'))
        .map((el) => el.textContent.trim())
        .filter((t) => t.length > 0 && t.length < 300);

      const specRows = Array.from(document.querySelectorAll('table tr'))
        .map((el) => el.textContent.trim())
        .filter((t) => t.length > 0 && t.length < 200);

      const description = [
        features.length > 0 ? '<ul>' + features.map((f) => `<li>${f}</li>`).join('') + '</ul>' : '',
        specRows.length > 0 ? '<ul>' + specRows.map((r) => `<li>${r}</li>`).join('') + '</ul>' : ''
      ].filter(Boolean).join('');

      return { name, price, itemNumber, weight, imageUrls, description };
    });

    return {
      name: data.name,
      price: data.price,
      itemNumber: data.itemNumber,
      weight: data.weight,
      description: data.description || '',
      imageUrls: data.imageUrls
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = scrapeProductPage;
