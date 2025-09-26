const { select } = require('@evershop/postgres-query-builder');
const { error, debug } = require('@evershop/evershop/src/lib/log/logger');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');

module.exports = {
    Query: {
        fxRate: async (_, input, { pool }) => {
            try {
                const { source, target } = input;
                const attributes = await select()
                    .from('fx_rate')
                    .where('source', '=', source)
                    .andWhere('target', '=', target)
                    .execute(pool);
                const result = attributes.map((a) => camelCase(a));
                if (result.length == 0) {
                    debug(`No Rate for ${source} - ${target} pair!`);
                    return null;
                }

                return result[0];
            } catch (e) {
                error(e);
                return null;
            }
        },
    }
};