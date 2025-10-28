import React from 'react';
import PropTypes from 'prop-types';

export function Total(props) {
  const { total, tax } = props;
  // console.log('props', props);
  const valueWithTax = total.value + tax.value;
  const actualTotal = {
    value: valueWithTax,
    text: Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
      }
    ).format(valueWithTax)
  };
  return (
    <div className="summary-row">
      <span>Total</span>
      <div>
        <span />
        <div>{actualTotal.text}</div>
      </div>
    </div>
  );
}

Total.propTypes = {
  total: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  }).isRequired,
  tax: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  }).isRequired
};
