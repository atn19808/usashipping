const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Weight: {
    value: (raw) => parseFloat(raw),
    unit: () => getConfig('shop.weightUnit', 'kg'),
    text: (raw) => {
      const weight = Math.round(parseFloat(raw) * 100) / 100;
      const unit = getConfig('shop.weightUnit', 'kg');
      return `${weight} ${unit}`;
    }
  }
};
