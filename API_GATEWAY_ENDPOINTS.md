# API Gateway Endpoints - Manual Verification Guide

## 🔗 Base URL
```
https://devops-api-gateway-production.up.railway.app/api
```

---

## 📋 Required Endpoints for Order Service

### 1. ✅ Check Stock Availability (Bulk)
**Used by**: Order creation process to verify all items are in stock

**Endpoint**: `POST /stock/check-availability/bulk`

**Request Body**:
```json
{
  "items": [
    {
      "product_id": "10",
      "required_quantity": 5
    },
    {
      "product_id": "9",
      "required_quantity": 10
    }
  ]
}
```

**Expected Response**:
```json
{
  "all_available": true,
  "items": [
    {
      "product_id": "10",
      "available": true,
      "current_quantity": 30,
      "required_quantity": 5
    },
    {
      "product_id": "9",
      "available": true,
      "current_quantity": 45,
      "required_quantity": 10
    }
  ]
}
```

**cURL Command**:
```bash
curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/check-availability/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "10",
        "required_quantity": 5
      },
      {
        "product_id": "9",
        "required_quantity": 10
      }
    ]
  }'
```

**Test Cases**:
- ✅ All items available
- ✅ Some items unavailable (should return `all_available: false`)
- ✅ Invalid product IDs

---

### 2. ✅ Remove Stock (Deduct Inventory)
**Used by**: Order confirmation to deduct stock from inventory

**Endpoint**: `POST /stock/{productId}/remove`

**Request Body**:
```json
{
  "quantity": 5,
  "reason": "Order placement - deducted 5 units"
}
```

**Expected Response**:
```json
{
  "product_id": "10",
  "new_quantity": 25,
  "message": "Stock removed successfully"
}
```

**cURL Command**:
```bash
curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/10/remove \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "reason": "Sold to customer"
  }'
```

**Test Cases**:
- ✅ Valid product with sufficient stock
- ✅ Insufficient stock (should fail)
- ✅ Invalid product ID (should fail)

---

### 3. 📋 List All Inventory (Optional - for admin/debugging)
**Used by**: Admin panel or debugging purposes

**Endpoint**: `GET /inventory?page=1&per_page=20`

**Expected Response**:
```json
{
  "current_page": 1,
  "per_page": 20,
  "total": 9,
  "last_page": 1,
  "data": [
    {
      "product_id": "9",
      "quantity": 45,
      "warehouse_location": "WH-A1",
      "created_at": "2025-12-26T02:03:50.538000",
      "updated_at": "2025-12-26T03:04:11.209000"
    },
    {
      "product_id": "10",
      "quantity": 30,
      "warehouse_location": "WH-A1",
      "created_at": "2025-12-26T02:31:23.406000",
      "updated_at": "2025-12-26T02:31:23.406000"
    }
  ]
}
```

**cURL Command**:
```bash
curl https://devops-api-gateway-production.up.railway.app/api/inventory
```

---

## 🧪 Manual Testing Checklist

### Before Order Creation
- [ ] **Test 1**: Check availability for products that exist
  ```bash
  curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/check-availability/bulk \
    -H "Content-Type: application/json" \
    -d '{"items":[{"product_id":"10","required_quantity":2}]}'
  ```
  **Expected**: `all_available: true`

- [ ] **Test 2**: Check availability for products with insufficient stock
  ```bash
  curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/check-availability/bulk \
    -H "Content-Type: application/json" \
    -d '{"items":[{"product_id":"10","required_quantity":1000}]}'
  ```
  **Expected**: `all_available: false`

- [ ] **Test 3**: Check availability for non-existent product
  ```bash
  curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/check-availability/bulk \
    -H "Content-Type: application/json" \
    -d '{"items":[{"product_id":"INVALID-001","required_quantity":1}]}'
  ```
  **Expected**: Error or `available: false`

### During Order Confirmation
- [ ] **Test 4**: Deduct stock for valid product
  ```bash
  # First check current quantity
  curl https://devops-api-gateway-production.up.railway.app/api/inventory | jq '.data[] | select(.product_id=="10")'
  
  # Then deduct
  curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/10/remove \
    -H "Content-Type: application/json" \
    -d '{"quantity":2,"reason":"Test order"}'
  
  # Verify quantity decreased
  curl https://devops-api-gateway-production.up.railway.app/api/inventory | jq '.data[] | select(.product_id=="10")'
  ```
  **Expected**: Quantity should decrease by 2

