import PropTypes from 'prop-types';
import React from 'react';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import ProductList from '../../components/ProductList';
import mapProductWithCart from '../../common/ProductUtil';

export default function Products({ products: { items }, cart }) {
  const productsWithCartInfo = mapProductWithCart(items, cart);
  return (
    <div>
      <ProductList products={productsWithCartInfo} countPerRow={4} />
      <span className="product-count italic block mt-8">
        {_('${count} products', { count: items.length })}
      </span>
    </div>
  );
}

Products.propTypes = {
  products: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        productId: PropTypes.number,
        url: PropTypes.string,
        price: PropTypes.shape({
          regular: PropTypes.shape({
            value: PropTypes.float,
            text: PropTypes.string
          }),
          special: PropTypes.shape({
            value: PropTypes.float,
            text: PropTypes.string
          })
        }),
        image: PropTypes.shape({
          alt: PropTypes.string,
          listing: PropTypes.string
        }),
        uuid: PropTypes.string.isRequired,
        inventory: PropTypes.shape({
          isInStock: PropTypes.bool,
          stockAvailability: PropTypes.number,
          manageStock: PropTypes.number
        })
      })
    )
  }),
  cart: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        productId: PropTypes.string,
        qty: PropTypes.number,
        uuid: PropTypes.string,
      })
    )
  })
};

Products.defaultProps = {
  products: {
    items: []
  }
};

export const layout = {
  areaId: 'oneColumn',
  sortOrder: 25
};

export const query = `
  query Query($filtersFromUrl: [FilterInput]) {
    products(filters: $filtersFromUrl) {
      items {
        ...Product
      }
    }
    cart {
      items {
        uuid
        productId
        qty
      }
    }
  }`;

export const fragments = `
  fragment Product on Product {
    uuid
    productId
    name
    sku
    price {
      regular {
        value
        text
      }
      special {
        value
        text
      }
    }
    image {
      alt
      url: listing
    }
    url
    inventory {
      isInStock
      stockAvailability
      manageStock
    }
  }
`;

export const variables = `{
  filtersFromUrl: getContextValue("filtersFromUrl")
}`;
