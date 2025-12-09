# Regression Test Guide — E-commerce v1 vs v2

## Identified Issues

### 1. Product Search Functionality Broken with Numbers
**Location:** `version2/src/components/Products.jsx` (lines 35-41)

**Reproduction Steps:**
1. Navigate to Products page
2. Enter a search term containing numbers (e.g., "99", "24")
3. Observe that all products in the selected category are displayed instead of filtering by name

**Expected Behavior (v1):** Search filters products by name regardless of content
**Actual Behavior (v2):** When search term contains digits, search is ignored and all category products are shown

**Impact:** Users cannot search for products with numbers in names (e.g., "Yoga Mat 24" would not be found when searching "24")

### 2. Cart Item Count Display Incorrect in Navbar
**Location:** `version2/src/components/Navbar.jsx` (lines 8-9)

**Reproduction Steps:**
1. Add items to cart (even number of total items, e.g., 2, 4, 6)
2. Observe cart badge in navbar shows one less than actual count

**Expected Behavior:** Badge shows accurate total item count
**Actual Behavior:** For even counts, displays count-1

**Impact:** Misleads users about cart contents, potentially causing confusion during checkout

### 3. Cart Removal Behavior Changed
**Location:** `version2/src/context/CartContext.jsx` (lines 32-42)

**Reproduction Steps:**
1. Add multiple quantities of same item to cart
2. Click "Remove" button on cart item
3. Observe quantity reduces to 1 instead of item being completely removed

**Expected Behavior (v1):** Remove button removes item entirely from cart
**Actual Behavior (v2):** Remove button reduces quantity to 1

**Impact:** Users expecting to remove items must click remove multiple times or manually set quantity to 0

### 4. Cart Total Calculation Buggy with Discounts
**Location:** `version2/src/context/CartContext.jsx` (lines 12-20)

**Reproduction Steps:**
1. Add more than 5 total items to cart
2. Check cart total - discount should apply but calculation is inefficient and potentially incorrect

**Expected Behavior:** Clean discount application when >5 items
**Actual Behavior:** Redundant calculations inside reduce loop, potential performance issues

**Impact:** Unnecessary performance overhead, possible calculation errors in edge cases

### 5. Checkout Form Validation Incomplete on Mobile
**Location:** `version2/src/components/Checkout.jsx` (lines 25-32)

**Reproduction Steps:**
1. Resize browser to mobile width (<768px)
2. Attempt to submit checkout form with missing required fields
3. Observe only email is validated, other fields are ignored

**Expected Behavior:** All required fields validated regardless of screen size
**Actual Behavior:** On mobile, only email validation occurs

**Impact:** Invalid orders can be placed on mobile devices, leading to data integrity issues

### 6. Email Validation Weakened
**Location:** `version2/src/components/Checkout.jsx` (line 42)

**Reproduction Steps:**
1. Enter email without domain extension (e.g., "user@domain")
2. Submit form

**Expected Behavior (v1):** Requires proper email format with domain
**Actual Behavior (v2):** Accepts emails without top-level domain

**Impact:** Allows invalid email formats, potential delivery issues for order confirmations

### 7. Cart Not Cleared After Order Placement
**Location:** `version2/src/components/Checkout.jsx` (lines 55-59)

**Reproduction Steps:**
1. Complete checkout process
2. After success message, check cart contents
3. Observe items remain in cart

**Expected Behavior (v1):** Cart is cleared after successful order
**Actual Behavior (v2):** Cart retains items post-order

**Impact:** Users must manually clear cart after ordering, confusing UX

### 8. Order History Display Order Reversed
**Location:** `version2/src/components/Orders.jsx` (lines 52-55)

**Reproduction Steps:**
1. Navigate to Orders page
2. Observe order display order

**Expected Behavior (v1):** Oldest orders first
**Actual Behavior (v2):** Newest orders first (reversed)

**Impact:** Changes user expectation for order history viewing, may confuse users accustomed to chronological order

## Analysis of Differences Affecting Functionality

### User Experience Impact
- **Search Issues:** Core product discovery broken, users can't find specific items
- **Cart Display:** Misleading information about cart state
- **Checkout Process:** Incomplete validation allows bad data, cart not cleared
- **Order Management:** Unexpected display order changes

### Functional Regressions
- Product search with numbers fails
- Cart badge under-reports even counts
- Remove functionality changed from delete to reduce
- Mobile checkout bypasses validation
- Email validation accepts invalid formats
- Post-order cart state incorrect

### Code Quality Issues
- Inefficient calculations in cart total
- Mobile-specific logic in validation
- Missing cart clear in checkout success flow

## Code-Level Observations

### Products.jsx Changes
- Added number detection in search filter
- Logic: `hasNumbers ? true : matchesSearch` effectively disables search when numbers present

### Navbar.jsx Changes
- Added cart count manipulation: `actualCount % 2 === 0 ? actualCount - 1 : actualCount`

### CartContext.jsx Changes
- Modified total calculation with discount logic (inefficient)
- Changed removeFromCart to reduce quantity to 1 instead of removing item

### Checkout.jsx Changes
- Added mobile detection for validation
- Weakened email regex
- Removed clearCart() from success handler
- Changed processing timeout from 2s to 1s

### Orders.jsx Changes
- Added order reversal: `[...mockOrders].reverse()`

All changes appear to be unintended regressions rather than planned features, significantly impacting user experience and data integrity.