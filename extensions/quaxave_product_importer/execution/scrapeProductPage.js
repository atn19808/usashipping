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
const os = require('os');
const path = require('path');
const fs = require('fs');

// Puppeteer's auto-discovery can fail on Windows. Try the bundled cache path
// first, then fall back to a standard system Chrome installation.
function getChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  // Prefer stable system Chrome over puppeteer's bundled binary, which may be
  // a canary build missing required runtime DLLs on some Windows machines.
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  const system = candidates.find(p => fs.existsSync(p));
  if (system) return system;
  // Fall back to puppeteer's bundled binary as last resort
  try {
    const p = puppeteer.executablePath();
    if (fs.existsSync(p)) return p;
  } catch { /* ignore */ }
  return undefined;
}

const NAVIGATION_TIMEOUT = 90000;
const IDLE_WAIT_MS = 5000;

async function scrapeProductPage(url) {
  const { PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS } = process.env;

  // Unique profile dir per invocation — prevents Akamai cookies from one
  // product carrying over to the next via a shared browser profile.
  const userDataDir = path.join(os.tmpdir(), `costco-scraper-${Date.now()}`);

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--window-size=1366,768',
    `--user-data-dir=${userDataDir}`,
  ];

  if (PROXY_HOST && PROXY_PORT) {
    args.push(`--proxy-server=${PROXY_HOST}:${PROXY_PORT}`);
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args, executablePath: getChromePath() });

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

    // Use 'load' (not 'networkidle2') so Puppeteer doesn't falsely resolve between
    // Akamai JS challenge redirects — we rely on waitForSelector('h1') below to
    // confirm the actual product page has loaded.
    await page.goto(url, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT });

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

    // Wait for the price element to render — proxy latency and Akamai challenge
    // cycles can significantly delay React hydration. 40s gives enough headroom
    // for 3 challenge redirects + final page render on a slow residential IP.
    try {
      await page.waitForSelector('[data-testid="single-price-content"]', { timeout: 40000 });
    } catch {
      // Price element didn't appear — will try to extract anyway
    }

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

      // Price extraction using Costco's data-testid attributes (confirmed via DevTools).
      // Structure: [data-testid="single-price-content"] contains currency + whole + decimal spans.
      // Falls back to MUI text search only if data-testid elements are absent.
      let price = null;

      // Members-only pages show "Sign In for Price" instead of a price — return null immediately.
      // This text only appears in the product pricing area on restricted items.
      const signInEl = document.querySelector('[data-testid*="sign-in-price"], [data-testid*="signin-price"], [data-testid*="signInForPrice"]');
      const hasMembersOnlyText = /Sign\s+In\s+for\s+Price|Members\s+Only\s+Price/i.test(document.body.innerText);
      if (signInEl || hasMembersOnlyText) {
        return { name, price: null, itemNumber: `costco-${Date.now()}`, weight: null, imageUrls: [], features: [], membersOnly: true };
      }

      const priceContentEl = document.querySelector('[data-testid="single-price-content"]');
      if (priceContentEl) {
        const raw = priceContentEl.textContent.replace(/,/g, '').trim();
        // raw is something like "$18.99" or "$18" + superscript "99" → combine digits
        const m = raw.match(/[\d]+\.[\d]{2}/) || raw.match(/\$([\d]+)/);
        if (m) {
          price = parseFloat(m[0].replace('$', ''));
        } else {
          // whole value and cents may be in separate spans with no dot between them
          const whole = document.querySelector('[data-testid="Text_single-price-whole-value"]')?.textContent.trim();
          const cents = document.querySelector('[data-testid="Text_single-price-decimal-value"]')?.textContent.trim();
          if (whole) price = parseFloat(`${whole}.${cents || '00'}`);
        }
      }

      if (price === null) {
        // MUI fallback: price >= $8 to exclude delivery fees ($3.00), not in shipping section
        const muiEls = Array.from(document.querySelectorAll('[class*="Mui"]'));
        const priceEl = muiEls.find((el) => {
          const t = el.textContent.trim();
          if (!/^\$[0-9]/.test(t)) return false;
          const firstPrice = t.match(/^\$[\d,]+\.\d{2}/);
          if (!firstPrice || firstPrice[0].length < t.length - 1) return false;
          const val = parseFloat(firstPrice[0].replace(/[$,]/g, ''));
          if (val < 8) return false;
          let node = el.parentElement;
          while (node && node !== document.body) {
            if (/delivery|shipping|freight/i.test(node.textContent.slice(0, 60))) return false;
            node = node.parentElement;
          }
          return true;
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
    // Clean up the temp profile dir so they don't accumulate
    try { require('fs').rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

module.exports = scrapeProductPage;
