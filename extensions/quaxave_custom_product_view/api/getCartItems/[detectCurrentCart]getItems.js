const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { getContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { getCartByUUID } = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');

module.exports = async (request, response, delegate, next) => {
  const cartId = getContextValue(request, 'cartId');
  if (!cartId) {
    response.status(OK).json({ data: { items: [] } });
    return;
  }
  try {
    const cart = await getCartByUUID(cartId);
    const items = cart.getItems().map(item => ({
      uuid: item.getData('uuid'),
      sku: item.getData('product_sku'),
      qty: item.getData('qty'),
    }));
    response.status(OK).json({ data: { items } });
  } catch (e) {
    response.status(OK).json({ data: { items: [] } });
  }
};