- [ ] **Test 5**: Try to deduct more than available
  ```bash
  curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/10/remove \
    -H "Content-Type: application/json" \
    -d '{"quantity":10000,"reason":"Test order"}'
  ```
  **Expected**: Error response (insufficient stock)

---

## 🔄 Complete Order Flow Test

### Step-by-Step Manual Test

**Step 1**: Check current inventory
```bash
curl https://devops-api-gateway-production.up.railway.app/api/inventory | jq '.data[] | select(.product_id=="10" or .product_id=="9")'
```

**Step 2**: Create order (this will check availability)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "Springfield",
    "zipCode": "12345",
    "items": [
      {
        "productId": "10",
        "quantity": 2,
        "price": 50.00
      },
      {
        "productId": "9",
        "quantity": 1,
        "price": 75.00
      }
    ]
  }'
```

**Step 3**: Verify inventory was deducted
```bash
curl https://devops-api-gateway-production.up.railway.app/api/inventory | jq '.data[] | select(.product_id=="10" or .product_id=="9")'
```
- Product "10" quantity should decrease by 2
- Product "9" quantity should decrease by 1

---

## 📊 API Gateway Integration Summary

### Endpoints Used by Order Service

| Purpose | Method | Endpoint | When Called |
|---------|--------|----------|-------------|
| Check Stock | POST | `/stock/check-availability/bulk` | Before creating order |
| Deduct Stock | POST | `/stock/{productId}/remove` | After order confirmation |
| List Inventory | GET | `/inventory` | Optional (debugging) |

### Request/Response Flow

```
Order Creation Request
  ↓
Check Stock Availability (API Gateway)
  ↓ (if available)
Create Order in Database
  ↓
Confirm Order (update status)
  ↓
Deduct Stock (API Gateway)
  ↓
Order Complete
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue 1**: "Service Unavailable" error
- **Cause**: API Gateway is down or unreachable
- **Solution**: Check API Gateway health endpoint
  ```bash
  curl https://devops-api-gateway-production.up.railway.app/health
  ```

**Issue 2**: "Insufficient stock" during order creation
- **Cause**: Not enough inventory
- **Solution**: Check current inventory levels
  ```bash
  curl https://devops-api-gateway-production.up.railway.app/api/inventory
  ```

**Issue 3**: Stock not deducted after order
- **Cause**: Order status not updated to CONFIRMED
- **Solution**: Check order status and logs
  ```bash
  curl http://localhost:3000/api/orders/{orderId}
  ```

---

## ✅ Production Deployment Checklist

Before deploying to production:

- [ ] All local Jest tests pass (`npm test`)
- [ ] Manual API Gateway tests pass (see checklist above)
- [ ] Order creation with stock check works
- [ ] Stock deduction after order confirmation works
- [ ] Error handling for unavailable items works
- [ ] Environment variables updated in Render:
  - `INVENTORY_SERVICE_URL=https://devops-api-gateway-production.up.railway.app/api`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] Integration test passes: `./test-integration.sh`

---

## 🔍 Quick Verification Commands

**1. Check API Gateway is working:**
```bash
curl https://devops-api-gateway-production.up.railway.app/api/inventory
```

**2. Test stock availability check:**
```bash
curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/check-availability/bulk \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":"10","required_quantity":1}]}' | jq
```

**3. Test stock removal:**
```bash
curl -X POST https://devops-api-gateway-production.up.railway.app/api/stock/10/remove \
  -H "Content-Type: application/json" \
  -d '{"quantity":1,"reason":"Test"}' | jq
```

**4. Test order creation (local):**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@test.com","address":"Test","city":"Test","zipCode":"12345","items":[{"productId":"10","quantity":1,"price":50}]}' | jq
```

---

## 📝 Notes

- All API Gateway endpoints use **positive quantities** for removal (not negative)
- The `check-availability/bulk` endpoint can check multiple items in one call
- Product IDs in the inventory are strings (e.g., "10", "9", "FUR-001")
- Stock deduction happens only when order status is updated to "CONFIRMED"

---

**Last Updated**: December 26, 2025
**API Gateway URL**: https://devops-api-gateway-production.up.railway.app/api
