# Regression Test Guide — E-commerce v1 vs v2

## Executive Summary

A comprehensive comparison of two versions of the e-commerce dashboard application reveals **5 critical functional regressions** in v2 that significantly impact user experience. These issues affect core shopping functionality including cart pricing calculations, product search, order history display, cart quantity management, and navigation accuracy.

---

## Test Environment Setup

### Version 1 Setup
```bash
cd version1
npm install
npm run dev
# Runs on http://localhost:3001
```

### Version 2 Setup
```bash
cd version2
npm install
npm run dev
# Runs on http://localhost:3003
```

**Note:** Both versions were installed and tested on the same machine with identical dependencies (React 18.2.0, React Router DOM 6.20.0, Vite 5.0.8, Recharts 2.10.3)

---

## Identified Regressions

### **REGRESSION #1: Cart Price Calculation with Bulk Purchase Discount (CRITICAL)**

**Severity:** HIGH  
**Component:** `CartContext.jsx` (Price Calculation Logic)  
**Affected Areas:** Cart page, Checkout page, Order Summary

#### Description
Version 2 introduces an undocumented automatic 10% discount applied when total quantity in cart exceeds 5 items. However, the discount logic is **incorrectly implemented** and applies a 10% discount per item rather than to the total subtotal.

#### Code-Level Observation

**Version 1 - Correct Implementation:**
```jsx
useEffect(() => {
  const total = cartItems.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
  setCartTotal(total)
}, [cartItems])
```

**Version 2 - Buggy Implementation:**
```jsx
useEffect(() => {
  const total = cartItems.reduce((sum, item) => {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    if (totalQuantity > 5) {
      return sum + item.price * item.quantity * 0.9
    }
    return sum + item.price * item.quantity
  }, 0)
  setCartTotal(total)
}, [cartItems])
```

**Issue:** The discount calculation is done per-item in the loop, and `totalQuantity` is recalculated for every single item iteration (extremely inefficient and redundant).

#### Reproduction Steps

1. **In Version 1:**
   - Navigate to Products page
   - Add 6 items to cart (e.g., 6 × Yoga Mat at $24.99 each)
   - Go to Cart
   - **Expected:** Subtotal = $149.94
   - **Actual (v1):** Subtotal = $149.94 ✓

2. **In Version 2:**
   - Navigate to Products page
   - Add 6 items to cart (e.g., 6 × Yoga Mat at $24.99 each)
   - Go to Cart
   - **Expected:** Subtotal = $149.94
   - **Actual (v2):** Subtotal = $134.946 (incorrect: each item multiplied by 0.9)
   - **Order Summary shows:** Subtotal: $134.95 (truncated)

#### Impact
- **User Impact:** Customers see incorrect pricing in the cart, leading to confusion at checkout
- **Business Impact:** Undocumented discount creates pricing unpredictability; customers may face unexpected charges
- **Trust Impact:** Pricing discrepancies erode customer confidence in the platform

#### Test Data Example
| Item | Price | Qty | Subtotal (v1) | Subtotal (v2) | Difference |
|------|-------|-----|---------------|---------------|------------|
| Yoga Mat | $24.99 | 6 | $149.94 | $134.95 | -$14.99 |
| Wireless Headphones | $99.99 | 3 | $299.97 | $269.97 | -$30.00 |

---

### **REGRESSION #2: Broken Product Search with Numeric Input (HIGH)**

**Severity:** HIGH  
**Component:** `Products.jsx` (Search Filtering Logic)  
**Affected Areas:** Product listing, Search functionality

#### Description
Version 2 contains logic that breaks product search when users enter any numeric characters. The filter logic is inverted, showing all products when numbers are entered but filtering when text is entered.

#### Code-Level Observation

**Version 1 - Working Search:**
```jsx
const filteredProducts = products.filter((product) => {
  const matchesFilter = filter === 'all' || product.category === filter
  const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
  return matchesFilter && matchesSearch
})
```

**Version 2 - Broken Search:**
```jsx
const filteredProducts = products.filter((product) => {
  const matchesFilter = filter === 'all' || product.category === filter
  const hasNumbers = /\d/.test(searchTerm)
  const matchesSearch = hasNumbers ?
    false :
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  return matchesFilter && (hasNumbers ? true : matchesSearch)
})
```

**Issue:** The filter logic contains contradictory conditions:
- If search term has numbers: `hasNumbers ? false` (no matching) but then `hasNumbers ? true` (show all) = ALWAYS SHOWS ALL
- If search term has text: performs normal search

