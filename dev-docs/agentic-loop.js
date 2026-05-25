const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

// --- Mock tool implementations (simulate real responses) ---
function executeTool(toolName, toolInput) {
    // TODO: Add mock implementations for each tool
    // Return a string result that simulates what the real tool would return
    // Example: if toolName === "get_customer", return customer data as JSON string
    switch (toolName) {
        case "get_customer":
            return JSON.stringify({
                "name": "John Doe",
                "email": "[EMAIL_ADDRESS]",
                "order_history": [
                    {
                        "order_id": "123e4567-e89b-12d3-a456-426614174000",
                        "order_date": "2022-01-01",
                        "order_total": 100,
                        "order_status": "completed"
                    }
                ],
                "account_status": "active"
            });
        case "lookup_order":
            return JSON.stringify({
                "order_id": "123e4567-e89b-12d3-a456-426614174000",
                "order_date": "2022-01-01",
                "order_total": 100,
                "order_status": "completed",
                "customer_info": {
                    "name": "John Doe",
                    "email": "[EMAIL_ADDRESS]"
                },
                "items": [
                    {
                        "product_id": "123e4567-e89b-12d3-a456-426614174000",
                        "product_name": "Product 1",
                        "product_price": 50,
                        "product_quantity": 2
                    }
                ],
                "shipping_address": {
                    "street": "123 Main St",
                    "city": "New York",
                    "state": "NY",
                    "zip": "10001"
                }
            });
        case "check_product_availability":
            return JSON.stringify({
                "product_id": "123e4567-e89b-12d3-a456-426614174000",
                "product_name": "Product 1",
                "product_price": 50,
                "product_quantity": 2,
                "product_status": "available"
            });
        case "process_refund":
            return JSON.stringify({
                "order_id": "123e4567-e89b-12d3-a456-426614174000",
                "refund_amount": 100,
                "refund_status": "completed",
                "refund_date": "2022-01-01",
                "customer_info": {
                    "name": "John Doe",
                    "email": "[EMAIL_ADDRESS]"
                },
                "items": [
                    {
                        "product_id": "123e4567-e89b-12d3-a456-426614174000",
                        "product_name": "Product 1",
                        "product_price": 50,
                        "product_quantity": 2
                    }
                ],
                "shipping_address": {
                    "street": "123 Main St",
                    "city": "New York",
                    "state": "NY",
                    "zip": "10001"
                }
            });
    }
}

// --- Tool definitions (good versions from tool-definitions.json) ---
const tools = [
    // TODO: Paste your 4 good tool definitions here
    // Each needs: name, description, input_schema

    {
        "name": "get_customer",
        "description": "Look up a customer's profile by email address or customer UUID. Returns name, email, order history summary, and account status. Use this BEFORE lookup_order when the customer provides an email instead of an order ID. Returns empty object (not error) if no customer found",
        "input_schema": {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "description": "Customer email address (e.g. user@example.com)"
                },
                "customer_id": {
                    "type": "string",
                    "description": "Customer UUID (e.g. 123e4567-e89b-12d3-a456-426614174000). Not to be confused with order ID"
                }
            }
        }
    },
    {
        "name": "lookup_order",
        "description": "Look up an order by order ID. Returns order details including customer information, items purchased, shipping address, and order status. Use this AFTER get_customer when the customer provides an order ID instead of an email address. Returns empty object (not error) if no order is found",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "Order ID (e.g. 123e4567-e89b-12d3-a456-426614174000). Not to be confused with order number"
                }
            },
            "required": [
                "order_id"
            ]
        }
    },
    {
        "name": "check_product_availability",
        "description": "Check if a product is currently available for purchase. Use when a customer asks about product availability or stock status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "Product ID (e.g. 123e4567-e89b-12d3-a456-426614174000). Not to be confused with product sku"
                }
            },
            "required": [
                "product_id"
            ]
        }
    },
    {
        "name": "process_refund",
        "description": "Process a refund for an order. Returns the updated order details including customer information, items purchased, shipping address, and order status. This action is irreversible. Only call after confirming the order exists via lookup_order and verifying refund eligibility",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "Order ID (e.g. 123e4567-e89b-12d3-a456-426614174000). Not to be confused with order number"
                },
                "refund_amount": {
                    "type": "number",
                    "description": "Refund amount (e.g. 29.99). Use the full order total for a complete refund"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for refund (e.g. 'wrong size', 'damaged item', 'customer changed mind')"
                }
            },
            "required": [
                "order_id",
                "refund_amount",
                "reason"
            ]
        }
    }

];

// --- The Agentic Loop ---
async function agenticLoop(userMessage) {
    // Step 1: Initialize the messages array with the user's request
    const messages = [{ role: "user", content: userMessage }];

    // Step 2: Loop until Claude says it's done
    while (true) {
        // TODO: Call client.messages.create() with:
        //   - model: "claude-sonnet-4-20250514"
        //   - max_tokens: 1024
        //   - tools: your tools array
        //   - messages: the messages array
        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            tools: tools,
            messages: messages
        });

        // TODO: Check response.stop_reason
        //   - If "end_turn" → extract text from response.content and return it
        //   - If "tool_use" → continue to execute tools below

        if (response.stop_reason === "end_turn") {
            return response.content[0].text;
        }

        // TODO: Extract tool call(s) from response.content
        //   - response.content is an array of content blocks
        //   - Find blocks where block.type === "tool_use"
        //   - Each has: block.id, block.name, block.input

        const toolCalls = response.content.filter(block => block.type === "tool_use");

        // TODO: Execute each tool and build tool results
        //   - Call executeTool(block.name, block.input)
        //   - Build a tool_result content block for each

        const toolResults = toolCalls.map(toolCall => {
            const result = executeTool(toolCall.name, toolCall.input);
            return {
                type: "tool_result",
                tool_use_id: toolCall.id,
                content: result
            };
        });

        // TODO: Append to messages:
        //   1. Claude's full response as { role: "assistant", content: response.content }
        //   2. Tool results as { role: "user", content: [array of tool_result blocks] }
        //   A tool_result block looks like:
        //   { type: "tool_result", tool_use_id: block.id, content: resultString }

        messages.push({ role: "assistant", content: response.content });
        messages.push({ role: "user", content: toolResults });
    }
}

// --- Run it ---
agenticLoop("I need to return order abc-123, the item was damaged")
    .then((result) => console.log("Final response:", result))
    .catch((err) => console.error("Error:", err));
