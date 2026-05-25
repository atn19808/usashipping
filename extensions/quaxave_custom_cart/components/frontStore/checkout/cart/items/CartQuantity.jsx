import React from 'react';
import PropTypes from 'prop-types';
import { useAppDispatch } from '@components/common/context/app';
import { toast } from 'react-toastify';
import { increaseItem, decreaseItem } from 'quaxave_custom_product_view/components/common/localCart';

/**
 * EverShop's cart PATCH endpoint loads the full cart, applies the change,
 * then saves. Concurrent PATCHes from multiple items all see the original
 * cart state before any save, so only the last write survives.
 *
 * Fix: serialize all PATCHes through a module-level chain so they run one
 * after another. Then share a single fetchPageData after the whole chain
 * settles — all instances await the same Promise, spinners stay until done.
 */
let _patchChain = Promise.resolve();
let _sharedRefresh = null;

function queuePatch(patchFn) {
  const result = new Promise((resolve, reject) => {
    _patchChain = _patchChain.then(async () => {
      try { resolve(await patchFn()); }
      catch (e) { reject(e); }
      // Never reject _patchChain itself — keep the chain alive for later patches
    });
  });
  return result;
}

function refreshAfterAllPatches(fetchFn) {
  if (!_sharedRefresh) {
    // By the time any callUpdateAPI resumes after its await queuePatch(),
    // all other debounce macrotasks have already fired and added their patches
    // to _patchChain. So awaiting _patchChain here waits for ALL of them.
    _sharedRefresh = _patchChain
      .then(fetchFn)
      .catch(() => {})
      .finally(() => { _sharedRefresh = null; });
  }
  return _sharedRefresh;
}

export default function CartQuantity({ qty, api, sku }) {
  const AppContextDispatch = useAppDispatch();
  const [quantity, setQuantity] = React.useState(qty);
  const previousQuantity = React.useRef(qty);
  const [debounceTimer, setDebounceTimer] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync displayed qty from server once the loading cycle finishes.
  React.useEffect(() => {
    if (!isLoading) {
      setQuantity(qty);
      previousQuantity.current = qty;
    }
  }, [qty, isLoading]);

  const updateQuantity = (newQuantity) => {
    if (newQuantity > quantity) increaseItem(sku);
    else if (newQuantity < quantity) decreaseItem(sku);

    setQuantity(newQuantity);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => callUpdateAPI(newQuantity), 500);
    setDebounceTimer(timer);
  };

  const callUpdateAPI = async (newQty) => {
    setIsLoading(true);
    try {
      const json = await queuePatch(async () => {
        const response = await fetch(api, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qty: Math.abs(previousQuantity.current - newQty),
            action: newQty > previousQuantity.current ? 'increase' : 'decrease'
          }),
          credentials: 'same-origin'
        });
        return response.json();
      });

      if (!json.error) {
        previousQuantity.current = newQty;
        const url = new URL(window.location.href);
        url.searchParams.set('ajax', true);
        await refreshAfterAllPatches(() => AppContextDispatch.fetchPageData(url));
      } else {
        setQuantity(previousQuantity.current);
        toast.error(json.error.message);
      }
    } catch (error) {
      setQuantity(previousQuantity.current);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const Spinner = () => (
    <svg aria-hidden="true" focusable="false" role="presentation" className="spinner"
      viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
      <circle className="path" fill="none" strokeWidth="6" cx="33" cy="33" r="30" />
    </svg>
  );

  return (
    <div className="qty-box grid grid-cols-3 border border-[#ccc]">
      <button className="flex justify-center items-center"
        onClick={() => updateQuantity(Math.max(quantity - 1, 0))}
        disabled={isLoading} type="button">
        {isLoading ? <Spinner /> : (
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
            role="presentation" className="icon icon-minus" fill="none" viewBox="0 0 10 2">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 110 1H1A.5.5 0 01.5 1z" fill="currentColor" />
          </svg>
        )}
      </button>
      <input type="text" value={quantity} readOnly />
      <button className="flex justify-center items-center"
        onClick={() => updateQuantity(quantity + 1)}
        disabled={isLoading} type="button">
        {isLoading ? <Spinner /> : (
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
            role="presentation" className="icon icon-plus" fill="none" viewBox="0 0 10 10">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M1 4.51a.5.5 0 000 1h3.5l.01 3.5a.5.5 0 001-.01V5.5l3.5-.01a.5.5 0 00-.01-1H5.5L5.49.99a.5.5 0 00-1 .01v3.5l-3.5.01H1z"
              fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}

CartQuantity.propTypes = {
  qty: PropTypes.number.isRequired,
  api: PropTypes.string.isRequired,
  sku: PropTypes.string.isRequired
};
