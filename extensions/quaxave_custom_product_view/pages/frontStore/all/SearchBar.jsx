import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function SearchBar({ searchPageUrl }) {
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('keyword');
    if (key) setKeyword(key);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && keyword.trim()) {
      const url = new URL(searchPageUrl, window.location.origin);
      url.searchParams.set('keyword', keyword.trim());
      window.location.href = url.toString();
    }
  };

  const handleSubmit = () => {
    if (keyword.trim()) {
      const url = new URL(searchPageUrl, window.location.origin);
      url.searchParams.set('keyword', keyword.trim());
      window.location.href = url.toString();
    }
  };

  return (
    <div className="header-search-bar">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18" height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="header-search-icon"
        onClick={handleSubmit}
        style={{ cursor: 'pointer', flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        className="header-search-input"
        placeholder="Tìm sản phẩm..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

SearchBar.propTypes = {
  searchPageUrl: PropTypes.string.isRequired,
};

export const layout = {
  areaId: 'header-search',
  sortOrder: 10,
};

export const query = `
  query Query {
    searchPageUrl: url(routeId: "catalogSearch")
  }
`;
