import PropTypes from 'prop-types';
import React from "react";
import { _ } from '@evershop/evershop/src/lib/locale/translate';

export default function TotalWeight(props) {
    const { totalWeight } = props;
    return (
      <div className="flex justify-between gap-12">
        <div>{_('Total weight')}</div>
        <div className="text-right">{totalWeight?.text}</div>
      </div>
    );
}

TotalWeight.propTypes = {
  totalWeight: PropTypes.shape({
    value: PropTypes.number,
    unit: PropTypes.string,
    text: PropTypes.string
  })
};

TotalWeight.defaultProps = {
  totalWeight: {
    value: 0,
    unit: 'kg',
    text: ''
  }
};