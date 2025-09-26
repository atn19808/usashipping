import React from 'react';
import PropTypes from 'prop-types';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import './Total.scss';

export function Total({ total, totalTaxAmount, priceIncludingTax }) {
  return (
    <div className="summary-row grand-total flex justify-between">
      {(priceIncludingTax && (
        <div>
          <div>
            <div className="font-bold">
              <span>{_('Total')}</span>
            </div>
            <div className="">
              <span>{'Thành tiền'}</span>
            </div>
            <div>
              <span className="italic">
                ({_('Inclusive of tax ${totalTaxAmount}', { totalTaxAmount })})
              </span>
            </div>
          </div>
        </div>
      )) || <div>
          <span className="self-center font-bold">{_('Total')}</span>
          <span className="self-center">{'Thành tiền'}</span>
        </div>}
      <div>
        <div />
        <div className="grand-total-value">{total}</div>
        <div />
        <div className="grand-total-convert">{total}</div>
      </div>
    </div>
  );
}

Total.propTypes = {
  total: PropTypes.string.isRequired,
  totalTaxAmount: PropTypes.string.isRequired,
  priceIncludingTax: PropTypes.bool
};

Total.defaultProps = {
  priceIncludingTax: false
};
