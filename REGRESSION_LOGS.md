# Regression Test — Logs & Terminal Output

These snippets were captured during local testing while running the two dev servers.

## v1 (port 5173) — sample terminal output
```
> ecommerce-dashboard-v1@1.0.0 dev
> vite --port 5173

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
  VITE v5.4.21  ready in 2759 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## v2 (port 5174) — sample terminal output
```
> ecommerce-dashboard-v2@2.0.0 dev
> vite --port 5174

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
  VITE v5.4.21  ready in 845 ms

  ➜  Local:   http://localhost:5174/
```

## Example reproduction console output (Checkout)
- v2: Placed order (alert shown), then `navigate('/orders')` executed. Cart still retains items.
- v1: Placed order (alert shown), `clearCart()` executed and `navigate('/orders')` executed. Cart is empty afterward.

Notes: For complete terminal logs and screenshots, run the servers locally and capture the terminal and browser console output as described in the main guide.
