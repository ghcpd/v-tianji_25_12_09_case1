# Regression Test Guide — E-commerce v1 vs v2

## Description
A structured guide to run, compare, and document functional regressions between two provided versions (version1 and version2) of the E-commerce Dashboard application. This document contains reproduction steps, observed behavior, impact analysis, code-level observations and suggested mitigations.

---

## How to run locally (quick start)

Prerequisites: Node.js (16+), npm, Windows (commands below use PowerShell)

1. Open two terminals.
2. Install dependencies for each version:
   - version1: `cd version1 && npm install`
   - version2: `cd version2 && npm install`
3. Start dev servers on different ports (examples used during testing):
   - version1: `cd version1 && npm run dev -- --port 5173`
   - version2: `cd version2 && npm run dev -- --port 5174`
4. Open in a browser:
   - version1: http://localhost:5173/
   - version2: http://localhost:5174/

Notes: Vite shows a deprecation warning in the terminal (CJS build warning) — not blocking.

---

## Summary of identified issues (priority sorted)

1. Navbar cart badge shows incorrect count in version2 (BUG)
2. removeFromCart behaves incorrectly in version2 (BUG)
3. Checkout does not clear cart after order in version2 (BUG)
4. Checkout form validation is relaxed on mobile in version2 (BUG / risk)
5. Product search behaves incorrectly when search contains digits in version2 (BUG)
6. Cart total discount logic in version2 applies 10% when total quantity > 5 (behavior change, needs validation)
7. Orders list reversed in version2 (behavior change/enhancement)

Each item below contains reproduction steps, expected vs actual behavior, code-level pointers, and impact analysis.

---

### 1) Navbar cart badge shows incorrect count (version2)

- Files:
  - version1: `src/components/Navbar.jsx`
  - version2: `src/components/Navbar.jsx`

Reproduction steps:
1. Run both versions locally (see Quick Start). Open both apps in browser side-by-side.
2. In the Products page of version1 (5173) add the same product twice (click "Add to Cart" twice). Observe the cart badge in the navbar: should display `2`.
3. Repeat on version2 (5174) adding the same product twice.

Expected (v1): Cart badge reads `2`.
Actual (v2): Cart badge reads `1` (because code reduces even counts by 1). If `getCartItemCount()` returns `0`, the internal expression becomes `-1` but badge is hidden due to `cartCount > 0` check.

Code clue (v2):
```js
const actualCount = getCartItemCount()
const cartCount = actualCount % 2 === 0 ? actualCount - 1 : actualCount
```
Impact: Misleading cart quantity for users; may reduce trust and confuse checkout (notably for even quantities).

Suggested fix: Use cartCount === actualCount; remove the odd correction logic.

---

### 2) removeFromCart behaves incorrectly (version2)

- Files:
  - version1: `src/context/CartContext.jsx` (removeFromCart removes item)
  - version2: `src/context/CartContext.jsx` (removeFromCart sets quantity to 1 when > 1)

Reproduction steps:
1. Add a product multiple times so its quantity is > 1.
2. In Cart page click "Remove" for that product in version1.
   - Expected (v1): product is removed from cart.
3. In Cart page click "Remove" for that product in version2.
   - Actual (v2): product quantity becomes `1` (instead of removing or decrementing).

Code clue (v2):
```js
if (itemToRemove && itemToRemove.quantity > 1) {
  return prevItems.map((item) =>
    item.id === productId
      ? { ...item, quantity: 1 }
      : item
  )
}
return prevItems.filter((item) => item.id !== productId)
```
Impact: Users cannot fully remove items with a single click; could lead to frustration and incorrect cart state.

Suggested fix: either remove the item entirely or decrement quantity. Match v1 behavior (remove item by id).

---

### 3) Checkout does not clear cart after successful order (version2)

- Files:
  - version1: `src/components/Checkout.jsx` (calls `clearCart()` after success)
  - version2: `src/components/Checkout.jsx` (missing `clearCart()` call)

Reproduction steps:
1. Add items to the cart.
2. Proceed to Checkout and fill valid data. Submit order.
3. v1: after success, cart is cleared and the app navigates to Orders.
   v2: after success, cart remains populated (no clearCart call).

Code clue (v1): on success handler:
```js
setIsProcessing(false)
clearCart()
alert('Order placed successfully!')
navigate('/orders')
```

Code clue (v2): `clearCart()` is not called after placing order.

Impact: Orders may be placed but cart isn't emptied — users may accidentally re-order same items or assume order didn’t complete. Also impacts analytics and order flow correctness.

Suggested fix: Add `clearCart()` after successful order placement (as in v1).

---

### 4) Checkout validation relaxed on mobile (version2)

- Files:
  - version1: `src/components/Checkout.jsx` (full validation independent of viewport)
  - version2: `src/components/Checkout.jsx` (mobile shortcut: only email required when window width <= 768)

Reproduction steps:
1. Using browser dev tools, set device width <= 768 (mobile emulation) for v2.
2. Leave required shipping/payment fields empty, provide only email.
3. Submit order.

Expected (v1): form shows validation errors and prevents submission until all required fields are valid.
Actual (v2): early return path for mobile only checks email and allows submission with incomplete details.

