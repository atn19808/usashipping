import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useLocalCart, syncAndNavigate } from '../../../components/common/localCart';

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function HeaderActions({
  cartUrl, loginUrl, accountUrl, customer, searchPageUrl
}) {
  const cart = useLocalCart();
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  const [showSearch, setShowSearch] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && keyword.trim()) {
      const url = new URL(searchPageUrl, window.location.origin);
      url.searchParams.set('keyword', keyword.trim());
      window.location.href = url.toString();
    }
  };

  const cartPath = (() => { try { return new URL(cartUrl).pathname; } catch { return cartUrl; } })();

  const handleCartClick = async (e) => {
    e.preventDefault();
    if (syncing) return;
    if (totalQty === 0) { window.location.href = cartPath; return; }
    setSyncing(true);
    await syncAndNavigate(cartPath);
    setSyncing(false);
  };

  const isLoggedIn = !!customer?.uuid;
  const userName = customer?.fullName?.split(' ').pop();

  return (
    <div className="hdr-actions">

      <button
        className="hdr-mobile-search"
        aria-label="Search"
        onClick={() => setShowSearch(!showSearch)}
      >
        <SearchIcon />
      </button>

      {showSearch && (
        <div className="hdr-mobile-search-dropdown">
          <div className="header-search-bar">
            <SearchIcon />
            <input
              autoFocus
              type="text"
              className="header-search-input"
              placeholder="Tìm sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      )}

      <a href={isLoggedIn ? accountUrl : loginUrl} className="hdr-action-btn">
        <UserIcon />
        <span className="hdr-action-label">
          {isLoggedIn ? (userName || 'Tài khoản') : 'Đăng nhập'}
        </span>
        {isLoggedIn && <ChevronIcon />}
      </a>

      <a
        href={cartPath}
        className={`hdr-action-btn hdr-cart-btn${syncing ? ' hdr-cart-syncing' : ''}`}
        onClick={handleCartClick}
      >
        <span className="hdr-cart-icon-wrap">
          <BagIcon />
          {totalQty > 0 && (
            <span className="hdr-cart-badge">{totalQty}</span>
          )}
        </span>
        <span className="hdr-action-label">
          {syncing ? 'Đang tải...' : 'Giỏ hàng'}
        </span>
      </a>

    </div>
  );
}

HeaderActions.propTypes = {
  cartUrl: PropTypes.string.isRequired,
  loginUrl: PropTypes.string.isRequired,
  accountUrl: PropTypes.string.isRequired,
  searchPageUrl: PropTypes.string.isRequired,
  customer: PropTypes.shape({
    uuid: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string,
  }),
};

HeaderActions.defaultProps = {
  customer: null,
};

export const layout = {
  areaId: 'header-actions',
  sortOrder: 10,
};

export const query = `
  query Query {
    cartUrl: url(routeId: "cart")
    loginUrl: url(routeId: "login")
    accountUrl: url(routeId: "account")
    searchPageUrl: url(routeId: "catalogSearch")
    customer: currentCustomer {
      uuid
      fullName
      email
    }
  }
`;
