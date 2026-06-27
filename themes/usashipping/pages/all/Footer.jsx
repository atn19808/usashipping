import React from 'react';
import PropTypes from 'prop-types';

function Footer({ themeConfig: { copyRight } }) {
    return (
        <div className="page-width footer-bar">
            <nav className="footer-nav">
                <a href="/page/about-us">Giới thiệu</a>
            </nav>
            <div className="copyright text-textSubdued">
                <span>{copyRight}</span>
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
        copyRight: '© 2025 Quà Xa Về. Bảo lưu mọi quyền.'
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