Code clue (v2):
```js
const isMobile = window.innerWidth <= 768
if (isMobile) {
  if (!formData.email.trim()) {
    newErrors.email = 'Email is required'
  }
  return Object.keys(newErrors).length === 0
}
```
Impact: Orders may be submitted with insufficient shipping/payment data on mobile, leading to failed fulfillment and support requests.

Suggested fix: Remove the mobile shortcut or replicate full validation across viewports.

---

### 5) Product search ignores queries containing digits (version2)

- Files:
  - version1: `src/components/Products.jsx` (normal name search)
  - version2: `src/components/Products.jsx` (special handling of digits)

Reproduction steps:
1. Navigate to Products page in v1 and v2.
2. Enter a numeric search term (e.g., `1` or `2024`) in the search input.
3. Observe results.

Expected (v1): search is case-insensitive match against product names; a numeric search should typically return nothing (unless product names have numbers).
Actual (v2): when search term contains digits, `hasNumbers` becomes true and the implementation returns all products (it bypasses search filter):
```js
const hasNumbers = /\d/.test(searchTerm)
const matchesSearch = hasNumbers ?
  false :
  product.name.toLowerCase().includes(searchTerm.toLowerCase())
return matchesFilter && (hasNumbers ? true : matchesSearch)
```
Impact: Searching with numeric terms behaves unexpectedly (shows all products), making search unreliable.

Suggested fix: Remove the special-case digit logic and rely on name matching. If numeric search should match IDs, explicitly wire that behavior.

---

### 6) Cart total 10% discount when totalQuantity > 5 (version2) — behavior change

- Files: `src/context/CartContext.jsx` (version2)

Observation:
- v2 applies a 10% discount on each item when the total cart item quantity exceeds 5.
- Implementation computes totalQuantity inside the reduce for each item (inefficient but functionally OK).

Reproduction steps:
1. Add items until total quantity > 5.
2. Observe `cartTotal` in Cart / Checkout — it will show discounted subtotal in v2 but not v1.

Impact: This is a pricing change (could be intentional new feature). It affects displayed subtotal, tax and shipping calculations. Confirm with product/PM if this is intended.

Suggested observation: If intended, add tests and update UI to indicate discount; if not, revert to v1 logic.

---

### 7) Orders list reversed order (version2) — enhancement

- Files: `src/components/Orders.jsx` (v2 reverses the mock orders list before setting state)

Description: v2 shows newest orders first (reversed mock array) — this is a potentially welcome UX improvement. No action needed unless product owners want the old behavior.

---

## Logs & Terminal notes

- Both dev servers started successfully during testing. Example terminal messages:
  - "VITE v5.x ready in ... ➜ Local: http://localhost:5174/"
  - Deprecation warnings: "The CJS build of Vite's Node API is deprecated..." (non-blocking)

Include terminal logs/screenshots in this document when reproducing manually — capture the startup logs and any console errors.

---

## Recommended test cases (manual + automated)

1. Add-to-cart counts
   - Add 1 item, expect badge 1; add again expect badge 2.
2. Remove-from-cart
   - Add quantity 3, click Remove once: v1 => item removed; v2 => item quantity becomes 1 (regression).
3. Checkout flow
   - Submit valid details: in v1 cart should clear; in v2 cart remains.
   - Mobile viewport validations: ensure all required fields are validated regardless of viewport.
4. Product search
   - Search numeric term and assert behavior is consistent and documented.
5. Discount behavior
   - Add 6 items total and assert cartTotal reflects 10% discount in v2.

Automated: Add unit tests around CartContext using Jest or React Testing Library to cover add/remove/update/clear and total calculations. A few basic tests would catch these regressions early.

---

## Code-level observations

- Several deliberate logic changes in version2 introduce regressions (Navbar badge math, removeFromCart behavior, Checkout validation and clearCart omission, Products search special-case).
- Some changes may be intentional (orders reversed, discount), verify with product/design.
- Performance: cartTotal calculation in v2 recomputes `totalQuantity` inside the reduce for every item — low severity but could be optimized.

Files to review (quick list):
- version1/src/components/Navbar.jsx
- version2/src/components/Navbar.jsx
- version1/src/context/CartContext.jsx
- version2/src/context/CartContext.jsx
- version1/src/components/Checkout.jsx
- version2/src/components/Checkout.jsx
- version1/src/components/Products.jsx
- version2/src/components/Products.jsx

---

## Suggested fixes (brief)
- Navbar: remove artificial even-number correction.
- CartContext: restore removeFromCart to remove item or decrement logically.
- Checkout: ensure clearCart() is called after successful order; remove mobile-only validation shortcut or ensure parity.
- Products search: remove digit-bypass behavior or implement intended ID-based search.
- Consider adding unit tests for CartContext and Checkout flows to prevent regressions.

---

## Artifacts
- This file (Regression Test Guide — E-commerce v1 vs v2.md) contains reproduction steps and code pointers.
- If you want, I can also add automated tests (Jest/RTL) to assert the buggy behaviors and demonstrate fixes.

---

Prepared by: regression run on December 9, 2025
Environment: Windows, Node/npm

