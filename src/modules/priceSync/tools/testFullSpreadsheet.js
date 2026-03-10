/**
 * Test price fetching on the entire Costco Google Sheet
 */

const { google } = require('googleapis');
const { CostcoPriceFetcher } = require('./priceFetcher');
const { PriceComparer } = require('./priceComparer');
const path = require('path');

async function testFullSpreadsheet() {
  console.log('🚀 Testing price fetching on entire Costco spreadsheet...\n');

  try {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: path.resolve('./config/costco-price-service-account.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1fxkYVfTY-3gz_KbJgcUT0Ul8hoqj18vJHYNN6trZp-I';

    // Read the spreadsheet data
    console.log('📊 Reading spreadsheet data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Costco!A:J'
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      throw new Error('No data found in spreadsheet');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Find column indices - handle multiple "Link" columns
    const nameCol = headers.indexOf('Name');
    const categoryCol = headers.indexOf('Category');
    
    // Find the correct link column (there are two "Link" columns in the sheet)
    const linkColumns = headers.map((header, index) => ({ header, index }))
      .filter(item => item.header === 'Link');
    
    console.log(`📈 Found ${dataRows.length} products in spreadsheet`);
    console.log(`   Name column: ${nameCol}`);
    console.log(`   Category column: ${categoryCol}`);
    console.log(`   Link columns found: ${linkColumns.map(lc => `${lc.header} (col ${lc.index})`).join(', ')}`);

    // Debug: Show what's in each link column for first few rows
    console.log('\n🔍 Debug: Link column contents:');
    dataRows.slice(0, 3).forEach((row, i) => {
      console.log(`   Row ${i + 2}:`);
      linkColumns.forEach((lc, j) => {
        console.log(`      Link Column ${j + 1} (${lc.index}): "${row[lc.index] || '(empty)'}"`);
      });
    });

    // Use the second Link column (index H, which should contain the actual URLs)
    const linkCol = linkColumns.length > 1 ? linkColumns[1].index : linkColumns[0].index;
    
    console.log(`   Using Link column: ${linkCol} (${linkColumns.find(lc => lc.index === linkCol)?.header})`);

    // Debug: Show first few rows with the correct column
    console.log('\n🔍 Debug: First 3 rows with correct link column:');
    dataRows.slice(0, 3).forEach((row, i) => {
      console.log(`   Row ${i + 2}: Name="${row[nameCol]}" Link="${row[linkCol]}"`);
    });

    // Filter for products with both name and link
    const validProducts = dataRows
      .map((row, index) => ({
        rowIndex: index + 2, // +2 because we start from row 2 (after header)
        name: row[nameCol] || '',
        link: row[linkCol] || '',
        category: row[categoryCol] || ''
      }))
      .filter(product => {
        const hasName = product.name && product.name.trim().length > 0;
        const hasLink = product.link && product.link.trim().length > 0;
        const isCostcoLink = product.link && (
          product.link.includes('costco.com') || 
          product.link.includes('.product.') ||
          product.link.startsWith('https://')
        );
        
        // Debug: Show filtering results for first few products
        if (product.rowIndex <= 5) {
          console.log(`   Row ${product.rowIndex}: hasName=${hasName}, hasLink=${hasLink}, isCostcoLink=${isCostcoLink}`);
          console.log(`      Link: "${product.link}"`);
        }
        
        return hasName && hasLink && isCostcoLink;
      });

    console.log(`✅ Found ${validProducts.length} valid products with Costco links`);
    
    // Remove the fallback logic since we should have valid products now
    if (validProducts.length === 0) {
      console.log('\n❌ Still no valid products found after using correct column.');
      console.log('   Check if the URLs are in a different column or format.');
      return;
    }

    // Initialize tools
    const fetcher = new CostcoPriceFetcher({ 
      headless: "new",
      debug: false // Set to true if you want detailed debug info
    });
    const comparer = new PriceComparer();

    // Process products in batches
    const results = [];
    const batchSize = 5; // Small batch size to be respectful to Costco

    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(validProducts.length / batchSize);

      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} products)`);
      console.log('================================================================================');

      for (const product of batch) {
        console.log(`[${product.rowIndex}] ${product.name}`);
        console.log(`   🔗 ${product.link}`);

        try {
          const result = await fetcher.fetchPrice(product.link);

          if (result.success) {
            console.log(`   💰 Price: $${result.price} (${result.selector})`);

            // Compare with price history - add error handling
            try {
              const comparison = comparer.compareAndUpdate(
                product.name,
                product.link,
                result.price
              );

              if (comparison.change) {
                const symbol = comparison.change === 'INCREASE' ? '📈' : '📉';
                console.log(`   ${symbol} ${comparison.change}: $${comparison.previousPrice} → $${result.price} (${comparison.changePercent > 0 ? '+' : ''}${comparison.changePercent.toFixed(1)}%)`);
              }

              results.push({
                ...product,
                ...result,
                comparison
              });

            } catch (compareError) {
              console.log(`   ⚠️ Price comparison failed: ${compareError.message}`);
              
              // Still save the successful price extraction
              results.push({
                ...product,
                ...result,
                comparison: null
              });
            }

          } else {
            console.log(`   ❌ Failed: ${result.error}`);
            results.push({
              ...product,
              success: false,
              error: result.error
            });
          }

        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          results.push({
            ...product,
            success: false,
            error: error.message
          });
        }

        console.log(''); // Blank line for readability
      }

      // Rate limiting between batches
      if (i + batchSize < validProducts.length) {
        console.log('⏳ Waiting 10 seconds before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Save price history
    comparer.savePriceHistory();

    // Generate summary report
    console.log('\n📋 FULL SPREADSHEET TEST SUMMARY');
    console.log('================================================================================');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const priceChanges = results.filter(r => r.comparison?.change);
    const significantChanges = results.filter(r => r.comparison?.isSignificant);
    const suspicious = results.filter(r => r.comparison?.isSuspicious);
    
    console.log(`📊 Total products processed: ${results.length}`);
    console.log(`✅ Successful price extractions: ${successful.length}`);
    console.log(`❌ Failed extractions: ${failed.length}`);
    console.log(`🔄 Products with price changes: ${priceChanges.length}`);
    console.log(`⚠️  Significant changes (>5%): ${significantChanges.length}`);
    console.log(`⚠️  Suspicious changes: ${suspicious.length}`);
    
    if (successful.length > 0) {
      const avgPrice = successful.reduce((sum, r) => sum + r.price, 0) / successful.length;
      console.log(`💰 Average price: $${avgPrice.toFixed(2)}`);
    }

    if (failed.length > 0) {
      console.log('\n❌ FAILED EXTRACTIONS:');
      failed.slice(0, 5).forEach(item => {
        console.log(`   - ${item.name}: ${item.error}`);
      });
      if (failed.length > 5) {
        console.log(`   ... and ${failed.length - 5} more`);
      }
    }

    if (significantChanges.length > 0) {
      console.log('\n🚨 SIGNIFICANT PRICE CHANGES:');
      significantChanges.forEach(item => {
        const symbol = item.comparison.change === 'INCREASE' ? '📈' : '📉';
        console.log(`   ${symbol} ${item.name}`);
        console.log(`      $${item.comparison.previousPrice} → $${item.price} (${item.comparison.changePercent > 0 ? '+' : ''}${item.comparison.changePercent.toFixed(1)}%)`);
      });
    }

    if (suspicious.length > 0) {
      console.log('\n⚠️  SUSPICIOUS PRICE CHANGES (possible extraction errors):');
      suspicious.forEach(item => {
        console.log(`   ❓ ${item.name}`);
        console.log(`      $${item.comparison.previousPrice} → $${item.price} (confidence: ${item.confidence})`);
      });
      
      console.log('\n💡 Next steps for suspicious changes:');
      console.log('   1. Manually verify prices on Costco website');
      console.log('   2. Check price extraction logic for these products');
      console.log('   3. Consider manual price overrides if needed');
    }

    // Save results to file for further analysis
    const fs = require('fs');
    const resultsPath = './data/costco-price-test-results.json';
    
    // Ensure data directory exists
    const dataDir = path.dirname(resultsPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      successful: successful.length,
      failed: failed.length,
      priceChanges: priceChanges.length,
      results: results
    }, null, 2));

    console.log(`\n💾 Results saved to: ${resultsPath}`);
    console.log('\n✅ Full spreadsheet test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testFullSpreadsheet().catch(console.error);
}

module.exports = { testFullSpreadsheet };
