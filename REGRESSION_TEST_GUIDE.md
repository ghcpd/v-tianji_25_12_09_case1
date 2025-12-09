# Regression Test Guide — E-commerce v1 vs v2

## Overview
This guide documents functional regressions discovered while running and comparing version1 and version2 of the provided e-commerce dashboard application. It contains reproduction steps, observed behavior, impact analysis, and code-level pointers.

Local dev servers used during testing:
- v1: http://localhost:5173
- v2: http://localhost:5174

How to run locally
1. Open separate terminals and run:
   - cd version1 && npm install && npm run dev -- --port 5173
   - cd version2 && npm install && npm run dev -- --port 5174
2. Open the URLs above in your browser and exercise the functionality.

Test methodology
- Manual exploratory testing across main flows: Products -> Add to cart -> Cart -> Checkout -> Orders.
- Code inspection to confirm root cause and locate regressions.

---

# Identified issues

## 1) Checkout does not clear cart after successful order (v2 regression)
- Files:
  - version1/src/components/Checkout.jsx — clearCart() is called after order is placed
  - version2/src/components/Checkout.jsx — clearCart() is NOT called
- Reproduction steps
  1. Start both apps as shown above.
  2. In either app, open the Products page and add at least one product to cart.
  3. Navigate to /checkout and fill required form fields with valid values.
  4. Click "Place Order" and confirm the success alert and navigation to /orders.
  5. Observe the cart after placing the order (Visit /cart).
- Expected
  - Cart should be emptied and cart total reset to $0.00 after a successful checkout.
- Actual (v2)
  - The cart retains items in v2; cartItems are not cleared, causing stale order state.
- Impact
  - High: Users will see their previous cart items after checkout, causing confusion and duplicate orders.

## 2) removeFromCart behavior changed (v2 regression)
- Files:
  - version1/src/context/CartContext.jsx — removeFromCart removes the item
  - version2/src/context/CartContext.jsx — removeFromCart resets quantity to 1 when quantity>1
- Reproduction steps
  1. Add an item multiple times so its quantity > 1.
  2. Visit /cart.
  3. Click "Remove" for that item (or trigger removeFromCart programmatically).
  4. Observe item quantity.
- Expected
  - Remove should remove the item from cart or decrement quantity depending on UX (v1 removed fully).
- Actual (v2)
  - If quantity > 1 the item quantity is set to 1 (not decrementing and not removing).
- Impact
  - Medium: The "Remove" action behaves unexpectedly and is inconsistent with v1; potential for user frustration.

## 3) Relaxed/incorrect email validation on checkout (v2)
- Files:
  - version1/src/components/Checkout.jsx — stricter email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - version2/src/components/Checkout.jsx — looser email regex: `/^[^\s@]+@[^\s@]+$/`
- Reproduction steps
  1. Try to submit checkout form with an invalid email like `alice@localhost`.
  2. Observe validation behavior.
- Expected
  - Invalid email formats should be rejected and show an error message.
- Actual (v2)
  - v2 accepts some invalid addresses (missing a dot-separated domain part), allowing malformed emails to pass validation.
- Impact
  - Medium: Bad backend data, possible failed deliveries, and poor data quality.

## 4) Mobile-specific short-circuit validation (v2)
- Files:
  - version2/src/components/Checkout.jsx includes an early-return for mobile (`isMobile`) that only requires a non-empty email.
- Reproduction steps
  1. Resize browser to mobile width (<= 768px) or use mobile device.
  2. Submit the checkout form with only an email.
- Expected
  - Checkout should validate required shipping and payment info on all platforms.
- Actual (v2)
  - v2 only validates that email is present on mobile, allowing other required fields to be empty.
- Impact
  - High: Orders may be created with missing shipping/payment details on mobile causing failed deliveries, charge errors, or manual follow-up.

## 5) Cart total calculation and discount behavior changed (v2)
- Files:
  - version2/src/context/CartContext.jsx calculates cartTotal with a 10% discount when total quantity > 5.
- Reproduction steps
  1. Add several items so totalQuantity > 5.
  2. Observe totals on Cart and Checkout pages.
- Observations / Notes
  - This might be an intentional feature (volume discount). However the implementation is O(n^2) and may apply the discount to each item by checking totalQuantity repeatedly; it works but could be optimized.
- Impact
  - Low (functional) but Medium (performance for large carts). If this is intentional, it should be documented and surfaced in UI.

---

# Additional developer-experience observations
- dev scripts and dependencies match between versions; starting servers required explicit port flags when running both at the same time.
- Some dev start attempts printed error messages when incorrect flags were passed (e.g., `--silent` with `npm run dev -- --silent` on some commands produced CACError). Not end-user impacting but noted for dev docs.

# Suggested fixes
1. Checkout: call `clearCart()` after order placement in version2 to match v1 behavior. (version2/src/components/Checkout.jsx)
2. CartContext: revert `removeFromCart` to v1 behavior or implement consistent decrement/confirm removal UX.
3. Validation: fix email regex in v2 and remove the mobile shortcut or ensure required fields are completed prior to allowing the order.
4. Replace O(n^2) cart total calculation with a single pass calculation for performance and clarity.

# Test cases to add (automated)
- Add-to-cart -> Checkout -> Place order -> Cart is empty (assertion)
- Add multiple quantity -> Remove -> Validate removal semantics
- Checkout email validation: accept valid, reject invalid
- Cart total discount: assert expected discounted total when quantity threshold exceeded

# Logs & Screenshots
- Developer console and Vite server logs are available in the terminal where `npm run dev` is executed.
- For screenshots: open the browser to the test scenario and use OS screenshot tool and save with naming convention `v1-<scenario>.png` and `v2-<scenario>.png`.

---

If you'd like, I can:
- Create automated unit/integration tests to cover the above regressions and add them to the repo.
- Produce a small PR with suggested code changes for high-severity regressions.

Document prepared by: GitHub Copilot
Model: vsc-5mini-mix22-arm3-s400
Date: 2025-12-09
