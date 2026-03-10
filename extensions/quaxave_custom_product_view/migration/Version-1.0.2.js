const { execute } = require('@evershop/postgres-query-builder');

// Remove the basic_menu widget from the footer now that About Us
// is rendered directly in Footer.jsx.
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `DELETE FROM widget
     WHERE type = 'basic_menu'
       AND area @> '["footer"]'`
  );
};
