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
 * Two calling modes:
 *
 * 1. desiredState: [{ sku, qty }]
 *    Client sends the full intended cart. Server loads current cart_items,
 *    computes the diff, and applies it. Idempotent — safe to call repeatedly
 *    (used by background sync on product pages).
 *
 * 2. Legacy diff: { toDelete, toAdd, toUpdate }
 *    Client pre-computes the diff (requires knowing server item UUIDs).
 *    Kept for backward compat but desiredState is preferred.
 */
module.exports = async (request, response, delegate, next) => {
  try {
    const cartId = getContextValue(request, 'cartId');
    const { desiredState, toDelete = [], toAdd = [], toUpdate = [] } = request.body || {};

    // Nothing to do
    const legacyEmpty = !desiredState && toDelete.length === 0 && toAdd.length === 0 && toUpdate.length === 0;
    if (legacyEmpty) {
      response.status(OK);
      response.$body = { data: { success: true } };
      return next();
    }

    let cart;
    if (!cartId) {
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

    let effectiveToDelete = toDelete;
    let effectiveToAdd = toAdd;
    let effectiveToUpdate = toUpdate;

    if (desiredState) {
      // Server-side diff: query current cart items then compute changes
      const { rows: currentItems } = await pool.query(
        'SELECT uuid, product_sku, qty FROM cart_item WHERE cart_id = $1',
        [cart.getData('cart_id')]
      );
      const currentMap = new Map(currentItems.map(i => [i.product_sku, i]));
      const desiredMap = new Map(desiredState.map(i => [i.sku, i]));

      effectiveToDelete = currentItems
        .filter(c => !desiredMap.has(c.product_sku))
        .map(c => c.uuid);

      effectiveToAdd = desiredState
        .filter(d => !currentMap.has(d.sku))
        .map(d => ({ sku: d.sku, qty: d.qty }));

      effectiveToUpdate = desiredState
        .filter(d => currentMap.has(d.sku) && currentMap.get(d.sku).qty !== d.qty)
        .map(d => {
          const current = currentMap.get(d.sku);
          const delta = d.qty - current.qty;
          return { itemId: current.uuid, qty: Math.abs(delta), action: delta > 0 ? 'increase' : 'decrease' };
        });

      // Truly nothing to do
      if (effectiveToDelete.length === 0 && effectiveToAdd.length === 0 && effectiveToUpdate.length === 0) {
        response.status(OK);
        response.$body = { data: { success: true } };
        return next();
      }
    }

    // Apply removals
    for (const itemId of effectiveToDelete) {
      try { await cart.removeItem(itemId); } catch { /* item may already be gone */ }
    }

    // Apply qty updates
    for (const { itemId, qty, action } of effectiveToUpdate) {
      try { await cart.updateItemQty(itemId, qty, action); } catch { /* ignore stale refs */ }
    }

    // Apply additions — look up product_id by SKU
    for (const { sku, qty } of effectiveToAdd) {
      const product = await select()
        .from('product')
        .where('sku', '=', sku)
        .and('status', '=', 1)
        .load(pool);
      if (product) {
        try { await cart.addItem(product.product_id, parseInt(qty, 10)); } catch { /* ignore */ }
      }
    }

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
