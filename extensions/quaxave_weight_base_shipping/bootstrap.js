const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const newShippingCostMethod = require('./services/newShippingCostMethod');

function changeShippingFeeCalculation(fields) {
    return fields.map((field) => {
        if (field['key'] === 'shipping_fee_draft') {
            field['resolvers'] = [newShippingCostMethod];
        }

        return field;
    });
}

module.exports = () => {
    addProcessor('cartFields', changeShippingFeeCalculation, 1)
};