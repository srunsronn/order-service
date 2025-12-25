# Order Service API Testing

## Base URL
```
http://localhost:3000
```

## 1. Health Check
```bash
curl http://localhost:3000/health
```

## 2. Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "p1",
        "quantity": 2,
        "price": 29.99
      },
      {
        "productId": "p2",
        "quantity": 1,
        "price": 49.99
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "userId": "user123",
  "status": "PENDING",
  "total": 109.97,
  "createdAt": "2025-12-25T...",
  "items": [
    {
      "id": "uuid-here",
      "productId": "p1",
      "quantity": 2,
      "price": 29.99,
      "orderId": "uuid-here"
    },
    {
      "id": "uuid-here",
      "productId": "p2",
      "quantity": 1,
      "price": 49.99,
      "orderId": "uuid-here"
    }
  ]
}
```

## 3. Get Order by ID
```bash
curl http://localhost:3000/api/orders/{order-id}
```

## 4. Update Order Status to CONFIRMED
```bash
curl -X PATCH http://localhost:3000/api/orders/{order-id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'
```

## 5. Update Order Status to COMPLETED
```bash
curl -X PATCH http://localhost:3000/api/orders/{order-id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

## Error Cases

### Invalid Status Transition
```bash
# Trying to go from PENDING to COMPLETED (invalid)
curl -X PATCH http://localhost:3000/api/orders/{order-id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```
Response: `400 Bad Request - Invalid status transition`

### Invalid UUID
```bash
curl http://localhost:3000/api/orders/invalid-id
```
Response: `400 Bad Request - Validation failed (uuid is expected)`

### Order Not Found
```bash
curl http://localhost:3000/api/orders/00000000-0000-0000-0000-000000000000
```
Response: `404 Not Found - Order with ID ... not found`

### Inventory Service Unavailable
If Inventory Service is down during order creation:
Response: `503 Service Unavailable - Failed to verify inventory availability`

## Status Lifecycle

Valid transitions:
- ✅ PENDING → CONFIRMED
- ✅ CONFIRMED → COMPLETED
- ❌ PENDING → COMPLETED (invalid)
- ❌ CONFIRMED → PENDING (invalid)
- ❌ COMPLETED → * (invalid)
