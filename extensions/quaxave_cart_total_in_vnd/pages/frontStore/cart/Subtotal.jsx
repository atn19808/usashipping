import PropTypes from 'prop-types';
import React from 'react';

function Subtotal({ subTotal }) {
  return (
    <div className="flex justify-between gap-12">
      <div>{_('Sub total')}</div>
      <div className="text-right">{subTotal.text}</div>
    </div>
  );
}

Subtotal.propTypes = {
  subTotal: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  })
};

Subtotal.defaultProps = {
  subTotal: {
    value: 0,
    text: ''
  }
};