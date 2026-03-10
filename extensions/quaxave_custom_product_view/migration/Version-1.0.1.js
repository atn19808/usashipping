const { execute } = require('@evershop/postgres-query-builder');
const { v4: uuidv4 } = require('uuid');

// 1. Remove the default header nav (Shop ❤ / About Us) added by EverShop's sample migration.
// 2. Add a minimal footer nav with just "About Us".
module.exports = exports = async (connection) => {
  // Remove all basic_menu widgets from the header
  await execute(
    connection,
    `DELETE FROM widget
     WHERE type = 'basic_menu'
       AND area @> '["header"]'`
  );

  // Add "About Us" to the footer
  const uuid = uuidv4();
  await execute(
    connection,
    `INSERT INTO widget (uuid, name, type, route, area, sort_order, settings, status)
     VALUES (
       '${uuid}',
       'Footer links',
       'basic_menu',
       '["all"]',
       '["footer"]',
       10,
       '${JSON.stringify({
         menus: [
           {
             id: 'footer-about-us',
             url: '/page/about-us',
             name: 'About Us',
             type: 'custom',
             uuid: '/page/about-us',
             children: []
           }
         ],
         isMain: '0',
         className: 'footer-nav'
       })}',
       true
     )`
  );
};
