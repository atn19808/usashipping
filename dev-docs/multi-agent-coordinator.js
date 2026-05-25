const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

import { postToolUse, preToolUse } from "./agent-hooks.js";

const completedTools = new Set();

// --- Mock tool implementations (simulate real responses) ---
function executeTool(toolName, toolInput) {

    if (toolName === "process_refund" && (!completedTools.has("lookup_order") || !completedTools.has("get_customer"))) {
        return JSON.stringify({
            "scenario": "prerequisite not met",
            "response": {
                "isError": true,
                "errorCategory": "validation",
                "isRetryable": true,
                "message": "get_customer must be called before process_refund",
                "details": {
                    "missing_prerequisites": [
                        ...(!completedTools.has("get_customer") ? ["get_customer"] : []),
                        ...(!completedTools.has("lookup_order") ? ["lookup_order"] : [])
                    ]
                },
            }
        });
    }

    completedTools.add(toolName);

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
            if (toolInput.refund_amount > 500) {
                return JSON.stringify({
                    "isError": true,
                    "escalation_type": "refund_amount_exceeded",
                    "isRetryable": false,
                    "message": "Refund amount is more than 500. Please contact customer support for more information",
                    "details": {
                        "escalate_to_human": true,
                        "order_total": toolInput.order_total,
                        "requested_amount": toolInput.refund_amount,
                        "max_allowed_refund": 500
                    }
                });
            }

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

const sub_agents = [
    {
        "name": "order agent",
        "description": "you are an order agent, you are responsible for handling order related requests",
        "system_prompt": "You are an expert Order Agent. Your sole purpose is to investigate and manage customer orders. You have access to tools that allow you to look up orders and retrieve customer information. You are methodical, accurate, and always prioritize customer satisfaction. You never perform financial transactions directly; you only retrieve information. When you have all the necessary details, you provide a clear, concise summary of your findings.",
        "tools": [
            "lookup_order",
            "get_customer"
        ]
    },
    {
        "name": "inventory agent",
        "description": "you are an inventory agent, you are responsible for handling inventory related requests",
        "system_prompt": "You are an expert Inventory Agent. Your sole purpose is to manage product stock and availability. You have access to tools that allow you to check product availability. You are methodical, accurate, and always prioritize customer satisfaction. You never perform financial transactions directly; you only retrieve information. When you have all the necessary details, you provide a clear, concise summary of your findings.",
        "tools": [
            "check_product_availability"
        ]
    },
    {
        "name": "refund agent",
        "description": "you are a refund agent, you are responsible for handling refund related requests",
        "system_prompt": "You are an expert Refund Agent. Your sole purpose is to process customer refunds. You have access to tools that allow you to process refunds, look up orders, and retrieve customer information. You are methodical, accurate, and always prioritize customer satisfaction. You never perform financial transactions directly; you only retrieve information. When you have all the necessary details, you provide a clear, concise summary of your findings.",
        "tools": [
            "process_refund",
            "lookup_order",
            "get_customer"
        ]
    }
];

const agent_docs = [
    {
        "order agent": {
            "tool_choice": {
                "turn_1": {
                    "type": "tool",
                    "name": "get_customer"
                },
                "turn_2": {
                    "type": "tool",
                    "name": "lookup_order"
                },
                "turn_3": {
                    "type": "auto"
                }
            },
            "reasoning": "Order agent handles order-related requests"
        }
    },
    {
        "inventory agent": {
            "tool_choice": {
                "type": "tool",
                "name": "check_product_availability"
            },
            "reasoning": "Inventory agent handles inventory-related requests"
        }
    },
    {
        "refund agent": {
            "system_prompt": "You are an expert Refund Agent. Your sole purpose is to process customer refunds. You have access to tools that allow you to process refunds, look up orders, and retrieve customer information. You are methodical, accurate, and always prioritize customer satisfaction. You never perform financial transactions directly; you only retrieve information. When you have all the necessary details, you provide a clear, concise summary of your findings.",
            "tools": [
                "process_refund",
                "lookup_order",
                "get_customer"
            ],
            "tool_choice": {
                "turn_1": {
                    "type": "tool",
                    "name": "get_customer"
                },
                "turn_2": {
                    "type": "tool",
                    "name": "lookup_order"
                },
                "turn_3": {
                    "type": "auto"
                }
            },
            "reasoning": "Refund agent handles refund requests"
        }
    }
];

const dispatch_tool = [
    {
        "name": "dispatch_to_agent",
        "description": "Dispatch a request to the appropriate sub-agent based on the request type. Returns the sub-agent's response.",
        "input_schema": {
            "type": "object",
            "properties": {
                "agent_name": {
                    "type": "string",
                    "description": "The name of the sub-agent to dispatch the request to. Valid options are: order agent, inventory agent, refund agent"
                },
                "task": {
                    "type": "string",
                    "description": "The task to be performed by the sub-agent"
                },
                "context": {
                    "type": "string",
                    "description": "The coordinator agent's response to the user's request. Don't perform any actions in this field. Just provide a summary of the user's request and the coordinator agent's response"
                }
            },
            "required": [
                "agent_name",
                "task",
                "context"
            ]
        }
    }
]

const coordinator_agent = {
    "name": "coordinator",
    "description": "you are a coordinator agent, you are responsible for handling user requests",
    "system_prompt": "You are an expert Coordinator Agent. Your sole purpose is to manage customer requests. You have access to tools that allow you to look up orders, check product availability, and process refunds. You are methodical, accurate, and always prioritize customer satisfaction. You never perform financial transactions directly; you only retrieve information. When you have all the necessary details, you provide a clear, concise summary of your findings.",
    "tools": [
        "dispatch_to_agent"
    ],

    "reasoning": "Coordinator agent handles user requests"
};

// --- The Agentic Loop ---
async function coordinatorLoop(userMessage) {
    const messages = [];
    messages.push({
        role: "user",
        content: userMessage
    });

    while (true) {
        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: coordinator_agent.system_prompt,
            tools: dispatch_tool,
            messages: messages
        });

        if (response.stop_reason === "end_turn") {
            return response.content[0].text;
        }

        if (response.stop_reason === "tool_use") {
            const toolCalls = response.content.filter(block => block.type === "tool_use");

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                return await subAgentLoop(toolCall.input);
            }));


            messages.push({
                role: "assistant",
                content: response.content
            });
            messages.push({
                role: "user",
                content: toolCalls.map((tc, i) => ({
                    type: "tool_result",
                    tool_use_id: tc.id,
                    content: results[i]
                }))
            });
        };
    }
}

