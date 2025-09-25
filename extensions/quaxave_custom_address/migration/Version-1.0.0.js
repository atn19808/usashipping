const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
    await execute(
    connection,
    `ALTER TABLE cart_address 
ADD COLUMN sender_full_name VARCHAR,
ADD COLUMN sender_telephone VARCHAR;
`);

    await execute(
    connection,
    `ALTER TABLE customer_address 
ADD COLUMN sender_full_name VARCHAR,
ADD COLUMN sender_telephone VARCHAR;
`);
};