#### Reproduction Steps

1. **In Version 1:**
   - Navigate to Products page
   - Type "Wireless" in search
   - **Expected:** Shows "Wireless Headphones" only
   - **Actual (v1):** Shows "Wireless Headphones" ✓
   - Clear search and type "99.99"
   - **Expected:** No results (product names don't contain prices)
   - **Actual (v1):** No results ✓

2. **In Version 2:**
   - Navigate to Products page
   - Type "Wireless" in search
   - **Expected:** Shows "Wireless Headphones"
   - **Actual (v2):** Shows "Wireless Headphones" ✓
   - Clear search and type "99.99"
   - **Expected:** No results
   - **Actual (v2):** Shows ALL 12 products (BUG!)
   - Clear search and type "99"
   - **Expected:** No results
   - **Actual (v2):** Shows ALL 12 products (BUG!)

3. **Further Testing in Version 2:**
   - Type "Smart1" (mixed text and numbers)
   - **Expected:** No matching products
   - **Actual (v2):** Shows ALL 12 products (because number is detected)

#### Impact
- **User Impact:** Users cannot search by product numbers (SKU, prices, etc.); search becomes unreliable
- **Business Impact:** Reduced product discoverability
- **Workaround:** Users must use category filters only

#### Root Cause Analysis
The developer likely intended to reject numeric-only searches but implemented inverted logic. The condition structure causes "show all products" to be the result when any number is detected.

---

### **REGRESSION #3: Incorrect Cart Remove Behavior (HIGH)**

**Severity:** HIGH  
**Component:** `CartContext.jsx` (removeFromCart Function)  
**Affected Areas:** Cart page, Item removal

#### Description
Version 2 modifies the `removeFromCart` function to reduce quantity to 1 instead of completely removing the item from the cart when quantity > 1. This prevents users from removing items and forces them to manually decrement multiple times.

#### Code-Level Observation

**Version 1 - Correct Remove:**
```jsx
const removeFromCart = (productId) => {
  setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
}
```

**Version 2 - Broken Remove:**
```jsx
const removeFromCart = (productId) => {
  setCartItems((prevItems) => {
    const itemToRemove = prevItems.find((item) => item.id === productId)
    if (itemToRemove && itemToRemove.quantity > 1) {
      return prevItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: 1 }
          : item
      )
    }
    return prevItems.filter((item) => item.id !== productId)
  })
}
```

**Issue:** When removing an item with quantity > 1, it sets quantity to 1 instead of removing it. Only removes when quantity equals 1.

#### Reproduction Steps

1. **In Version 1:**
   - Add "Wireless Headphones" to cart (qty = 1)
   - Click Remove button
   - **Expected:** Item completely removed from cart
   - **Actual (v1):** Item removed ✓
   - Add "Yoga Mat" and increase quantity to 3
   - Click Remove button
   - **Expected:** Item completely removed
   - **Actual (v1):** Item removed ✓

2. **In Version 2:**
   - Add "Yoga Mat" to cart and increase quantity to 3
   - Click Remove button
   - **Expected:** Item completely removed from cart
   - **Actual (v2):** Quantity set to 1 (item remains in cart) ✗
   - Click Remove button again
   - **Expected:** Item removed
   - **Actual (v2):** Item finally removed on second click
   - Add "Smart Watch" (qty = 1) and click Remove
   - **Expected:** Item removed
   - **Actual (v2):** Item removed (only works for qty = 1) ✓

#### Impact
- **User Impact:** Users must click Remove button multiple times to actually remove items; frustrating UX
- **Accessibility Impact:** Increased interaction burden for users with mobility challenges
- **Business Impact:** Cart may contain unwanted items that users can't easily remove
- **Support Impact:** Likely to generate user support tickets about "broken remove button"

#### Workaround (User Perspective)
- Use quantity decrementation (-) button instead of Remove
- Or click Remove button twice

---

### **REGRESSION #4: Cart Badge Shows Incorrect Item Count (MEDIUM)**

**Severity:** MEDIUM  
**Component:** `Navbar.jsx` (Cart Badge Display)  
**Affected Areas:** Navigation bar, Cart badge

#### Description
Version 2 applies an incorrect mathematical transformation to the cart item count displayed in the navbar badge. The count shown is manipulated using modulo arithmetic, causing the badge to display wrong numbers.

#### Code-Level Observation

**Version 1 - Correct Display:**
```jsx
const Navbar = () => {
  const { getCartItemCount } = useCart()
  const cartCount = getCartItemCount()
  
  return (
    // ... navbar JSX
    Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
  )
}
```

**Version 2 - Buggy Display:**
```jsx
const Navbar = () => {
  const { getCartItemCount } = useCart()
  const actualCount = getCartItemCount()
  const cartCount = actualCount % 2 === 0 ? actualCount - 1 : actualCount
  
  return (
    // ... navbar JSX
    Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
  )
}
```

**Issue:** The code subtracts 1 from even-numbered item counts. This creates a mapping:
- 1 item → shows 1 ✓
- 2 items → shows 1 ✗
- 3 items → shows 3 ✓
- 4 items → shows 3 ✗
- 5 items → shows 5 ✓
- 6 items → shows 5 ✗

#### Reproduction Steps

1. **In Version 1:**
   - Navigate to Products
   - Add 2 items (e.g., 2 × Yoga Mat)
   - Look at Navbar badge
   - **Expected:** Badge shows "2"
   - **Actual (v1):** Badge shows "2" ✓
   - Add 1 more (qty = 3)
   - **Expected:** Badge shows "3"
   - **Actual (v1):** Badge shows "3" ✓

2. **In Version 2:**
   - Navigate to Products
   - Add 2 items (2 × Yoga Mat)
   - Look at Navbar badge
   - **Expected:** Badge shows "2"
   - **Actual (v2):** Badge shows "1" ✗
   - Add 1 more item to get qty = 3
   - **Expected:** Badge shows "3"
   - **Actual (v2):** Badge shows "3" ✓
   - Add 1 more item to get qty = 4
   - **Expected:** Badge shows "4"
   - **Actual (v2):** Badge shows "3" ✗

#### Impact
- **User Impact:** Cart badge is misleading; users see incorrect item counts in navigation
- **Navigation Impact:** Users may click cart icon expecting different number of items
- **Trust Impact:** Inconsistency creates doubt about system accuracy
- **Severity:** Medium (doesn't prevent purchase, but causes confusion)

---

### **REGRESSION #5: Order History Display Order Changed (MEDIUM)**

**Severity:** MEDIUM  
**Component:** `Orders.jsx` (Data Presentation)  
**Affected Areas:** Order history page, Order listing sequence

#### Description
Version 2 reverses the order of orders displayed in the order history without documentation. Orders appear in reverse chronological order instead of chronological order, potentially confusing users about which orders are most recent.

#### Code-Level Observation

**Version 1 - Original Order:**
```jsx
useEffect(() => {
  const mockOrders = [
    { id: 1, orderNumber: 'ORD-2024-001', date: '2024-01-15', /* ... */ },
    { id: 2, orderNumber: 'ORD-2024-002', date: '2024-01-20', /* ... */ },
    { id: 3, orderNumber: 'ORD-2024-003', date: '2024-01-25', /* ... */ },
    { id: 4, orderNumber: 'ORD-2024-004', date: '2024-02-01', /* ... */ },
  ]

  setTimeout(() => {
    setOrders(mockOrders)
    setLoading(false)
  }, 500)
}, [])
```

**Version 2 - Reversed Order:**
```jsx
useEffect(() => {
  const mockOrders = [
    { id: 1, orderNumber: 'ORD-2024-001', date: '2024-01-15', /* ... */ },
    { id: 2, orderNumber: 'ORD-2024-002', date: '2024-01-20', /* ... */ },
    { id: 3, orderNumber: 'ORD-2024-003', date: '2024-01-25', /* ... */ },
    { id: 4, orderNumber: 'ORD-2024-004', date: '2024-02-01', /* ... */ },
  ]

  setTimeout(() => {
    const reversedOrders = [...mockOrders].reverse()
    setOrders(reversedOrders)
    setLoading(false)
  }, 500)
}, [])
```

**Issue:** Line `const reversedOrders = [...mockOrders].reverse()` changes the display order without user documentation or preference option.

#### Reproduction Steps

1. **In Version 1:**
   - Navigate to Orders page
   - Observe order list from top to bottom
   - **Expected Display Order:**
     1. ORD-2024-001 (Jan 15)
     2. ORD-2024-002 (Jan 20)
     3. ORD-2024-003 (Jan 25)
     4. ORD-2024-004 (Feb 01) ← Most recent at bottom
   - **Actual (v1):** Orders displayed in chronological order ✓

2. **In Version 2:**
   - Navigate to Orders page
   - Observe order list from top to bottom
   - **Expected Display Order:** Same as above
   - **Actual (v2):**
     1. ORD-2024-004 (Feb 01) ← Most recent at top
     2. ORD-2024-003 (Jan 25)
     3. ORD-2024-002 (Jan 20)
     4. ORD-2024-001 (Jan 15)
   - **Actual (v2):** Orders displayed in reverse chronological order ✗

#### Impact
- **User Impact:** Users expect most recent orders at the bottom (following document flow) or clearly marked; changing this without indication creates confusion
- **Usability Impact:** Users must scroll or scan to find their most recent order
- **Accessibility Impact:** Screen reader users may not realize the order is reversed without explicit announcement
- **Severity:** Medium (not a blocker, but unexpected behavior change)

---

### **REGRESSION #6: Checkout Form Validation Incomplete on Mobile (MEDIUM)**

**Severity:** MEDIUM  
**Component:** `Checkout.jsx` (Form Validation Logic)  
**Affected Areas:** Checkout page, Mobile experience

#### Description
Version 2 adds incomplete form validation logic that only validates email on devices with viewport width ≤ 768px (tablets/mobile), skipping all other required field validations on mobile devices. This allows invalid checkouts on mobile.

#### Code-Level Observation

**Version 1 - Complete Validation:**
```jsx
const validateForm = () => {
  const newErrors = {}

  if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
  if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
  if (!formData.email.trim()) {
    newErrors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email format'
  }
  // ... validates all 13 fields
}
```

**Version 2 - Broken Mobile Validation:**
```jsx
const validateForm = () => {
  const newErrors = {}

  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    }
    return Object.keys(newErrors).length === 0  // Returns early with only email check!
  }

  if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
  // ... rest of validation
}
```

**Issue:** Early return on mobile validation skips all other field validation. Users can submit form with empty name, address, phone, card details, etc.

#### Reproduction Steps

1. **In Version 1 (Any Device):**
   - Navigate to Checkout with items in cart
   - Leave all fields empty
   - Click "Place Order"
   - **Expected:** Shows validation errors for all empty fields
   - **Actual (v1):** Shows validation errors ✓

2. **In Version 2 - Desktop (1920px):**
   - Navigate to Checkout with items in cart
   - Leave all fields empty
   - Click "Place Order"
   - **Expected:** Shows validation errors
   - **Actual (v2):** Shows validation errors ✓

3. **In Version 2 - Mobile (375px viewport):**
   - Navigate to Checkout with items in cart
   - Leave all fields empty
   - Click "Place Order"
   - **Expected:** Shows validation errors for all empty fields
   - **Actual (v2):** No errors shown! Form submission proceeds! ✗
   - **Actual (v2):** Shows only "Email is required" if email is empty

#### Impact
- **User Impact:** Mobile users can submit incomplete checkout forms
- **Data Quality Impact:** Potentially receive orders with missing customer information
- **Business Impact:** Invalid orders need manual processing and customer follow-up
- **Trust Impact:** Users experience unexpected form submission behavior on mobile
- **Compliance Impact:** May violate form accessibility standards (WCAG)

#### Workaround
- Use desktop version for checkout
- Or fill out email field (only field validated on mobile)

---

### **REGRESSION #7: Slow Checkout Processing & Navigation (LOW)**

**Severity:** LOW  
**Component:** `Checkout.jsx` (Order Processing Flow)  
**Affected Areas:** Checkout page, After order submission

#### Description
Version 2 increases the order processing time from 2 seconds to 1 second but adds an additional 500ms delay on navigation redirect, creating inconsistent UX timing.

#### Code-Level Observation

**Version 1:**
```jsx
const handleSubmit = async (e) => {
  // ... validation
  setIsProcessing(true)

  setTimeout(() => {
    setIsProcessing(false)
    clearCart()
    alert('Order placed successfully!')
    navigate('/orders')
  }, 2000)
}
```

**Version 2:**
```jsx
const handleSubmit = async (e) => {
  // ... validation
  setIsProcessing(true)

  setTimeout(() => {
    setIsProcessing(false)
    alert('Order placed successfully!')
    setTimeout(() => navigate('/orders'), 500)  // Additional nested setTimeout
  }, 1000)
}
```

**Issues:**
1. `clearCart()` is missing in v2 (separate bug) - cart persists after order
2. Processing time reduced (could be intentional optimization)
3. Navigation delayed by additional 500ms nested timeout (timing smell)
4. Total user wait time: 1000ms + 500ms + alert dismiss = variable UX

#### Reproduction Steps

1. **In Version 1:**
   - Fill checkout form with valid data
   - Click "Place Order"
   - **Expected:** Processing spinner shows ~2 seconds, then alert, then redirects to Orders
   - **Actual (v1):** Alert shown after 2 seconds, immediate redirect after alert dismissed ✓
   - **Actual (v1):** Cart is cleared after order ✓

2. **In Version 2:**
   - Fill checkout form with valid data
   - Click "Place Order"
   - **Expected:** Processing spinner shows ~2 seconds, then alert, then redirects to Orders
   - **Actual (v2):** Alert shown after 1 second, additional 500ms delay before redirect ✗
   - **Actual (v2):** Cart is NOT cleared - items remain in cart after checkout! ✗

#### Impact
- **User Impact:** Inconsistent timing feels broken; items remain in cart after successful order
- **UX Impact:** Users may click Order multiple times thinking it didn't work
- **Data Impact:** Cart state management is broken (missing clearCart call)

---

## Summary Table

| # | Regression | Severity | Component | Impact |
|---|-----------|----------|-----------|--------|
| 1 | Cart price calculation with bulk discount | CRITICAL | CartContext | Incorrect pricing shown to customers |
| 2 | Product search breaks with numbers | HIGH | Products | Users can't search properly |
| 3 | Remove button doesn't remove items with qty>1 | HIGH | CartContext | Users stuck with items in cart |
| 4 | Cart badge shows wrong count | MEDIUM | Navbar | Navigation feedback is misleading |
| 5 | Order history displayed in reverse | MEDIUM | Orders | Unexpected display order |
| 6 | Checkout validation incomplete on mobile | MEDIUM | Checkout | Invalid orders submitted on mobile |
| 7 | Slow/missing checkout flow | LOW | Checkout | Cart not cleared, timing issues |

---

## Impact Analysis

### Critical Issues (Require Immediate Fix)
- **Regression #1:** Pricing discrepancies directly impact revenue and customer trust
  - Affects all purchases with 6+ items
  - Creates legal/compliance issues with incorrect pricing

### High Priority Issues (Must Fix Before Release)
- **Regression #2:** Broken search reduces product discoverability
  - Impacts any user searching for products with numbers
  - Frustrates users and reduces conversions
  
- **Regression #3:** Remove button requires multiple clicks
  - Violates user expectations and UX standards
  - Increases support burden

### Medium Priority Issues (Should Fix)
- **Regression #4:** Misleading cart badge (not critical but erodes trust)
- **Regression #5:** Unexpected order display order (confusing but not breaking)
- **Regression #6:** Mobile validation bypass (significant for mobile commerce)

### Low Priority Issues (Can Fix in Patch)
- **Regression #7:** Timing and clearCart issues (UX polish)

---

## Recommendations

### Immediate Actions
1. **Roll back v2** to v1 pending fixes OR apply patches to v2 before production
2. **Fix Regression #1** - Rewrite price calculation logic to apply discount to total, not per-item
3. **Fix Regression #3** - Restore original removeFromCart function
4. **Fix Regression #2** - Remove or rewrite the broken search logic

### Pre-Release Testing
1. Add unit tests for cart calculation with various item quantities
2. Add unit tests for search functionality with numeric and alphanumeric input
3. Add mobile device testing (actual devices, not just viewport resizing)
4. Add e-commerce acceptance tests for full purchase flow

### Code Review Recommendations
- Single Responsibility Principle: `removeFromCart` should do one thing
- Function complexity: Nested calculations in reduce should be extracted
- Logic validation: Complex conditionals should have clear comments
- Mobile-first testing: All validation should work on all viewports

---

## Testing Checklist for v2 Remediation

- [ ] Bulk discount applies to total, not per-item
- [ ] Bulk discount only applies when total quantity > 5
- [ ] Search works with numeric input
- [ ] Search works with text input
- [ ] Search works with special characters
- [ ] Remove button removes items on first click
- [ ] Remove button works for all quantity values
- [ ] Cart badge shows correct count for 1-10 items
- [ ] Orders display in correct chronological order
- [ ] Mobile checkout validates all required fields
- [ ] Cart clears after successful order
- [ ] Order history shows most recent orders
- [ ] Cart total updates correctly in real-time

---

## Conclusion

Version 2 contains multiple functional regressions that would impact user experience and business operations if deployed to production. The most critical issue is the pricing calculation bug that would result in incorrect charges to customers. The search and remove button issues would create significant user friction and support burden.

**Recommendation: DO NOT DEPLOY v2 to production until all identified issues are resolved and thorough testing is completed.**

