const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const { getEnv } = require('@evershop/evershop/src/lib/util/getEnv');
const getRate = require("../services/exchangeApi/getRate");
const upsertFxRate = require('../services/upsertFxRate');

const FX_RATE_SOURCE = getEnv('FX_RATE_SOURCE', 'usd');
const FX_RATE_TARGET = getEnv('FX_RATE_TARGET', 'vnd');

module.exports = async () => {
    try {
        const result = await getRate(FX_RATE_SOURCE);
        if (!result) {
            return;
        }

        const rateValue = result[FX_RATE_SOURCE][FX_RATE_TARGET];

        const updatedResult = await upsertFxRate({
            source: FX_RATE_SOURCE,
            target: FX_RATE_TARGET,
            rate: rateValue,
            updated_at: new Date(),
        });

        info(`Updated Fx Rate: ${JSON.stringify(updatedResult)}`);
    } catch (e) {
        error(e);
    }
};