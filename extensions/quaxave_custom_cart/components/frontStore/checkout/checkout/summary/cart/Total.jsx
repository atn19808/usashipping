import React from 'react';
import PropTypes from 'prop-types';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import Spinner from '@components/common/Spinner';
import { useQuery } from 'urql';
import './Total.scss';

// TODO: currency pair should come from config
const QUERY = `
  query Query($source: String, $target: String) {
    fxRate(source: $source, target: $target) {
      rate
    }
  }
`;

export function Total(props) {
  const { total, totalTaxAmount, priceIncludingTax, shippingCost } = props;

  let baseValue = total.value;
  if (priceIncludingTax) {
    baseValue += totalTaxAmount.value;
  }
  const grandValue = baseValue + (shippingCost || 0);
  const totalText = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(grandValue);

  const [result] = useQuery({
    query: QUERY,
    variables: {
      source: "usd",
      target: "vnd"
    }
  });
  const { data, fetching, error: queryError } = result;

  let vndText = '⚠️';
  if (queryError) {
    console.error(queryError);
  } else if (!fetching && data !== null && data.fxRate !== null) {
    const rate = data.fxRate.rate;
    const vndValue = grandValue * rate;
    vndText = Intl.NumberFormat(
      'vn-VN',
      {
        style: 'currency',
        currency: 'VND',
      }
    ).format(vndValue);
  }

  return (
    <div className="summary-row-custom grand-total">
      <div className="flex justify-between">
        <div className="grand-total-value">
          <span>{_('Total')}</span>
        </div>
        <div className="grand-total-value">{totalText}</div>
      </div>
      <div className="flex justify-between">
        <div><span>{'Thành tiền'}</span></div>
        {(fetching && <div><Spinner width={25} height={25} /></div>) || <div>{vndText}</div>}
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
  priceIncludingTax: PropTypes.bool,
  shippingCost: PropTypes.number,
  fxRate: PropTypes.shape({
    rate: PropTypes.number.isRequired
  })
};

Total.defaultProps = {
  priceIncludingTax: false
};
