import PropTypes from 'prop-types';
import React from 'react';

function Name({ name, url }) {
  return (
    <div className="mt-4 mb-1">
      <a href={url} className="font-bold hover:underline text-[1.5rem] sm:text-[1.6rem] line-clamp-2 lg:line-clamp-none h-[4rem] md:h-[5rem] lg:h-[7rem] 2xl:h-[9rem]">
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
