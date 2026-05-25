---
description: Traces the full cart flow from localStorage to server sync to SSR rendering
context: fork
allowed-tools:
    - Read
    - Grep
    - Glob
---

Trace the cart data flow end-to-end. For each step, identify the specific file and function involved.

Start from:
1. How items get added to localStorage (localCart.js addItem)
2. How the badge updates (HeaderActions.jsx, useLocalCart hook)
3. What triggers server sync (localCart.js _doBackgroundSync)
4. Which API endpoints handle the sync (syncCart)
5. How the cart page loads server state (CartSync.jsx, SSR props)
6. How localStorage stays in sync with server state (CartSync.jsx, useLocalCart hook)
7. How the cart page clears localStorage (CartClear.jsx)


Return a numbered flow diagram with:
- Step number and description
- File path and function name
- Data format at each step (e.g., what's in localStorage vs what the API returns)

