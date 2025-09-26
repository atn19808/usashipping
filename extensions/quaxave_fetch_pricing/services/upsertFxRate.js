const { insertOnUpdate, rollback, startTransaction, commit } = require('@evershop/postgres-query-builder');
const { getConnection } = require('@evershop/evershop/src/lib/postgres/connection');
const { error } = require('@evershop/evershop/src/lib/log/logger');

module.exports = async (rate) => {
    try {
        const connection = await getConnection();
        await startTransaction(connection);

        try {
            const result = await insertOnUpdate('fx_rate', ['source', 'target'])
                .given(rate)
                .execute(connection);
            await commit(connection);

            return result;
        } catch (e) {
            await rollback(connection);
            error(e);
        }
    } catch (e) {
        error(e);
    }
};