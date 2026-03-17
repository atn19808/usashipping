const { OK, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const { getContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { getCartByUUID } = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const { saveCart } = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { createNewCart } = require('@evershop/evershop/src/modules/checkout/services/createNewCart');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

/**
 * POST /api/cart/mine/sync
 *
 * Applies a full cart diff in a single load → mutate → save cycle instead of
 * N sequential API calls. Reduces DB round trips from O(N) to O(1).
 *
 * Body: {
 *   toDelete: string[],              // item UUIDs to remove
 *   toAdd:    { sku: string, qty: number }[],  // items to add
 *   toUpdate: { itemId: string, qty: number, action: 'increase'|'decrease' }[]
 * }
 */
module.exports = async (request, response, delegate, next) => {
  try {
    const cartId = getContextValue(request, 'cartId');

    const { toDelete = [], toAdd = [], toUpdate = [] } = request.body || {};

    if (toDelete.length === 0 && toAdd.length === 0 && toUpdate.length === 0) {
      response.status(OK);
      response.$body = { data: { success: true } };
      return next();
    }

    let cart;
    if (!cartId) {
      // No server cart yet — create one so toAdd items can be inserted
      const { sessionID, customer } = request.locals;
      cart = await createNewCart(sessionID, customer || {});
    } else {
      cart = await getCartByUUID(cartId);
    }
    if (!cart) {
      response.status(OK);
      response.$body = { data: { success: false, error: 'Cart not found' } };
      return next();
    }

    // Apply removals
    for (const itemId of toDelete) {
      try { await cart.removeItem(itemId); } catch { /* item may already be gone */ }
    }

    // Apply qty updates
    for (const { itemId, qty, action } of toUpdate) {
      try { await cart.updateItemQty(itemId, qty, action); } catch { /* ignore stale refs */ }
    }

    // Apply additions — look up product_id by SKU for each new item
    for (const { sku, qty } of toAdd) {
      const product = await select()
        .from('product')
        .where('sku', '=', sku)
        .and('status', '=', 1)
        .load(pool);
      if (product) {
        try { await cart.addItem(product.product_id, parseInt(qty, 10)); } catch { /* ignore */ }
      }
    }

    // Single save — one DB transaction for the entire diff
    await saveCart(cart);

    response.status(OK);
    response.$body = { data: { success: true } };
    next();
  } catch (error) {
    response.status(INTERNAL_SERVER_ERROR);
    response.$body = { error: { status: INTERNAL_SERVER_ERROR, message: error.message } };
    next();
  }
};
