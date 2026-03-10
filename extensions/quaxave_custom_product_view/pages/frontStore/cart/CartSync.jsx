import { useEffect } from 'react';
import { waitForSync, getCart, clearCart } from '../../../components/common/localCart';

export default function CartSync() {
  // useEffect(() => {
  //   const items = getCart();
  //   if (!items.length) return;
  //
  //   waitForSync().then(() => {
  //     clearCart();
  //     window.location.reload();
  //   });
  // }, []);

  return null;
}

export const layout = {
  areaId: 'content',
  sortOrder: 1,
};
