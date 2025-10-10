const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select } = require('@evershop/postgres-query-builder');
const { default: axios } = require('axios');
const normalizePort = require('@evershop/evershop/bin/lib/normalizePort');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { toPrice } = require('@evershop/evershop/src/modules/checkout/services/toPrice');

module.exports = async function resolver() {
    if (!this.getData('shipping_method')) {
        return 0;
    } else {
        // Check if the coupon is free shipping
        const coupon = await select()
            .from('coupon')
            .where('coupon.coupon', '=', this.getData('coupon'))
            .load(pool);
        if (coupon && coupon.free_shipping) {
            return 0;
        }
        const shippingMethodQuery = select().from('shipping_method');
        shippingMethodQuery
            .innerJoin('shipping_zone_method')
            .on(
                'shipping_method.shipping_method_id',
                '=',
                'shipping_zone_method.method_id'
            );
        shippingMethodQuery
            .where('uuid', '=', this.getData('shipping_method'))
            .and(
                'shipping_zone_method.zone_id',
                '=',
                this.getData('shipping_zone_id')
            );
        const shippingMethod = await shippingMethodQuery.load(pool);
        // Check if the method is flat rate
        if (shippingMethod.cost !== null) {
            return toPrice(shippingMethod.cost);
        } else if (shippingMethod.calculate_api) {
            // Call the API of the shipping method to calculate the shipping fee. This is an internal API
            // use axios to call the API
            // Ignore http status error
            const port = normalizePort();
            let api = `http://localhost:${port}`;
            try {
                api += buildUrl(shippingMethod.calculate_api, {
                    cart_id: this.getData('uuid'),
                    method_id: shippingMethod.uuid
                });
            } catch (e) {
                throw new Error(
                    `Your shipping calculate API ${shippingMethod.calculate_api} is invalid`
                );
            }
            const response = await axios.get(api);
            if (response.status < 400) {
                return toPrice(response.data.data.cost);
            } else {
                this.setError('shipping_fee_excl_tax', response.data.message);
                return 0;
            }
        } else if (shippingMethod.weight_based_cost) {
            const totalWeight = this.getData('total_weight');
            const weightBasedCost = shippingMethod.weight_based_cost
                .map(({ min_weight, cost }) => ({
                    min_weight: parseFloat(min_weight),
                    cost: toPrice(cost)
                }))
                .sort((a, b) => a.min_weight - b.min_weight);

            let cost = 0;
            for (let i = 0; i < weightBasedCost.length; i += 1) {
                if (totalWeight >= weightBasedCost[i].min_weight) {
                    cost = weightBasedCost[i].cost;
                }
            }
            return toPrice(cost);
        } else if (shippingMethod.weight_based_rate) {
            const totalWeight = this.getData('total_weight');
            const cost = totalWeight * parseFloat(method.weight_based_rate);
            return toPrice(cost);
        } else if (shippingMethod.price_based_cost) {
            const subTotal = this.getData('sub_total');
            const priceBasedCost = shippingMethod.price_based_cost
                .map(({ min_price, cost }) => ({
                    min_price: toPrice(min_price),
                    cost: toPrice(cost)
                }))
                .sort((a, b) => a.min_price - b.min_price);
            let cost = 0;
            for (let i = 0; i < priceBasedCost.length; i += 1) {
                if (subTotal >= priceBasedCost[i].min_price) {
                    cost = priceBasedCost[i].cost;
                }
            }
            return toPrice(cost);
        } else {
            this.setError(
                'shipping_fee_excl_tax',
                'Could not calculate shipping fee'
            );
            return 0;
        }
    }
}