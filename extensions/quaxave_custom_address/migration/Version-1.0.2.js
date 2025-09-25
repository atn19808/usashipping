const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
    await execute(
    connection,
    `ALTER TABLE customer_address
ALTER COLUMN is_default SET DEFAULT false;
`);
};