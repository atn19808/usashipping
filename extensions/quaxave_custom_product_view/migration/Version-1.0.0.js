const { execute } = require('@evershop/postgres-query-builder');

// Remove homepage banner (text_block) and store summary widgets (collection_products)
// that were set up via the admin panel. The FeaturedProducts component handles
// all product display now via the store-tab UI.
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `DELETE FROM widget
     WHERE type IN ('text_block', 'collection_products')
       AND route @> '["homepage"]'`
  );
};
