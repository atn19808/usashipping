const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
    await execute(
    connection,
    ```
    CREATE TABLE fx_rate (
        fx_rate_id   INT4 GENERATED ALWAYS AS IDENTITY,
        uuid         UUID DEFAULT gen_random_uuid() NOT NULL,
        source       VARCHAR NOT NULL,
        target       VARCHAR NOT NULL,
        rate         NUMERIC(20, 10) NOT NULL,
        created_at   timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at   timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT fx_rate_pair_unq UNIQUE (source, target),
        CONSTRAINT fx_rate_uuid_unq UNIQUE (uuid),
        CONSTRAINT fx_rate_pkey PRIMARY KEY (fx_rate_id)
    );
    ```);
};