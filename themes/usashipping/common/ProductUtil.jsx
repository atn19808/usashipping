export default function mapProductWithCart(products, cart) {
    return products.map(product => {
        const cartItem = cart?.items?.find(cartItem =>
            parseInt(cartItem.productId) === product.productId
        );

        return {
            ...product,
            cartQty: cartItem ? cartItem.qty : 0,
            cartItemUuid: cartItem ? cartItem.uuid : null,
        };
    });
}