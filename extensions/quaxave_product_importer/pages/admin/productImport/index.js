const {
  setContextValue
} = require('@evershop/evershop/src/modules/graphql/services/contextHelper');

module.exports = (request, response) => {
  setContextValue(request, 'pageInfo', {
    title: 'Import Product from Costco',
    description: 'Paste a Costco product URL to scrape and import it as a product'
  });
};
