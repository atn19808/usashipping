const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select } = require('@evershop/postgres-query-builder');
const { toPrice } = require('@evershop/evershop/src/modules/checkout/services/toPrice');

const RATE_PER_LB = 5;

module.exports = async function resolver() {
    // Free-shipping coupon overrides everything
    const coupon = await select()
        .from('coupon')
        .where('coupon.coupon', '=', this.getData('coupon'))
        .load(pool);
    if (coupon && coupon.free_shipping) {
        return 0;
    }
    return toPrice(this.getData('total_weight') * RATE_PER_LB);
};
