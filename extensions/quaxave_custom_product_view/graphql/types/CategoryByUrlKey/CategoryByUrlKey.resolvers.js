const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');

module.exports = {
  Query: {
    categoryByUrlKey: async (_, { urlKey }, { pool }) => {
      const query = select().from('category');
      query
        .leftJoin('category_description')
        .on(
          'category_description.category_description_category_id',
          '=',
          'category.category_id'
        );
      query.where('category_description.url_key', '=', urlKey);
      const result = await query.load(pool);
      return result ? camelCase(result) : null;
    }
  }
};
