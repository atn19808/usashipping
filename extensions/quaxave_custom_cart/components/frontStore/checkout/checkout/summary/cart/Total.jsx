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


function InternalTotal({priceIncludingTax, totalText}) {
  // console.log('totalText', totalText)
  return priceIncludingTax ?
    <div className="flex justify-between">
      <div className="grand-total-value">
        <span>{_('Total')}</span>
      </div>
      <div className="grand-total-value">{totalText}</div>
    </div> :
    <div className="flex justify-between">
      <span className="self-center grand-total-value">{_('Total')}</span>
      <div className="grand-total-value">{totalText}</div>
    </div>;
}

function InternalTax({priceIncludingTax, totalTaxText}) {
  return priceIncludingTax ?
    <div className="flex justify-between">
      <div>
        <span className="italic">
          ({_('Tax ${totalTaxText}', { totalTaxText })})
        </span>
      </div>
    </div> :
    null;
}

function InternalTotalVnd({priceIncludingTax, fetching, vndText}) {
  return priceIncludingTax ?
    <div className="flex justify-between">
      <div>
        <span>{'Thành tiền'}</span>
      </div>
      {(fetching && <div><Spinner width={25} height={25} /> </div>) || <div>{vndText}</div>}
    </div> :
    <div className="flex justify-between">
      <span className="self-center">{'Thành tiền'}</span>
      {(fetching && <div><Spinner width={25} height={25} /> </div>) || <div>{vndText}</div>}
    </div>;
}

export function Total(props) {
  const { total, totalTaxAmount, priceIncludingTax } = props;

  let actualTotal = total;
  if (priceIncludingTax) {
    const valueWithTax = actualTotal.value + totalTaxAmount.value;
    actualTotal = {
      value: valueWithTax,
      text: Intl.NumberFormat(
        'en-US',
        {
          style: 'currency',
          currency: 'USD',
        }
      ).format(valueWithTax)
    }
  }

  const totalText = actualTotal.text;
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
    const vndValue = actualTotal.value * rate;
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
    <div className="summary-row-custom grand-total">
      <InternalTotal priceIncludingTax={priceIncludingTax} totalText={totalText} />
      <InternalTotalVnd priceIncludingTax={priceIncludingTax} fetching={fetching} vndText={vndText} />
      <InternalTax priceIncludingTax={priceIncludingTax} totalTaxText={totalTaxText} />
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
