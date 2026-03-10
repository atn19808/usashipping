import React from 'react';

export default function SearchInfo() {
  const [keyword, setKeyword] = React.useState('');

  React.useEffect(() => {
    const url = new URL(window.location.href);
    setKeyword(url.searchParams.get('keyword') || '');
  }, []);

  return (
    <div className="search-header page-width">
      <p className="search-breadcrumb">
        <a href="/">Trang chủ</a> / Tìm kiếm
      </p>
      <h1 className="search-title">
        Kết quả tìm kiếm cho &ldquo;{keyword}&rdquo;
      </h1>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5,
};
