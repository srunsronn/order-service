# API Gateway Migration - Summary

## ✅ Changes Completed

### 1. **Updated Inventory Service** (`src/inventory/inventory.service.ts`)
- Changed from direct inventory API to API Gateway
- **Old**: `POST /inventory/check-availability/bulk`
- **New**: `POST /stock/check-availability/bulk`
- **Old**: `POST /inventory/items/{productId}/adjust` (with negative quantity)
- **New**: `POST /stock/{productId}/remove` (with positive quantity)

### 2. **Updated Configuration** 
- Base URL: `https://devops-api-gateway-production.up.railway.app/api`
- Environment variable: `INVENTORY_SERVICE_URL`

### 3. **Updated Jest Tests**
- All 26 tests passing ✅
- Updated mock endpoints to match API Gateway paths
- Changed quantity handling (positive instead of negative)

---

## 📋 API Gateway Endpoints Used by Order Service

### **1. Check Stock Availability (Bulk)**
```bash
POST https://devops-api-gateway-production.up.railway.app/api/stock/check-availability/bulk
```
**Request**:
```json
{
  "items": [
    {"product_id": "10", "required_quantity": 5},
    {"product_id": "9", "required_quantity": 10}
  ]
}
```
**Response**:
```json
{
  "all_available": true,
  "items": [
    {
      "product_id": "10",
      "available": true,
      "current_quantity": 30,
      "required_quantity": 5
    }
  ]
}
```

### **2. Remove Stock (Deduct)**
```bash
POST https://devops-api-gateway-production.up.railway.app/api/stock/{productId}/remove
```
**Request**:
```json
{
  "quantity": 5,
  "reason": "Order placement - deducted 5 units"
}
```
**Response**:
```json
{
  "product_id": "10",
  "new_quantity": 25,
  "message": "Stock removed successfully"
}
```

### **3. List All Inventory (Optional)**
```bash
GET https://devops-api-gateway-production.up.railway.app/api/inventory
```
**Response**:
```json
{
  "current_page": 1,
  "per_page": 20,
  "total": 9,
  "data": [...]
}
```

---

## 🧪 Manual Testing Commands

### Test 1: Check Stock Availability
```bash
curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/check-availability/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": "10", "required_quantity": 2},
      {"product_id": "9", "required_quantity": 1}
    ]
  }' | jq
```

### Test 2: View Current Inventory
```bash
curl https://devops-api-gateway-production.up.railway.app/api/inventory | jq '.data[] | select(.product_id=="10" or .product_id=="9")'
```

### Test 3: Create Order (Local)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "address": "123 Test St",
    "city": "Test City",
    "zipCode": "12345",
    "items": [
      {"productId": "10", "quantity": 2, "price": 50.00},
      {"productId": "9", "quantity": 1, "price": 75.00}
    ]
  }' | jq
```

### Test 4: Verify Stock Was Deducted
```bash
curl https://devops-api-gateway-production.up.railway.app/api/inventory | jq '.data[] | select(.product_id=="10" or .product_id=="9")'
```
Expected: Quantities should be reduced

### Test 5: Remove Stock Directly
```bash
curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/10/remove \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 1,
    "reason": "Manual test"
  }' | jq
```

---

## ✅ Test Results

### Jest Tests: **ALL PASSING** ✅
```
Test Suites: 4 passed, 4 total
Tests:       26 passed, 26 total
Time:        2.104 s
```

### Test Coverage:
- ✅ Orders Controller: 100%
- ✅ Orders Service: 96.66%
- ✅ Inventory Service: 100%
- ✅ Overall: 76.38%

---

## 🚀 Ready for Production

### Checklist:
- ✅ All Jest tests passing (26/26)
- ✅ API Gateway endpoints updated
- ✅ Configuration updated
- ✅ .env file configured
- ✅ Documentation created (API_GATEWAY_ENDPOINTS.md)
- ⚠️ **Need to verify**: Manual API Gateway endpoint testing
- ⚠️ **Need to update**: Render environment variables

### Before Pushing to Production:

1. **Test API Gateway endpoints manually** (see commands above)
2. **Update Render environment variable**:
   - `INVENTORY_SERVICE_URL=https://devops-api-gateway-production.up.railway.app/api`
3. **Deploy to production**
4. **Verify health check**: `https://your-app.onrender.com/health`
5. **Test order creation on production**

---

## 📊 Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Base URL** | `https://api.soksothy.me/api/v1` | `https://devops-api-gateway-production.up.railway.app/api` |
| **Check Stock** | `/inventory/check-availability/bulk` | `/stock/check-availability/bulk` |
| **Deduct Stock** | `/inventory/items/{id}/adjust` | `/stock/{id}/remove` |
| **Quantity Format** | Negative for deduction (-5) | Positive for removal (5) |
| **Tests Passing** | ✅ 26/26 | ✅ 26/26 |

---

## 📝 Available Products in Inventory

From API Gateway response:
- **Product "9"**: 45 units available
- **Product "10"**: 30 units available
- **Product "FUR-001"**: 50 units available
- **Product "FUR-002"**: 20 units available

Use these product IDs for testing!

---

**Date**: December 26, 2025  
**Status**: ✅ Ready for Manual Testing → Production Deployment  
**Next Step**: Run manual API Gateway tests using the commands above
