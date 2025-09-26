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
  const { total, totalTaxAmount, priceIncludingTax } = props;

  const totalText = total.text;
  const totalTaxText = totalTaxAmount.text;

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
    const vndValue = total.value * rate;
    // TODO: check what browser compatile with API below
    vndText = Intl.NumberFormat(
      'vn-VN',
      {
        style: 'currency',
        currency: 'VND',
      }
    ).format(vndValue);
  }

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
          {(fetching && <Spinner width={25} height={25} />) || <div>{vndText}</div>}
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
  priceIncludingTax: PropTypes.bool,
  fxRate: PropTypes.shape({
    rate: PropTypes.number.isRequired
  })
};

Total.defaultProps = {
  priceIncludingTax: false
};
