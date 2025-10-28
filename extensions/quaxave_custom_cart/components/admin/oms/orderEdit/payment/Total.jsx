import React from 'react';
import PropTypes from 'prop-types';

export function Total(props) {
  const { total } = props;
  return (
    <div className="summary-row">
      <span>Total</span>
      <div>
        <span />
        <div>{total.text}</div>
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
