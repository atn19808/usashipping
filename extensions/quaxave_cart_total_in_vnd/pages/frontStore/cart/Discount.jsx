import PropTypes from 'prop-types';
import React from 'react';

export function Discount({ discountAmount, coupon }) {
  if (!coupon) {
    return null;
  }
  return (
    <div className="flex justify-between gap-12">
      <div>{_('Discount(${coupon})', { coupon })}</div>
      <div className="text-right">{discountAmount.text}</div>
    </div>
  );
}

Discount.propTypes = {
  discountAmount: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  }),
  coupon: PropTypes.string
};

Discount.defaultProps = {
  discountAmount: {
    value: 0,
    text: ''
  },
  coupon: ''
};