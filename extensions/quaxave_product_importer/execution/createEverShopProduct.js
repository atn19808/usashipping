'use strict';

/**
 * Execution: Create EverShop Product Record
 * Directive ref: directives/import_costco_product.md — Step 4
 *
 * @param {{
 *   name: string,
 *   sku: string,
 *   price: number,
 *   weight: number,
 *   description: string,
 *   imageUrls: string[]
 * }} productData
 * @returns {Promise<{ uuid: string, productId: number, editUrl: string }>}
 * @throws {Error} "SKU already exists: <sku>" on duplicate
 */

const createProduct = require('@evershop/evershop/src/modules/catalog/services/product/createProduct');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');

function toEditorJson(features) {
  if (!features || features.length === 0) return JSON.stringify([]);
  return JSON.stringify([
    {
      id: 'row-1',
      size: 1,
      columns: [
        {
          id: 'col-1',
          size: 1,
          data: {
            time: Date.now(),
            blocks: [{ id: 'blk-1', type: 'list', data: { items: features } }],
            version: '2.30.2'
          }
        }
      ]
    }
  ]);
}

async function createEverShopProduct({ name, sku, price, weight, features, imageUrls }) {
  const url_key = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let product;
  try {
    product = await createProduct(
      {
        name,
        sku,
        price: parseFloat(price),
        weight: weight ? parseFloat(weight) : 0,
        qty: 100,
        status: 1,
        visibility: 1,
        group_id: 1,
        url_key,
        description: toEditorJson(features),
        images: imageUrls || []
      },
      { routeId: 'importScrapedProduct' }
    );
  } catch (err) {
    if (err.message && err.message.includes('unique constraint')) {
      throw new Error(`SKU already exists: ${sku}`);
    }
    throw err;
  }

  return {
    uuid: product.uuid,
    productId: product.product_id,
    editUrl: buildUrl('productEdit', { id: product.uuid })
  };
}

module.exports = createEverShopProduct;
