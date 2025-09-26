import React from 'react';
import PropTypes from 'prop-types';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import './Total.scss';

export function Total(props) {
  const { total, totalTaxAmount, priceIncludingTax } = props;

  // TODO: remove
  console.log(props);

  const totalText = total.text;
  const totalTaxText = totalTaxAmount.text;
  return (
    <div className="summary-row grand-total flex justify-between">
      {(priceIncludingTax && (
        <div>
          <div>
            <div className="grand-total-value">
              <span>{_('Total')}</span>
            </div>
            <div>
              <span>{'Thành tiền'}</span>
            </div>
            <div>
              <span className="italic">
                ({_('Inclusive of tax ${totalTaxText}', { totalTaxText })})
              </span>
            </div>
          </div>
        </div>
      )) || (
        <div>
          <span className="self-center grand-total-value">{_('Total')}</span>
          <span className="self-center">{'Thành tiền'}</span>
        </div>
      )}
      <div>
        <div>
          <div className="grand-total-value">{totalText}</div>
          <div>{totalText}</div>
        </div>
      </div>
    </div>
  );
}

Total.propTypes = {
  total: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  }).isRequired,
  totalTaxAmount: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  }).isRequired,
  priceIncludingTax: PropTypes.bool
};

Total.defaultProps = {
  priceIncludingTax: false
};
