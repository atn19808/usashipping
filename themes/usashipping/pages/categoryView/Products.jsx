import PropTypes from 'prop-types';
import React from 'react';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import ProductList from '../../components/ProductList';
import mapProductWithCart from '../../common/ProductUtil';

export default function Products({
  products: {
    showProducts,
    products: { items }
  },
  cart
}) {
  if (!showProducts) {
    return null;
  }

  const productsWithCartInfo = mapProductWithCart(items, cart);

  return (
    <div>
      <ProductList products={productsWithCartInfo} countPerRow={3} />
      <span className="product-count italic block mt-8">
        {_('${count} products', { count: productsWithCartInfo.length })}
      </span>
    </div>
  );
}

// NOTE: sometime products or product is NULL. Might need more investigation.
Products.propTypes = {
  products: PropTypes.shape({
    showProducts: PropTypes.number,
    products: PropTypes.shape({
      items: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          productId: PropTypes.number,
          url: PropTypes.string,
          price: PropTypes.shape({
            regular: PropTypes.shape({
              value: PropTypes.number,
              text: PropTypes.string
            }),
            special: PropTypes.shape({
              value: PropTypes.number,
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
    showProducts: 1,
    products: {
      items: []
    }
  },
  cart: {
    items: []
  }
};

export const layout = {
  areaId: 'rightColumn',
  sortOrder: 25
};

export const query = `
  query Query($filters: [FilterInput]) {
    products: category(id: getContextValue('categoryId')) {
      showProducts
      products(filters: $filters) {
        items {
          ...Product
        }
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

export const variables = `
{
  filters: getContextValue('filtersFromUrl')
}`;
