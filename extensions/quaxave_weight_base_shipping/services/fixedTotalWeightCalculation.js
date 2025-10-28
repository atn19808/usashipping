module.exports = async function resolver() {
    const items = this.getItems();
    const weight = items.reduce((previous, item) => previous + item.getData('product_weight') * item.getData('qty'), 0, items);
    return weight.toFixed(2);
}