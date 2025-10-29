import PropTypes from 'prop-types';
import React from 'react';

function Name({ name, url }) {
  return (
    <div className="mt-4 mb-1">
      <a href={url} className="font-bold hover:underline text-[1.5rem] sm:text-[1.6rem] line-clamp-2 xl:line-clamp-none h-[4rem] md:h-[5rem] lg:h-[5rem] 2xl:h-[5.5rem] lg:line-height-2 lg:h-[6rem]">
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
