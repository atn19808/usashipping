const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
    await execute(
    connection,
    `CREATE TABLE forex_rate (
    );
`);
};