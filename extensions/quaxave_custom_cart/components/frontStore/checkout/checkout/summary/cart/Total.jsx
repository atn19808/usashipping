import React from 'react';
import PropTypes from 'prop-types';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import Spinner from '@components/common/Spinner';
import { useQuery } from 'urql';
import './Total.scss';

const FX_QUERY = `
  query Query($source: String, $target: String) {
    fxRate(source: $source, target: $target) {
      rate
    }
  }
`;

const RATE_QUERY = `
  query {
    weightBasedShippingRate
  }
`;

export function Total(props) {
  const { total, totalTaxAmount, priceIncludingTax, totalWeight } = props;

  const [rateResult] = useQuery({ query: RATE_QUERY });
  const costPerLb = rateResult.data?.weightBasedShippingRate ?? null;
  const shippingCost = (costPerLb != null && totalWeight?.value != null)
    ? totalWeight.value * costPerLb
    : 0;

  let baseValue = total.value;
  if (priceIncludingTax) {
    baseValue += totalTaxAmount.value;
  }
  const grandValue = baseValue + shippingCost;
  const totalText = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(grandValue);

  const [fxResult] = useQuery({
    query: FX_QUERY,
    variables: { source: 'usd', target: 'vnd' }
  });
  const { data, fetching, error: queryError } = fxResult;

  let vndText = '⚠️';
  if (queryError) {
    console.error(queryError);
  } else if (!fetching && data !== null && data.fxRate !== null) {
    const rate = data.fxRate.rate;
    const vndValue = grandValue * rate;
    vndText = Intl.NumberFormat('vn-VN', { style: 'currency', currency: 'VND' }).format(vndValue);
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
  totalWeight: PropTypes.shape({
    value: PropTypes.number
  })
};

Total.defaultProps = {
  priceIncludingTax: false,
  totalWeight: null
};
