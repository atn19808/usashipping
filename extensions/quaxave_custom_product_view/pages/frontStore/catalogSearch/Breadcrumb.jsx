import React from 'react';

// Suppress the auto-generated English breadcrumb on the search page.
// Our General.jsx already renders the Vietnamese "Trang chủ / Tìm kiếm" header.
export default function Breadcrumb() {
  return <style>{'.breadcrumb.page-width { display: none !important; }'}</style>;
}

export const layout = {
  areaId: 'content',
  sortOrder: 0,
};

export const query = `
  query query {
    pageInfo {
      breadcrumbs { title url }
    }
  }
`;
