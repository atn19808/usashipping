const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const newShippingCostMethod = require('./services/newShippingCostMethod');
const fixedTotalWeightCalculation = require('./services/fixedTotalWeightCalculation');

function modifyCartCalculationFields(fields) {
    return fields.map((field) => {
        if (field['key'] === 'total_weight') {
            field['resolvers'] = [fixedTotalWeightCalculation];
        }

        // Shipping fee
        if (field['key'] === 'shipping_fee_draft') {
            field['resolvers'] = [newShippingCostMethod];
        }

        return field;
    });
}

module.exports = () => {
    addProcessor('cartFields', modifyCartCalculationFields, 1)
};