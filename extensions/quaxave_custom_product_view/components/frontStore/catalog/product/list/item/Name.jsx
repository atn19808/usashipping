import PropTypes from 'prop-types';
import React from 'react';

function Name({ name, url }) {
  return (
    <div className="product-name product-list-name mt-4 mb-1 h-[10rem] sm:h-[5rem] md:h-[7rem] lg:h-[7rem] 2xl:h-[11rem]">
      <a href={url} className="font-bold hover:underline h5">
        <span>{name}</span>
      </a>
    </div>
  );
}

Name.propTypes = {
  url: PropTypes.string,
  name: PropTypes.string
};

Name.defaultProps = {
  url: '',
  name: ''
};

export { Name };
