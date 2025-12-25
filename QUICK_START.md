# 🚀 Quick Start - Testing Order Service with Production Inventory

## What's Ready?

✅ Order Service is configured to use **production Inventory Service**  
✅ Integration test script is ready  
✅ All code is updated to work with real API  

**Production Inventory Service:**  
`https://inventory-service-production-fff7.up.railway.app`

---

## Step 1: Start Your Database

```bash
docker-compose up postgres -d
```

Wait a few seconds for PostgreSQL to start.

---

## Step 2: Start Order Service

```bash
npm run start:dev
```

You should see:
```
Order Service is running on port 3000
```

---

## Step 3: Run the Automated Test

In a **new terminal**:

```bash
./test-integration.sh
```

The script will:
1. ✅ Test connectivity to production Inventory Service
2. ✅ Show available products
3. ✅ Create a test order
4. ✅ Confirm the order (deducts stock!)
5. ✅ Complete the order
6. ✅ Verify everything works end-to-end

---

## Step 4: Manual Testing (Optional)

### Test 1: Check available products in inventory

```bash
curl https://inventory-service-production-fff7.up.railway.app/products-with-stock
```

### Test 2: Create an order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "LAPTOP001",
        "quantity": 1,
        "price": 2499.99
      }
    ]
  }'
```

Save the `id` from the response!

### Test 3: Confirm order (this deducts stock)

Replace `{ORDER_ID}` with your order ID:

```bash
curl -X PATCH http://localhost:3000/api/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

### Test 4: Verify stock was deducted

```bash
curl https://inventory-service-production-fff7.up.railway.app/inventory/LAPTOP001
```

The quantity should be reduced!

---

## What Happens Behind the Scenes?

### When Creating an Order:

1. **Client** → Order Service: `POST /api/orders`
2. **Order Service** → Inventory Service: `GET /inventory/{productId}/check/{quantity}` (for each item)
3. If stock available → Order created with status `PENDING`
4. If stock unavailable → `400 Bad Request` error

### When Confirming an Order:

1. **Client** → Order Service: `PATCH /api/orders/{id}/status` with `status: "CONFIRMED"`
2. **Order Service** → Inventory Service: `PUT /inventory/{productId}/deduct` (for each item)
3. Stock is deducted from inventory
4. Order status updated to `CONFIRMED`

---

## Available Products

Currently in production inventory:

| Product ID | Name | Price | Stock |
|------------|------|-------|-------|
| LAPTOP001 | MacBook Pro 16" | $2499.99 | 45 units |

Use `LAPTOP001` for testing!

---

## Common Issues

### ❌ "Cannot reach Inventory Service"
- Check internet connection
- Inventory service might be down

### ❌ "Insufficient stock for products"
- Product ID doesn't exist
- Not enough stock available
- Try `LAPTOP001` which has 45 units

### ❌ "Database connection error"
- Run: `docker-compose up postgres -d`
- Wait 10 seconds and try again

---

## Production Deployment Checklist

Before deploying Order Service to production:

- [ ] Update DATABASE_HOST to production database
- [ ] Set NODE_ENV=production
- [ ] Verify INVENTORY_SERVICE_URL is correct
- [ ] Test all endpoints with real data
- [ ] Enable database migrations (disable synchronize)
- [ ] Set up monitoring and logging
- [ ] Configure CORS for your frontend domain
- [ ] Add rate limiting
- [ ] Set up health checks

---

## File Structure

```
order-service/
├── test-integration.sh          ← Run this to test everything
├── INTEGRATION_TESTING.md       ← Detailed testing guide
├── QUICK_START.md              ← This file
├── .env                         ← Already configured!
├── src/
│   ├── inventory/
│   │   └── inventory.service.ts ← Talks to production API
│   └── orders/
│       └── orders.service.ts    ← Creates & manages orders
└── docker-compose.yml
```

---

## Next Steps

1. ✅ Test with automated script: `./test-integration.sh`
2. ✅ Verify stock deduction works
3. ✅ Test error scenarios (invalid products, insufficient stock)
4. 🚀 Deploy to production when ready!

---

## Need Help?

See [INTEGRATION_TESTING.md](INTEGRATION_TESTING.md) for:
- Detailed testing scenarios
- Error case handling
- Troubleshooting guide
- Production deployment notes

Happy testing! 🎉
