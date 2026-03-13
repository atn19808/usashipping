import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { _ } from '@evershop/evershop/src/lib/locale/translate';

const FX_QUERY = `
  query FxQuery($source: String, $target: String) {
    fxRate(source: $source, target: $target) {
      rate
    }
  }
`;

function toVnd(usdValue, rate) {
  return Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(usdValue * rate);
}

function OrderItem({ order, fxRate }) {
  return (
    <div className="order border-divider">
      <div className="order-inner grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="order-items col-span-2">
          {order.items.map((item, i) => (
            <div key={item.productSku + '-' + i} className="order-item mb-4 flex gap-8 items-center">
              <div className="thumbnail border border-divider p-4 rounded">
                {item.thumbnail && (
                  <img style={{ maxWidth: '6rem' }} src={item.thumbnail} alt={item.productName} />
                )}
              </div>
              <div className="order-item-info">
                <div className="order-item-name font-semibold">{item.productName}</div>
                <div className="order-item-sku italic">{_('Sku')}: #{item.productSku}</div>
                <div className="order-item-qty" style={{ fontSize: '0.9em' }}>
                  {item.qty} x {item.productPrice.text}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="order-total col-span-1">
          <div className="order-header">
            <div className="order-number">
              <span className="font-bold">{_('Order')}: #{order.orderNumber}</span>
              <span className="italic pl-4">{order.createdAt.text}</span>
            </div>
          </div>
          <div className="order-total-value font-bold">
            {_('Total')}:{order.grandTotal.text}
          </div>
          {fxRate && (
            <div style={{ color: 'var(--color-text-muted, #888)', fontSize: '1.2rem', marginTop: '2px' }}>
              {toVnd(order.grandTotal.value, fxRate)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderHistory({ customer: { orders = [] } }) {
  const [fxRate, setFxRate] = useState(null);
  useEffect(() => {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: FX_QUERY, variables: { source: 'usd', target: 'vnd' } }),
    })
      .then((r) => r.json())
      .then((json) => setFxRate(json.data?.fxRate?.rate ?? null))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Hide the core EverShop OrderHistory rendered at sortOrder 10 */}
      <style>{'.order-history.divide-y { display: none !important; }'}</style>
      <div className="order-history-vnd divide-y">
        {orders.length === 0 && (
          <div className="order-history-empty">
            {_('You have not placed any orders yet')}
          </div>
        )}
        {orders.map((order) => (
          <div key={order.orderId} className="order-history-order border-divider py-8">
            <OrderItem order={order} fxRate={fxRate} />
          </div>
        ))}
      </div>
    </>
  );
}

OrderHistory.propTypes = {
  customer: PropTypes.shape({
    orders: PropTypes.arrayOf(
      PropTypes.shape({
        orderId: PropTypes.string.isRequired,
        orderNumber: PropTypes.string.isRequired,
        createdAt: PropTypes.shape({ text: PropTypes.string.isRequired }),
        grandTotal: PropTypes.shape({
          value: PropTypes.number.isRequired,
          text: PropTypes.string.isRequired,
        }),
        items: PropTypes.arrayOf(
          PropTypes.shape({
            productName: PropTypes.string.isRequired,
            thumbnail: PropTypes.string,
            productPrice: PropTypes.shape({ text: PropTypes.string.isRequired }),
            productSku: PropTypes.string.isRequired,
            qty: PropTypes.number.isRequired,
          })
        ),
      })
    ),
  }).isRequired,
};

export const layout = {
  areaId: 'accountPageOrderHistory',
  sortOrder: 5,
};

export const query = `
  query Query {
    customer: currentCustomer {
      orders {
        orderId
        orderNumber
        createdAt { text }
        grandTotal { value text }
        items {
          productName
          thumbnail
          productPrice { value text }
          productSku
          qty
        }
      }
    }
  }
`;
