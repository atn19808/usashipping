import React from 'react';
import PropTypes from 'prop-types';

export default function Quantity({ qty: quantity, isLoading, onChangeQty, onRemove }) {
    const [debounceTimer, setDebounceTimer] = React.useState(null);

    const updateQuantity = (isIncrease) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        const timer = setTimeout(() => {
            onChangeQty(isIncrease);
        }, 500);
        setDebounceTimer(timer);
    };

    const removeItem = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        const timer = setTimeout(() => {
            onRemove();
        }, 500);
        setDebounceTimer(timer);
    }

    return (
        <div className="qty-box grid grid-cols-3 border border-[#ccc]">
            {quantity > 1 && (
                <button
                    className="flex justify-center items-center"
                    onClick={() => updateQuantity(false)}
                    disabled={isLoading}
                    type="button"
                >
                    {isLoading && (
                        <svg
                            aria-hidden="true"
                            focusable="false"
                            role="presentation"
                            className="spinner"
                            viewBox="0 0 66 66"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                className="path"
                                fill="none"
                                strokeWidth="6"
                                cx="33"
                                cy="33"
                                r="30"
                            />
                        </svg>
                    )}
                    {!isLoading && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                            focusable="false"
                            role="presentation"
                            className="icon icon-minus"
                            fill="none"
                            viewBox="0 0 10 2"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 110 1H1A.5.5 0 01.5 1z"
                                fill="currentColor"
                            />
                        </svg>
                    )}
                </button>
            )}
            {quantity === 1 && (
                <button
                    className="flex justify-center items-center"
                    onClick={() => removeItem()}
                    disabled={isLoading}
                    type="button"
                >
                    {isLoading && (
                        <svg
                            aria-hidden="true"
                            focusable="false"
                            role="presentation"
                            className="spinner"
                            viewBox="0 0 66 66"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                className="path"
                                fill="none"
                                strokeWidth="6"
                                cx="33"
                                cy="33"
                                r="30"
                            />
                        </svg>
                    )}
                    {!isLoading && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                            focusable="false"
                            role="presentation"
                            className="icon icon-trash"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7M10 11v6M14 11v6M3 7h18M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3"
                            />
                        </svg>
                    )}
                </button>
            )}
            <input type="text" value={quantity} readOnly />
            <button
                className="flex justify-center items-center"
                onClick={() => updateQuantity(true)}
                disabled={isLoading}
                type="button"
            >
                {isLoading && (
                    <svg
                        aria-hidden="true"
                        focusable="false"
                        role="presentation"
                        className="spinner"
                        viewBox="0 0 66 66"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            className="path"
                            fill="none"
                            strokeWidth="6"
                            cx="33"
                            cy="33"
                            r="30"
                        />
                    </svg>
                )}
                {!isLoading && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        focusable="false"
                        role="presentation"
                        className="icon icon-plus"
                        fill="none"
                        viewBox="0 0 10 10"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M1 4.51a.5.5 0 000 1h3.5l.01 3.5a.5.5 0 001-.01V5.5l3.5-.01a.5.5 0 00-.01-1H5.5L5.49.99a.5.5 0 00-1 .01v3.5l-3.5.01H1z"
                            fill="currentColor"
                        />
                    </svg>
                )}
            </button>
        </div>
    );
}

Quantity.propTypes = {
    qty: PropTypes.number.isRequired,
    isLoading: PropTypes.bool,
    onChangeQty: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
};
