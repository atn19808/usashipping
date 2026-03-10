import React, { useState } from 'react';
import { toast } from 'react-toastify';
import PageHeading from '@components/admin/cms/PageHeading';
import { Card } from '@components/admin/cms/Card';

export default function ProductImportPage({ scrapeUrl, importUrl, productGridUrl }) {
  const [phase, setPhase] = useState('input'); // 'input' | 'preview' | 'importing'
  const [costcoUrl, setCostcoUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editImageUrls, setEditImageUrls] = useState([]);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!costcoUrl.trim()) return;

    setIsScraping(true);
    try {
      const res = await fetch(scrapeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: costcoUrl })
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message || 'Scrape failed');
        return;
      }
      const data = json.data;
      setEditName(data.name || '');
      setEditPrice(String(data.price || ''));
      setEditWeight(String(data.weight || ''));
      setEditDescription(data.description || '');
      setEditSku(data.itemNumber || '');
      setEditImageUrls(data.imageUrls || []);
      setPhase('preview');
    } catch {
      toast.error('Network error during scrape');
    } finally {
      setIsScraping(false);
    }
  };

  const handleImport = async () => {
    setPhase('importing');
    try {
      const res = await fetch(importUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          price: parseFloat(editPrice),
          weight: parseFloat(editWeight) || 0,
          description: editDescription,
          sku: editSku,
          imageUrls: editImageUrls
        })
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message || 'Import failed');
        setPhase('preview');
        return;
      }
      toast.success('Product imported successfully!');
      const editLink = json.data?.links?.find((l) => l.rel === 'edit');
      setTimeout(() => {
        window.location.href = editLink ? editLink.href : productGridUrl;
      }, 1500);
    } catch {
      toast.error('Network error during import');
      setPhase('preview');
    }
  };

  const removeImage = (idx) => {
    setEditImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <PageHeading backUrl={productGridUrl} heading="Import Product from Costco" />

      {phase === 'input' && (
        <Card title="Paste a Costco Product URL">
          <Card.Session>
            <form onSubmit={handleScrape}>
              <div className="mb-4">
                <label className="block font-medium mb-1" htmlFor="costco-url">
                  Costco Product URL
                </label>
                <input
                  id="costco-url"
                  type="url"
                  className="form-control w-full"
                  placeholder="https://www.costco.com/..."
                  value={costcoUrl}
                  onChange={(e) => setCostcoUrl(e.target.value)}
                  required
                />
                <p className="text-sm text-gray mt-1">
                  Only costco.com product page URLs are accepted.
                </p>
              </div>
              <button type="submit" className="button primary" disabled={isScraping}>
                {isScraping ? 'Scraping... (this may take 15–30s)' : 'Fetch Product Data'}
              </button>
            </form>
          </Card.Session>
        </Card>
      )}

      {phase === 'preview' && (
        <>
          <Card title="Review and Edit Product Data">
            <Card.Session>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Product Name *</label>
                  <input
                    className="form-control w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">SKU (Costco Item #) *</label>
                  <input
                    className="form-control w-full"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control w-full"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Weight (lb)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control w-full"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  className="form-control w-full"
                  rows={6}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </Card.Session>
          </Card>

          <Card title="Images">
            <Card.Session>
              {editImageUrls.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {editImageUrls.map((imgUrl, idx) => (
                    <div key={idx} className="relative border rounded p-1">
                      <img
                        src={imgUrl}
                        alt={`Product image ${idx + 1}`}
                        className="w-full h-32 object-contain"
                        onError={(e) => {
                          e.target.style.opacity = '0.2';
                        }}
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red text-white rounded-full w-5 h-5 text-xs leading-none"
                        onClick={() => removeImage(idx)}
                        title="Remove image"
                      >
                        ×
                      </button>
                      {idx === 0 && (
                        <span className="text-xs text-green block mt-1 text-center">
                          Main image
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray">
                  No images found. Product will be imported without images.
                </p>
              )}
            </Card.Session>
          </Card>

          <div className="flex gap-4 mt-4 mb-8">
            <button type="button" className="button primary" onClick={handleImport}>
              Import Product
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setPhase('input');
                setEditImageUrls([]);
              }}
            >
              Start Over
            </button>
          </div>
        </>
      )}

      {phase === 'importing' && (
        <Card title="Importing Product...">
          <Card.Session>
            <p>Downloading images and creating product record. Please wait...</p>
          </Card.Session>
        </Card>
      )}
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query ProductImportPageQuery {
    scrapeUrl: url(routeId: "scrapeProductUrl")
    importUrl: url(routeId: "importScrapedProduct")
    productGridUrl: url(routeId: "productGrid")
  }
`;
