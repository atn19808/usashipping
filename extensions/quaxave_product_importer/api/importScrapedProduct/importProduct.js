/**
 * Directive: import_costco_product — Steps 3 & 4
 * Downloads + uploads images (Step 3) then creates the EverShop product (Step 4).
 */
const {
  OK,
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const downloadAndUploadImages = require('../../execution/downloadAndUploadImages');
const createEverShopProduct = require('../../execution/createEverShopProduct');

module.exports = async (request, response, delegate, next) => {
  const { name, price, weight, features, sku, imageUrls, url_key } = request.body || {};

  if (!name || price == null || !sku) {
    return response.status(INVALID_PAYLOAD).json({
      error: { status: INVALID_PAYLOAD, message: 'name, price, and sku are required' }
    });
  }

  try {
    // Step 3 — Download and upload images
    const uploadedImageUrls = await downloadAndUploadImages(
      Array.isArray(imageUrls) ? imageUrls : []
    );

    // Step 4 — Create EverShop product
    const product = await createEverShopProduct({
      name,
      sku,
      price,
      weight,
      features: Array.isArray(features) ? features : [],
      imageUrls: uploadedImageUrls,
      url_key
    });

    return response.status(OK).json({
      data: {
        ...product,
        links: [
          {
            rel: 'edit',
            href: product.editUrl,
            action: 'GET',
            types: ['text/html']
          }
        ]
      }
    });
  } catch (e) {
    console.error('[importScrapedProduct] Error:', e.message);
    return response.status(INTERNAL_SERVER_ERROR).json({
      error: { status: INTERNAL_SERVER_ERROR, message: e.message || 'Import failed' }
    });
  }
};
