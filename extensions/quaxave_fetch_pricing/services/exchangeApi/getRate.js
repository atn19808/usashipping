const { error, warning } = require('@evershop/evershop/src/lib/log/logger');
const { getEnv } = require('@evershop/evershop/src/lib/util/getEnv');

const FX_RATE_API_URL = getEnv('FX_RATE_API_URL', 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies');
const FX_RATE_API_FALLBACK_URL = getEnv('FX_RATE_API_FALLBACK_URL', 'https://latest.currency-api.pages.dev/v1/currencies');

const baseGetRateApiUrl = (url) => (currency) => `${url}/${currency}.min.json`;

const getRateApiUrl = baseGetRateApiUrl(FX_RATE_API_URL);
const getRateApiFallbackUrl = baseGetRateApiUrl(FX_RATE_API_FALLBACK_URL);

module.exports = async (currency) => {
    try {
        const response = await fetch(getRateApiUrl(currency))
            .then(async (resp) => {
                if (!resp.ok) {
                    warning(`Failed to fetch from ${FX_RATE_API_URL} with error ${resp.status}. Try fallback URL.`)
                    await fetch(getRateApiFallbackUrl(currency));
                }

                return resp;
            });
        
        if (!response.ok) {
            throw new Error(
                `Failed to fetch rate for ${currency}: ${response.status}`
            );
        }
        return await response.json();
    } catch (e) {
        error(e);
        return null;
    }
};