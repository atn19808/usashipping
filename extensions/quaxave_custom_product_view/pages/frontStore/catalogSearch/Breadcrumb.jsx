import React from 'react';

// Hide the core breadcrumb on search — our General.jsx already shows
// "Trang chủ / Tìm kiếm" in the search header.
export default function Breadcrumb() {
  return null;
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
