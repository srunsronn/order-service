# Integration Testing Guide

## Overview
This guide helps you test the Order Service integration with the production Inventory Service.

**Inventory Service (Production):** https://inventory-service-production-fff7.up.railway.app

---

## Prerequisites

1. **Start Order Service Locally**
   ```bash
   npm run start:dev
   ```
   Service will run on: `http://localhost:3000`

2. **Ensure Database is Running**
   ```bash
   docker-compose up postgres
   ```

3. **Update Environment Variables**
   Create `.env` file:
   ```bash
   cp .env.example .env
   ```

   Your `.env` should have:
   ```env
   INVENTORY_SERVICE_URL=https://inventory-service-production-fff7.up.railway.app
   ```

---

## Quick Test Script

Run the automated integration test:
```bash
chmod +x test-integration.sh
./test-integration.sh
```

---

## Manual Testing Steps

### Step 1: Check Inventory Service Health

```bash
curl https://inventory-service-production-fff7.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T..."
}
```

---

### Step 2: Get Available Products

```bash
curl https://inventory-service-production-fff7.up.railway.app/products-with-stock
```

**Expected Response:**
```json
[
  {
    "product_id": "LAPTOP001",
    "name": "Gaming Laptop",
    "price": 1299.99,
    "quantity": 50
  },
  ...
]
```

**Note:** Pick a `product_id` from this list for testing (e.g., `LAPTOP001`)

---

### Step 3: Check Stock Availability

Replace `LAPTOP001` with your chosen product ID:

```bash
curl https://inventory-service-production-fff7.up.railway.app/inventory/LAPTOP001/check/5
```

**Expected Response:**
```json
{
  "product_id": "LAPTOP001",
  "requested_quantity": 5,
  "available_quantity": 50,
  "is_available": true,
  "message": "Stock available"
}
```

---

### Step 4: Test Order Service Health

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-25T...",
  "service": "order-service"
}
```

---

### Step 5: Create an Order

**Important:** Use a valid `productId` from Step 2!

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "LAPTOP001",
        "quantity": 2,
        "price": 1299.99
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "status": "PENDING",
  "total": 2599.98,
  "createdAt": "2025-12-25T...",
  "items": [
    {
      "id": "...",
      "productId": "LAPTOP001",
      "quantity": 2,
      "price": 1299.99,
      "orderId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

**Save the `id` for next steps!**

---

### Step 6: Get Order Details

Replace `{ORDER_ID}` with the ID from Step 5:

```bash
curl http://localhost:3000/api/orders/{ORDER_ID}
```

---

### Step 7: Confirm Order (This Deducts Stock!)

⚠️ **Warning:** This will deduct stock from the inventory service!

```bash
curl -X PATCH http://localhost:3000/api/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "status": "CONFIRMED",
  "total": 2599.98,
  ...
}
```

**What happens:**
- Order Service checks inventory availability
- If available, updates order status to CONFIRMED
- **Deducts stock from Inventory Service** (PUT /inventory/{productId}/deduct)

---

### Step 8: Verify Stock Deduction

Check if stock was actually deducted:

```bash
curl https://inventory-service-production-fff7.up.railway.app/inventory/LAPTOP001
```

**Expected:** Quantity should be reduced by the amount ordered.

---

### Step 9: Complete Order

```bash
curl -X PATCH http://localhost:3000/api/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

---

## Test Scenarios

### ✅ Scenario 1: Successful Order Flow

1. Create order with valid product IDs → **201 Created**
2. Confirm order → **200 OK** (stock deducted)
3. Complete order → **200 OK**

---

### ❌ Scenario 2: Out of Stock

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "LAPTOP001",
        "quantity": 99999,
        "price": 1299.99
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Insufficient stock for products: LAPTOP001",
  "error": "Bad Request"
}
```

---

### ❌ Scenario 3: Invalid Product ID

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "INVALID999",
        "quantity": 1,
        "price": 99.99
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Insufficient stock for products: INVALID999",
  "error": "Bad Request"
}
```

---

### ❌ Scenario 4: Invalid Status Transition

Try to go from PENDING directly to COMPLETED:

```bash
curl -X PATCH http://localhost:3000/api/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Invalid status transition from PENDING to COMPLETED",
  "error": "Bad Request"
}
```

---

## Validation Checklist

Before production deployment, verify:

- [ ] Order Service can reach Inventory Service
- [ ] Stock availability is checked before order creation
- [ ] Orders are created successfully with valid products
- [ ] Orders fail gracefully with invalid products
- [ ] Stock is deducted when order is CONFIRMED
- [ ] Status transitions follow the correct flow
- [ ] Error messages are clear and helpful
- [ ] All database operations work correctly

---

## Common Issues

### Issue 1: "Failed to verify inventory availability"

**Cause:** Cannot reach Inventory Service

**Solution:**
- Check internet connection
- Verify URL: `https://inventory-service-production-fff7.up.railway.app`
- Test inventory service directly: `curl {URL}/health`

---

### Issue 2: "Insufficient stock for products"

**Cause:** 
- Product doesn't exist
- Not enough stock available

**Solution:**
- Get valid product IDs: `curl {URL}/products-with-stock`
- Check current stock: `curl {URL}/inventory/{productId}`

---

### Issue 3: Database connection error

**Cause:** PostgreSQL not running

**Solution:**
```bash
docker-compose up postgres
```

---

## Production Deployment Notes

When deploying to production:

1. **Update Environment Variables:**
   ```env
   NODE_ENV=production
   DATABASE_HOST=<production-db-host>
   INVENTORY_SERVICE_URL=https://inventory-service-production-fff7.up.railway.app
   ```

2. **Use Migrations Instead of Sync:**
   - Disable `synchronize: true` in TypeORM config
   - Generate and run migrations

3. **Add Retries for Inventory Service:**
   - Consider adding retry logic for HTTP requests
   - Implement circuit breaker pattern

4. **Monitor Stock Deductions:**
   - Log all stock deduction operations
   - Implement rollback mechanism if needed

---

## API Endpoints Summary

### Order Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/orders | Create order |
| GET | /api/orders/:id | Get order |
| PATCH | /api/orders/:id/status | Update status |

### Inventory Service (Production)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /products-with-stock | Get all products |
| GET | /inventory/:id/check/:qty | Check stock |
| PUT | /inventory/:id/deduct | Deduct stock |

---

## Need Help?

If you encounter issues during testing:

1. Check logs: Order Service outputs detailed logs
2. Verify all products exist in Inventory Service
3. Ensure database is properly initialized
4. Test Inventory Service endpoints directly first

Happy testing! 🚀
