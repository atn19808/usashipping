# Fetch pricing

We will focus on USD/VND pair.

API document: https://github.com/fawazahmed0/exchange-api?tab=readme-ov-file

API to use:
- Main: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json
- Fallback: https://latest.currency-api.pages.dev/v1/currencies/usd.min.json

Schema:
```json
{
    "date": "YYYY-MM-DD",
    "usd": {
        "vnd": 0.00,
        ...
    }
}
```

We can go with naive implementation: get price and save current rate -> FE get the rate and convert on the FE.