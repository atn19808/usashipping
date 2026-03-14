import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import { addItem, increaseItem, decreaseItem, removeItem, getItemQty } from '../../common/localCart';
import './AddtoCartOrQtyButton.scss';
import Quantity from './Quantity';

export default function AddtoCartOrQtyButton({ product }) {
  // Initialize to 0 so SSR and first client render match (avoids hydration mismatch)
  const [qty, setQty] = useState(0);

  useEffect(() => {
    // Read localStorage only after mount (not available on server)
    setQty(getItemQty(product.sku));
    const handler = (e) => {
      const item = e.detail.find(i => i.sku === product.sku);
      setQty(item?.qty ?? 0);
    };
    window.addEventListener('local-cart-updated', handler);
    return () => window.removeEventListener('local-cart-updated', handler);
  }, [product.sku]);

  if (product.inventory.isInStock === false) {
    return (
      <button className="add-to-cart-btn btn-disabled" disabled>
        {_('SOLD OUT')}
      </button>
    );
  }

  if (qty > 0) {
    return (
      <Quantity
        qty={qty}
        isLoading={false}
        onChangeQty={(isIncrease) => {
          if (isIncrease) { increaseItem(product.sku); }
          else if (qty - 1 > 0) { decreaseItem(product.sku); }
          else { removeItem(product.sku); }
        }}
        onRemove={() => removeItem(product.sku)}
      />
    );
  }

  return (
    <div className="add-to-cart">
      <button
        className="add-to-cart-btn"
        onClick={() => addItem(product.sku, product.productId)}
      >
        {_('ADD TO CART')}
      </button>
    </div>
  );
}

AddtoCartOrQtyButton.propTypes = {
  product: PropTypes.shape({
    inventory: PropTypes.shape({ isInStock: PropTypes.bool.isRequired }).isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string.isRequired,
    productId: PropTypes.number,
    cartQty: PropTypes.number,
    cartItemUuid: PropTypes.string,
  }).isRequired,
};
