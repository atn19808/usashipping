import { useEffect } from 'react';
import { save } from '../../../components/common/localCart';

export default function CartClear() {
  useEffect(() => {
    save([]);
  }, []);

  return null;
}

export const layout = {
  areaId: 'content',
  sortOrder: 1
};

