# E-Commerce v1 vs v2 Regression Test Summary

## Quick Reference

**Test Date:** December 9, 2025  
**Testing Methodology:** Code analysis + Runtime testing  
**Test Coverage:** All major application flows (Dashboard, Products, Cart, Checkout, Orders, Navigation)

---

## Critical Findings at a Glance

### 🔴 **7 Regressions Identified**

| Issue | Type | Impact | Status |
|-------|------|--------|--------|
| **#1: Incorrect bulk discount calculation** | Bug | Pricing wrong for >5 items | ❌ BLOCKS RELEASE |
| **#2: Search breaks with numbers** | Bug | Users can't search | ❌ BLOCKS RELEASE |
| **#3: Remove button doesn't remove** | Bug | Items stuck in cart | ❌ BLOCKS RELEASE |
| **#4: Cart badge shows wrong count** | Bug | Navigation feedback wrong | ⚠️ Should fix |
| **#5: Order history in reverse** | Change | Unexpected order | ⚠️ Should fix |
| **#6: Mobile validation incomplete** | Security | Orders bypass validation | ⚠️ Should fix |
| **#7: Missing clearCart() after order** | Bug | Cart persists after checkout | ⚠️ Should fix |

---

## Detailed Regressions

### 1️⃣ Cart Price Calculation (CRITICAL) 🔴

**Problem:** V2 applies 10% discount per-item instead of per-order for >5 items

**Code Issue:**
- V1: Calculates `sum + price × quantity`
- V2: Calculates `sum + (price × quantity × 0.9)` in loop + recalculates total quantity for EACH item

**Example:** 6 × Yoga Mat ($24.99 each)
- V1: $149.94 ✓
- V2: $134.95 ✗ (incorrect 10% applied per item)

**Business Impact:** Wrong pricing shown to customers

---

### 2️⃣ Product Search with Numbers (HIGH) 🔴

**Problem:** Search returns ALL products when numbers are entered, nothing for text-only

**Code Issue:**
```javascript
const hasNumbers = /\d/.test(searchTerm)
const matchesSearch = hasNumbers ? false : product.name.toLowerCase().includes(...)
return matchesFilter && (hasNumbers ? true : matchesSearch)
// Result: hasNumbers = show all, no numbers = search normally
```

**Example:**
- Search "Wireless": Shows Wireless Headphones ✓
- Search "99.99": Shows ALL 12 products ✗
- Search "1": Shows ALL 12 products ✗

**User Impact:** Cannot search by product numbers, prices, or IDs

---

### 3️⃣ Remove Button Doesn't Remove (HIGH) 🔴

**Problem:** Removes sets quantity to 1 instead of removing item (for qty > 1)

**Code Issue:**
```javascript
if (existingItem && existingItem.quantity > 1) {
  return prevItems.map(item =>
    item.id === productId ? { ...item, quantity: 1 } : item
  )  // Sets qty to 1 instead of removing!
}
```

**Example:**
- Add item with qty 3
- Click Remove → qty becomes 1 (not removed)
- Click Remove again → item finally removed

**User Impact:** Multiple clicks needed to remove items

---

### 4️⃣ Cart Badge Wrong Count (MEDIUM) 🟡

**Problem:** Badge subtracts 1 from even quantities

**Code Issue:**
```javascript
const cartCount = actualCount % 2 === 0 ? actualCount - 1 : actualCount
// 2 items shows 1, 4 items shows 3, 6 items shows 5, etc.
```

**Example:**
- 2 items in cart → badge shows "1"
- 3 items in cart → badge shows "3"
- 4 items in cart → badge shows "3"

**User Impact:** Misleading navigation feedback

---

### 5️⃣ Order History Reversed (MEDIUM) 🟡

**Problem:** Orders displayed in reverse chronological order (newest first)

**Code Issue:**
```javascript
const reversedOrders = [...mockOrders].reverse()
setOrders(reversedOrders)
```

**Example:**
- V1: ORD-001 → ORD-002 → ORD-003 → ORD-004 (oldest to newest)
- V2: ORD-004 → ORD-003 → ORD-002 → ORD-001 (newest to oldest)

**User Impact:** Unexpected display order, requires scrolling for recent orders

---

### 6️⃣ Mobile Checkout Validation Incomplete (MEDIUM) 🟡

**Problem:** Only validates email on mobile; skips all other fields

**Code Issue:**
```javascript
if (isMobile) {
  if (!formData.email.trim()) newErrors.email = 'Email is required'
  return Object.keys(newErrors).length === 0  // Early return!
}
// Never reaches name, phone, card, address validation on mobile
```

**Example:**
- Desktop: All 13 fields validated ✓
- Mobile: Only email validated, name/phone/card/address skipped ✗

**Security Impact:** Orders accepted without required customer information

---

### 7️⃣ Missing clearCart() After Order (LOW) 🟡

**Problem:** V2 doesn't call clearCart() after successful order

**Code Issue:**
```javascript
// V1: clearCart() is called
setTimeout(() => {
  clearCart()  // ← Present in v1
  alert('Order placed successfully!')
  navigate('/orders')
}, 2000)

// V2: clearCart() is NOT called
setTimeout(() => {
  alert('Order placed successfully!')
  setTimeout(() => navigate('/orders'), 500)  // ← Missing clearCart()
}, 1000)
```

**Example:**
- V1: After order → Cart is empty ✓
- V2: After order → Cart items remain ✗

**User Impact:** Cart persists after checkout, causing confusion

---

## Testing Environment

### Versions Tested
- **v1:** localhost:3001
- **v2:** localhost:3003

### Dependencies (Identical)
- React 18.2.0
- React Router DOM 6.20.0
- Vite 5.0.8
- Recharts 2.10.3
- Axios 1.6.2

### Test Coverage
✅ Dashboard  
✅ Products (search, filters)  
✅ Cart (add, remove, update quantity)  
✅ Checkout (validation, submission)  
✅ Orders (listing, filtering)  
✅ Navigation (cart badge)  

---

## Recommendations

### 🛑 **CRITICAL - Do Not Release**
V2 has **7 significant regressions** affecting core shopping functionality:
- **Pricing bugs** → Financial impact
- **Search broken** → Usability impact  
- **Remove button broken** → UX impact
- **Validation bypassed on mobile** → Security/data quality impact

### ✅ **Required Fixes Before Release**
1. Fix bulk discount logic (apply to total, not per-item)
2. Remove or rewrite numeric search filter
3. Restore original removeFromCart function
4. Fix cart badge calculation
5. Verify checkout validation on all device sizes
6. Restore clearCart() call after order
7. Decide on order display order (document decision)

### 🧪 **Testing Before Re-Release**
- Unit tests for cart calculations with various quantities
- Integration tests for search with mixed alphanumeric input
- Mobile device testing (actual phones/tablets)
- Full purchase flow testing on multiple viewports
- Performance benchmarking

---

## Full Documentation

📄 **See:** `REGRESSION_TEST_GUIDE.md` for detailed analysis including:
- Step-by-step reproduction steps for each issue
- Code-level observations with before/after
- Impact analysis for each regression
- Data tables with test examples
- Complete testing checklist

