import React from 'react';
import PropTypes from 'prop-types';

function Footer({ themeConfig: { copyRight } }) {
    return (
        <div className="page-width grid grid-cols-1 md:grid-cols-1 justify-between">
            <div className="self-center">
                <div className="copyright text-center text-textSubdued">
                    <span>{copyRight}</span>
                </div>
            </div>
        </div>
    );
}

Footer.propTypes = {
    themeConfig: PropTypes.shape({
        copyRight: PropTypes.string
    })
};

Footer.defaultProps = {
    themeConfig: {
        copyRight: '© 2025 Qua Xa Ve. All Rights Reserved.'
    }
};

export default Footer;

export const layout = {
    areaId: 'footer',
    sortOrder: 10
};

export const query = `
  query query {
    themeConfig {
      copyRight
    }
  }
`;
