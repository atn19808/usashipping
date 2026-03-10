'use strict';

/**
 * Execution: Generate Price Report
 * Directive ref: directives/check_costco_prices.md — Step 3
 *
 * Takes enriched products (with livePrice) and writes a JSON + Markdown report
 * to the configured output directory.
 *
 * @param {Array<object>} enrichedProducts  Output of fetchCurrentPrices
 * @param {object} config
 * @param {string} config.outputDir   Directory to write reports into
 * @param {string} config.spreadsheetId
 * @returns {{ jsonPath: string, mdPath: string, summary: object }}
 */

const fs = require('fs');
const path = require('path');

function classifyProduct(product) {
  const { sheetPrice, livePrice, scrapeError } = product;

  if (scrapeError || livePrice === null) return 'scrape_failed';
  if (sheetPrice === null) return 'no_sheet_price';

  const delta = livePrice - sheetPrice;
  const deltaPercent = (delta / sheetPrice) * 100;

  if (Math.abs(deltaPercent) < 0.5) return 'match'; // within 0.5% tolerance for rounding
  return delta > 0 ? 'increase' : 'decrease';
}

function formatDelta(sheetPrice, livePrice) {
  if (sheetPrice === null || livePrice === null) return null;
  return parseFloat((livePrice - sheetPrice).toFixed(2));
}

function formatDeltaPercent(sheetPrice, livePrice) {
  if (sheetPrice === null || livePrice === null || sheetPrice === 0) return null;
  return parseFloat(((livePrice - sheetPrice) / sheetPrice * 100).toFixed(2));
}

function generatePriceReport(enrichedProducts, { outputDir, spreadsheetId }) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const generatedAt = new Date().toISOString();

  // Annotate every product with status and delta
  const annotated = enrichedProducts.map((p) => {
    const status = classifyProduct(p);
    const delta = formatDelta(p.sheetPrice, p.livePrice);
    const deltaPercent = formatDeltaPercent(p.sheetPrice, p.livePrice);
    return { ...p, status, delta, deltaPercent };
  });

  // Build summary counts
  const summary = {
    totalProducts: annotated.length,
    matched: annotated.filter((p) => p.status === 'match').length,
    increased: annotated.filter((p) => p.status === 'increase').length,
    decreased: annotated.filter((p) => p.status === 'decrease').length,
    noSheetPrice: annotated.filter((p) => p.status === 'no_sheet_price').length,
    scrapeFailed: annotated.filter((p) => p.status === 'scrape_failed').length
  };

  // ─── JSON report ────────────────────────────────────────────────────────────
  const jsonPath = path.join(outputDir, `price-check-${dateStr}.json`);
  const jsonPayload = {
    generatedAt,
    spreadsheetId,
    ...summary,
    products: annotated
  };
  fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2));

  // ─── Markdown report ─────────────────────────────────────────────────────────
  const mdPath = path.join(outputDir, `price-check-${dateStr}.md`);

  const increases = annotated.filter((p) => p.status === 'increase')
    .sort((a, b) => (b.deltaPercent || 0) - (a.deltaPercent || 0));
  const decreases = annotated.filter((p) => p.status === 'decrease')
    .sort((a, b) => (a.deltaPercent || 0) - (b.deltaPercent || 0));
  const noSheetPrice = annotated.filter((p) => p.status === 'no_sheet_price');
  const failures = annotated.filter((p) => p.status === 'scrape_failed');
  const matched = annotated.filter((p) => p.status === 'match');

  function priceCell(val) {
    return val !== null ? `$${val.toFixed(2)}` : '—';
  }
  function deltaCell(val, pct) {
    if (val === null) return '—';
    const sign = val > 0 ? '+' : '';
    return `${sign}$${val.toFixed(2)} (${sign}${pct.toFixed(1)}%)`;
  }

  const lines = [];

  lines.push(`# Costco Price Check — ${dateStr}`);
  lines.push('');
  lines.push(`**Generated:** ${generatedAt}  `);
  lines.push(`**Spreadsheet:** \`${spreadsheetId}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|---|---|');
  lines.push(`| Total products | ${summary.totalProducts} |`);
  lines.push(`| Price matched | ${summary.matched} |`);
  lines.push(`| Price increased | ${summary.increased} |`);
  lines.push(`| Price decreased | ${summary.decreased} |`);
  lines.push(`| No sheet price (live price only) | ${summary.noSheetPrice} |`);
  lines.push(`| Scrape failed | ${summary.scrapeFailed} |`);
  lines.push('');

  // Price Increases
  if (increases.length > 0) {
    lines.push('## Price Increases');
    lines.push('');
    lines.push('| Row | Product | Sheet Price | Live Price | Change |');
    lines.push('|---|---|---|---|---|');
    for (const p of increases) {
      lines.push(`| ${p.rowIndex} | ${p.name} | ${priceCell(p.sheetPrice)} | ${priceCell(p.livePrice)} | ${deltaCell(p.delta, p.deltaPercent)} |`);
    }
    lines.push('');
  }

  // Price Decreases
  if (decreases.length > 0) {
    lines.push('## Price Decreases');
    lines.push('');
    lines.push('| Row | Product | Sheet Price | Live Price | Change |');
    lines.push('|---|---|---|---|---|');
    for (const p of decreases) {
      lines.push(`| ${p.rowIndex} | ${p.name} | ${priceCell(p.sheetPrice)} | ${priceCell(p.livePrice)} | ${deltaCell(p.delta, p.deltaPercent)} |`);
    }
    lines.push('');
  }

  // No sheet price — show live prices for first-time population
  if (noSheetPrice.length > 0) {
    lines.push('## Live Prices (No Sheet Price to Compare)');
    lines.push('');
    lines.push('| Row | Product | Category | Live Price | Item # |');
    lines.push('|---|---|---|---|---|');
    for (const p of noSheetPrice) {
      lines.push(`| ${p.rowIndex} | ${p.name} | ${p.category || '—'} | ${priceCell(p.livePrice)} | ${p.itemNumber || '—'} |`);
    }
    lines.push('');
  }

  // Scrape failures
  if (failures.length > 0) {
    lines.push('## Scrape Failures');
    lines.push('');
    lines.push('| Row | Product | Error |');
    lines.push('|---|---|---|');
    for (const p of failures) {
      const err = (p.scrapeError || 'Unknown error').replace(/\|/g, '\\|');
      lines.push(`| ${p.rowIndex} | ${p.name} | ${err} |`);
    }
    lines.push('');
  }

  // Matched products (collapsed, less critical)
  if (matched.length > 0) {
    lines.push('## Matched (Price Unchanged)');
    lines.push('');
    lines.push('| Row | Product | Price |');
    lines.push('|---|---|---|');
    for (const p of matched) {
      lines.push(`| ${p.rowIndex} | ${p.name} | ${priceCell(p.livePrice)} |`);
    }
    lines.push('');
  }

  fs.writeFileSync(mdPath, lines.join('\n'));

  console.log(`\n[generatePriceReport] JSON report: ${jsonPath}`);
  console.log(`[generatePriceReport] Markdown report: ${mdPath}`);

  return { jsonPath, mdPath, summary };
}

module.exports = generatePriceReport;
