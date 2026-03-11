import PropTypes from 'prop-types';
import React from "react";
import { _ } from '@evershop/evershop/src/lib/locale/translate';

export default function TotalWeight({ totalWeight, costPerLb }) {
  if (costPerLb != null && totalWeight?.value != null) {
    const shippingCost = totalWeight.value * costPerLb;
    const costText = `$${shippingCost.toFixed(2)}`;
    return (
      <div className="flex justify-between gap-12">
        <div>{_('Shipping')}</div>
        <div className="text-right">{costText}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-between gap-12">
      <div>{_('Total weight')}</div>
      <div className="text-right">{totalWeight?.text}</div>
    </div>
  );
}

TotalWeight.propTypes = {
  totalWeight: PropTypes.shape({
    value: PropTypes.number,
    unit: PropTypes.string,
    text: PropTypes.string
  }),
  costPerLb: PropTypes.number
};

TotalWeight.defaultProps = {
  totalWeight: {
    value: 0,
    unit: 'lb',
    text: ''
  },
  costPerLb: null
};
