const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { getContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

/**
 * Returns cart items (uuid, sku, qty) via a direct DB query.
 * Avoids getCartByUUID() which runs the full cart processor chain
 * (price/tax/shipping calculations) — far too expensive for a simple
 * "what's in the cart?" check used by the sync diff.
 */
module.exports = async (request, response, delegate, next) => {
  const cartId = getContextValue(request, 'cartId');
  if (!cartId) {
    response.status(OK).json({ data: { items: [] } });
    return;
  }
  try {
    const cart = await select('cart_id')
      .from('cart')
      .where('uuid', '=', cartId)
      .load(pool);

    if (!cart) {
      response.status(OK).json({ data: { items: [] } });
      return;
    }

    const rows = await select(['uuid', 'product_sku', 'qty'])
      .from('cart_item')
      .where('cart_id', '=', cart.cart_id)
      .execute(pool);

    const items = rows.map(r => ({
      uuid: r.uuid,
      sku: r.product_sku,
      qty: r.qty,
    }));

    response.status(OK).json({ data: { items } });
  } catch (e) {
    response.status(OK).json({ data: { items: [] } });
  }
};
