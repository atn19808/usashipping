import { useEffect } from 'react';
import { save, cacheServerState } from '../../../components/common/localCart';

/**
 * On every cart page load, reads the authoritative server cart from SSR props
 * and writes it to localStorage. This keeps the badge in sync after the user
 * modifies the cart via EverShop's native UI (which reloads the page).
 *
 * Also caches removeApi URLs so syncAndNavigate can delete server items later.
 */
export default function CartSync({ cart }) {
  useEffect(() => {
    if (!cart?.items) return;
    const toPath = url => { try { return new URL(url).pathname; } catch { return url; } };
    const serverState = cart.items.map(i => ({
      sku: i.productSku,
      qty: i.qty,
      removeApi: toPath(i.removeApi),
    }));
    save(serverState.map(i => ({ sku: i.sku, qty: i.qty })));
    cacheServerState(serverState);
  }, []);

  return null;
}

export const layout = {
  areaId: 'content',
  sortOrder: 1,
};

export const query = `
  query Query {
    cart {
      items {
        productSku
        qty
        removeApi
      }
    }
  }
`;
