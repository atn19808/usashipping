import React, { useState } from 'react';
import { toast } from 'react-toastify';
import PageHeading from '@components/admin/cms/PageHeading';
import { Card } from '@components/admin/cms/Card';

export default function PriceReviewPage({ pendingPriceChanges, approveUrl, dismissUrl }) {
  const [items, setItems] = useState(pendingPriceChanges || []);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const removeIds = (ids) => {
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((i) => !idSet.has(i.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const postAction = async (url, ids) => {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Request failed');
      return json.data;
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ids) => {
    try {
      const result = await postAction(approveUrl, ids);
      toast.success(`Approved ${result.approved} price(s)${result.failed ? `, ${result.failed} failed` : ''}`);
      removeIds(ids);
    } catch (err) {
      toast.error(`Approve failed: ${err.message}`);
    }
  };

  const handleDismiss = async (ids) => {
    try {
      const result = await postAction(dismissUrl, ids);
      toast.success(`Dismissed ${result.dismissed} price(s)`);
      removeIds(ids);
    } catch (err) {
      toast.error(`Dismiss failed: ${err.message}`);
    }
  };

  const selectedIds = [...selected];

  const deltaColor = (delta) => {
    if (delta === null || delta === undefined) return '';
    if (delta > 0) return 'color: #d9534f';   // red = price went up
    if (delta < 0) return 'color: #5cb85c';   // green = price went down
    return '';
  };

  return (
    <div className="main-content-inner">
      <PageHeading backUrl="/admin/products" heading="Price Review" />

      {items.length === 0 ? (
        <Card>
          <Card.Session>
            <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>
              No pending price changes. The scraper will stage new records on its next run.
            </p>
          </Card.Session>
        </Card>
      ) : (
        <Card>
          <Card.Session
            title={`${items.length} pending change${items.length !== 1 ? 's' : ''}`}
            actions={
              selectedIds.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="button primary"
                    disabled={loading}
                    onClick={() => handleApprove(selectedIds)}
                  >
                    Approve {selectedIds.length} selected
                  </button>
                  <button
                    className="button secondary"
                    disabled={loading}
                    onClick={() => handleDismiss(selectedIds)}
                  >
                    Dismiss {selectedIds.length} selected
                  </button>
                </div>
              ) : (
                <button
                  className="button primary"
                  disabled={loading}
                  onClick={() => handleApprove(items.map((i) => i.id))}
                >
                  Approve All
                </button>
              )
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>
                      <input type="checkbox" checked={selected.size === items.length} onChange={toggleAll} />
                    </th>
                    <th style={{ padding: '0.5rem' }}>Source</th>
                    <th style={{ padding: '0.5rem' }}>SKU</th>
                    <th style={{ padding: '0.5rem' }}>Product</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Current</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Scraped</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Change</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Sheet</th>
                    <th style={{ padding: '0.5rem' }}>Scraped At</th>
                    <th style={{ padding: '0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: selected.has(item.id) ? '#f0f9ff' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <span
                          style={{
                            background: item.source === 'costco' ? '#e0f2fe' : '#fef3c7',
                            color: item.source === 'costco' ? '#0369a1' : '#92400e',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {item.source}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{item.sku}</td>
                      <td style={{ padding: '0.5rem', maxWidth: '280px' }}>
                        {item.costcoUrl ? (
                          <a href={item.costcoUrl} target="_blank" rel="noopener noreferrer">
                            {item.productName || '—'}
                          </a>
                        ) : (
                          item.productName || '—'
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {item.currentPrice != null ? `$${item.currentPrice.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                        {item.scrapedPrice != null ? `$${item.scrapedPrice.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', ...parseCss(deltaColor(item.delta)) }}>
                        {item.delta != null
                          ? `${item.delta > 0 ? '+' : ''}$${item.delta.toFixed(2)} (${item.delta > 0 ? '+' : ''}${item.deltaPercent?.toFixed(1)}%)`
                          : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: '#6b7280' }}>
                        {item.sheetPrice != null ? `$${item.sheetPrice.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {item.scrapedAt ? new Date(item.scrapedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                        <button
                          className="button primary small"
                          disabled={loading}
                          onClick={() => handleApprove([item.id])}
                          style={{ marginRight: '0.25rem' }}
                        >
                          ✓
                        </button>
                        <button
                          className="button secondary small"
                          disabled={loading}
                          onClick={() => handleDismiss([item.id])}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Session>
        </Card>
      )}
    </div>
  );
}

// Convert inline CSS string (e.g. "color: #d9534f") to React style object
function parseCss(cssStr) {
  if (!cssStr) return {};
  return Object.fromEntries(
    cssStr.split(';').filter(Boolean).map((rule) => {
      const [prop, val] = rule.split(':').map((s) => s.trim());
      const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return [camel, val];
    })
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query PriceReviewPageQuery {
    pendingPriceChanges {
      id sku source productName scrapedPrice currentPrice sheetPrice
      costcoUrl status scrapedAt delta deltaPercent
    }
    approveUrl: url(routeId: "approvePriceChange")
    dismissUrl: url(routeId: "dismissPriceChange")
  }
`;
