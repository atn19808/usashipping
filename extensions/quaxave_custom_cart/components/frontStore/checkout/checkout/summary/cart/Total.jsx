import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import Spinner from '@components/common/Spinner';
import './Total.scss';

const FX_QUERY = `
  query Query($source: String, $target: String) {
    fxRate(source: $source, target: $target) {
      rate
    }
  }
`;

export function Total(props) {
  const { total, totalTaxAmount, priceIncludingTax } = props;

  let grandValue = total.value;
  if (priceIncludingTax) {
    grandValue += totalTaxAmount.value;
  }
  const totalText = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(grandValue);

  const [fxState, setFxState] = useState({ data: null, fetching: true, error: null });
  useEffect(() => {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: FX_QUERY, variables: { source: 'usd', target: 'vnd' } }),
    })
      .then((r) => r.json())
      .then((json) => {
        setFxState({ data: json.data, fetching: false, error: json.errors?.[0] ?? null });
      })
      .catch((err) => {
        setFxState({ data: null, fetching: false, error: err });
      });
  }, []);
  const { data, fetching, error: queryError } = fxState;

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
  priceIncludingTax: PropTypes.bool
};

Total.defaultProps = {
  priceIncludingTax: false
};