async function subAgentLoop(sub_agent) {
    const agent = sub_agents.find((agent) => agent.name === sub_agent.agent_name);
    const agentTools = agent.tools.map(name => tools.find(tool => tool.name === name));
    const messages = [];
    messages.push({
        role: "user",
        content: JSON.stringify({
            task: sub_agent.task,
            context: sub_agent.context
        })
    });

    while (true) {

        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            tools: agentTools,
            messages: messages,
            system: agent.system_prompt
        });

        if (response.stop_reason === "end_turn") {
            return response.content[0].text;
        }

        const toolCalls = response.content.filter(block => block.type === "tool_use");

        const toolResults = toolCalls.map(toolCall => {
            const blocked = preToolUse(toolCall.name, toolCall.input);
            if (blocked) {
                return {
                    type: "tool_result",
                    tool_use_id: toolCall.id,
                    content: JSON.stringify(blocked)
                }
            }
            const result = executeTool(toolCall.name, toolCall.input);
            const normalizedResult = postToolUse(result);

            return {
                type: "tool_result",
                tool_use_id: toolCall.id,
                content: normalizedResult
            };
        });

        messages.push({ role: "assistant", content: response.content });
        messages.push({ role: "user", content: toolResults });
    }
}

// --- Run it ---
coordinatorLoop("I want to return order abc-123 because the item was damaged, and also check if product xyz-789 is in stock for a replacement")
    .then((result) => console.log("Final response:", result))
    .catch((err) => console.error("Error:", err));
