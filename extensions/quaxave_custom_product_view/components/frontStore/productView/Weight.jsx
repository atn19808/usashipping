import React from 'react';
import PropTypes from 'prop-types';

export default function Weight(props) {
    const { weight } = props;
    return (
        <p className="product-weight">{weight.text}</p>
    );
}

Weight.propTypes = {
    weight: PropTypes.shape({
        text: PropTypes.string
    })
};