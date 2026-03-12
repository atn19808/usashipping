import PropTypes from 'prop-types';
import React from 'react';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import { Discount } from '@components/frontStore/checkout/checkout/summary/cart/Discount';
import { Subtotal } from '@components/frontStore/checkout/checkout/summary/cart/Subtotal';
import { Tax } from '@components/frontStore/checkout/checkout/summary/cart/Tax';
import { Total } from '@components/frontStore/checkout/checkout/summary/cart/Total';
import TotalWeight from './cart/TotalWeight';

function CartSummary({
  totalQty,
  totalWeight,
  subTotal,
  subTotalInclTax,
  grandTotal,
  discountAmount,
  totalTaxAmount,
  shippingMethodName,
  shippingFeeInclTax,
  coupon,
  priceIncludingTax
}) {
  const [liveShippingCost, setLiveShippingCost] = React.useState(shippingFeeInclTax?.text || '');

  React.useEffect(() => {
    const handler = (e) => setLiveShippingCost(e.detail.cost);
    window.addEventListener('shipping-cost-updated', handler);
    return () => window.removeEventListener('shipping-cost-updated', handler);
  }, []);

  return (
    <div className="checkout-summary-block">
      <Subtotal
        count={totalQty}
        total={priceIncludingTax ? subTotalInclTax.text : subTotal.text}
      />
      {!priceIncludingTax && <Tax amount={totalTaxAmount.text} />}
      <Discount code={coupon} discount={discountAmount.text} />
      <TotalWeight totalWeight={totalWeight} />
      {liveShippingCost && (
        <div className="flex justify-between gap-12"><div>{_('Shipping')}</div><div className="text-right">{liveShippingCost}</div></div>
      )}
      <Total
        totalTaxAmount={totalTaxAmount}
        total={grandTotal}
        priceIncludingTax={priceIncludingTax}
      />
    </div>
  );
}

CartSummary.propTypes = {
  coupon: PropTypes.string,
  discountAmount: PropTypes.shape({
    text: PropTypes.string.isRequired
  }),
  grandTotal: PropTypes.shape({
    text: PropTypes.string.isRequired
  }),
  shippingFeeInclTax: PropTypes.shape({
    text: PropTypes.string.isRequired
  }),
  shippingMethodName: PropTypes.string,
  subTotal: PropTypes.shape({
    text: PropTypes.string.isRequired
  }),
  subTotalInclTax: PropTypes.shape({
    text: PropTypes.string.isRequired
  }),
  totalTaxAmount: PropTypes.shape({
    text: PropTypes.string.isRequired
  }),
  totalQty: PropTypes.number,
  totalWeight: PropTypes.shape({
    value: PropTypes.number,
    unit: PropTypes.string,
    text: PropTypes.string
  }),
  priceIncludingTax: PropTypes.bool
};

CartSummary.defaultProps = {
  coupon: '',
  discountAmount: {
    text: ''
  },
  grandTotal: {
    text: ''
  },
  shippingFeeInclTax: {
    text: ''
  },
  shippingMethodName: '',
  subTotal: {
    text: ''
  },
  subTotalInclTax: {
    text: ''
  },
  totalTaxAmount: {
    text: ''
  },
  totalQty: '',
  totalWeight: {
    value: 0,
    unit: 'kg',
    text: ''
  },
  priceIncludingTax: false
};

export { CartSummary };
