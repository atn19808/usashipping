function postToolUse(toolResult) {
    const parsedResult = JSON.parse(toolResult);

    for (const key of Object.keys(parsedResult)) {
        if (key.endsWith("_date") && parsedResult[key]) {
            parsedResult[key] = new Date(parsedResult[key]).toISOString();
        }
        if ((key.endsWith("_price") || key.endsWith("_total") || key.endsWith("_amount")) && typeof parsedResult[key] === "number") {
            parsedResult[key] = `$${parsedResult[key].toFixed(2)}`;
        }
    }

    return JSON.stringify(parsedResult);
}

function preToolUse(toolName, toolInput) {
    if (toolName === "process_refund" && toolInput.refund_amount > 500) {
        return {
            content: JSON.stringify({
                isError: true,
                errorCategory: "permission",
                isRetryable: false,
                message: "Refund amount is more than 500. Please contact customer support for more information",
                details: {
                    escalate_to_human: true,
                    order_total: toolInput.order_total,
                    requested_amount: toolInput.refund_amount,
                    max_allowed_refund: "500"
                }
            })
        };
    }
    return null;
}
