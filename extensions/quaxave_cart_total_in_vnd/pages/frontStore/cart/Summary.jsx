import PropTypes from 'prop-types';
import React from 'react';
import Area from '@components/common/Area';
import Button from '@components/common/form/Button';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import { Tax } from '@components/frontStore/checkout/checkout/summary/cart/Tax';
import { Total } from '@components/frontStore/checkout/checkout/summary/cart/Total';
import { Discount } from './Discount';
import { Subtotal } from './Subtotal'

function Summary({
  checkoutUrl,
  cart: {
    totalQty,
    totalWeight,
    subTotal,
    subTotalInclTax,
    totalTaxAmount,
    grandTotal,
    coupon,
    discountAmount
  },
  setting: { priceIncludingTax }
}) {
  if (totalQty === undefined || totalQty <= 0) {
    return null;
  }
  // TODO: remove
  console.log('total weight', totalWeight);
  return (
    <div className="summary">
      <div className="grid grid-cols-1 gap-8">
        <h4>{_('Order summary')}</h4>
        <Area
          id="shoppingCartSummary"
          noOuter
          coreComponents={[
            {
              component: { default: Subtotal },
              props: {
                subTotal: priceIncludingTax ? subTotalInclTax : subTotal
              },
              sortOrder: 10,
              id: 'shoppingCartSubtotal'
            },
            {
              component: { default: Discount },
              props: { discountAmount, coupon },
              sortOrder: 20,
              id: 'shoppingCartDiscount'
            },
            {
              // eslint-disable-next-line react/no-unstable-nested-components
              component: {
                default: priceIncludingTax ? () => null : Tax
              },
              props: {
                amount: totalTaxAmount.text
              },
              sortOrder: 30,
              id: 'tax'
            },
            {
              // eslint-disable-next-line react/no-unstable-nested-components
              component: {
                default: Total
              },
              props: {
                total: grandTotal,
                totalTaxAmount: totalTaxAmount,
                priceIncludingTax
              },
              sortOrder: 60,
              id: 'tax'
            }
          ]}
        />
      </div>
      <div className="shopping-cart-checkout-btn flex justify-between mt-8">
        <Button url={checkoutUrl} title={_('CHECKOUT')} variant="primary" />
      </div>
    </div>
  );
}

Summary.propTypes = {
  checkoutUrl: PropTypes.string.isRequired,
  cart: PropTypes.shape({
    totalQty: PropTypes.number,
    totalWeight: PropTypes.shape({
      value: PropTypes.number,
      unit: PropTypes.string,
      text: PropTypes.string
    }),
    subTotal: PropTypes.shape({
      value: PropTypes.number,
      text: PropTypes.string
    }),
    subTotalInclTax: PropTypes.shape({
      value: PropTypes.number,
      text: PropTypes.string
    }),
    totalTaxAmount: PropTypes.shape({
      value: PropTypes.number,
      text: PropTypes.string
    }),
    discountAmount: PropTypes.shape({
      value: PropTypes.number,
      text: PropTypes.string
    }),
    coupon: PropTypes.string,
    grandTotal: PropTypes.shape({
      value: PropTypes.number,
      text: PropTypes.string
    })
  }).isRequired,
  setting: PropTypes.shape({
    priceIncludingTax: PropTypes.bool
  }).isRequired
};

export default Summary;

export const layout = {
  areaId: 'shoppingCartRight',
  sortOrder: 10
};

export const query = `
  query Query {
    cart(id: getContextValue('cartId', null)) {
      totalQty
      totalWeight {
        value
        unit
        text
      }
      subTotal {
        value
        text
      }
      subTotalInclTax {
        value
        text
      }
      grandTotal {
        value
        text
      }

      totalTaxAmount {
        value
        text
      }
      discountAmount {
        value
        text
      }
      coupon
    }
    setting {
      priceIncludingTax
    }
    checkoutUrl: url(routeId: "checkout")
  }
`;
