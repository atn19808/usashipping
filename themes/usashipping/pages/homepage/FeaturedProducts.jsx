import React from "react";
import PropTypes from "prop-types";
import { _ } from "@evershop/evershop/src/lib/locale/translate";
import ProductList from '../../components/ProductList';
import mapProductWithCart from '../../common/ProductUtil';

export default function FeaturedProducts({ collection, cart }) {
  const { products: { items } } = collection;
  if (!collection) {
    return null;
  }

  const productsWithCartInfo = mapProductWithCart(items, cart);

  return (
    <div className="pt-3">
      <div className="page-width">
        <h2 className="mt-3 mb-3 text-center uppercase  tracking-widest">
          {collection.name}
        </h2>
        <ProductList products={productsWithCartInfo} countPerRow={3} />
      </div>
    </div>
  );
}

FeaturedProducts.propTypes = {
  collection: PropTypes.shape({
    products: PropTypes.shape({
      items: PropTypes.arrayOf(
        PropTypes.shape({
          productId: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          price: PropTypes.shape({
            regular: PropTypes.shape({
              value: PropTypes.number.isRequired,
              text: PropTypes.string.isRequired,
            }).isRequired,
            special: PropTypes.shape({
              value: PropTypes.number.isRequired,
              text: PropTypes.string.isRequired,
            }).isRequired,
          }).isRequired,
          image: PropTypes.shape({
            alt: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
          }),
          url: PropTypes.string.isRequired,
        })
      ).isRequired,
    }).isRequired,
  }).isRequired,
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

FeaturedProducts.defaultProps = {
  collection: {
    products: {
      items: []
    }
  },
  cart: {
    items: []
  }
};

export const layout = {
  areaId: "content",
  sortOrder: 15,
};

export const query = `
  query query {
    collection (code: "homepage") {
      products (filters: [{key: "limit", operation: eq, value: "6"}]) {
        items {
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
      }
    }
    cart {
      items {
        uuid
        productId
        qty
      }
    }
  }
`;
