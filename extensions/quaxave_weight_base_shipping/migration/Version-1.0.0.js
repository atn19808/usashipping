const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
    await execute(
    connection,
    `
    ALTER TABLE shipping_zone_method
    ADD COLUMN weight_based_rate NUMERIC(12,4);
    `);
};