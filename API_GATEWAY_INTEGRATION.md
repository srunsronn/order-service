# Order Service API - API Gateway Integration Guide

## 📋 Overview
This document provides the essential API endpoints for API Gateway integration with the Order Service. Focus on three key operations: **Create Order**, **Update Order Status**, and **Get Orders**.

**Base URL**: `https://order-service-dm41.onrender.com/api/`

---

## 1. 📝 Create Order

### **Endpoint**
```
POST orders
```

### **Purpose**
Creates a new order with inventory validation. The order service will:
1. Check stock availability via API Gateway
2. Create order record if stock is available
3. Set initial status to `PENDING`

### **Request Headers**
```json
{
  "Content-Type": "application/json"
}
```

### **Request Body**
```json
{
  "userId": "user123",           // Optional for guest checkout
  "fullName": "John Doe",        // Required
  "email": "john@example.com",   // Required, valid email
  "address": "123 Main St",      // Required
  "city": "Springfield",         // Required
  "zipCode": "12345",            // Required
  "items": [
    {
      "productId": "10",         // Required, string
      "quantity": 2,             // Required, minimum 1
      "price": 50.00             // Required, minimum 0
    }
  ]
}
```

### **Success Response (201 Created)**
```json
{
  "id": "uuid-generated-id",
  "userId": "user123",
  "fullName": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St",
  "city": "Springfield",
  "zipCode": "12345",
  "status": "PENDING",
  "total": 100.00,
  "createdAt": "2025-12-26T10:00:00.000Z",
  "items": [
    {
      "id": "uuid-item-id",
      "productId": "10",
      "quantity": 2,
      "price": 50.00,
      "subtotal": 100.00
    }
  ]
}
```

### **Error Responses**

#### **400 Bad Request** - Insufficient Stock
```json
{
  "statusCode": 400,
  "message": "Insufficient stock for products: 10",
  "error": "Bad Request"
}
```

#### **400 Bad Request** - Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "fullName should not be empty",
    "email must be a valid email"
  ],
  "error": "Bad Request"
}
```

#### **503 Service Unavailable** - API Gateway Error
```json
{
  "statusCode": 503,
  "message": "Failed to verify inventory availability",
  "error": "Service Unavailable"
}
```

### **Integration Notes**
- **Inventory Check**: Automatically calls API Gateway `/stock/check-availability/bulk`
- **Guest Checkout**: `userId` is optional, system generates guest ID if not provided
- **Stock Validation**: Order creation fails if any item is out of stock
- **Transaction**: Order is not created if inventory check fails

---

## 2. 🔄 Update Order Status

### **Endpoint**
```
PATCH orders/{orderId}/status
```

### **Purpose**
Updates the status of an existing order. Key statuses:
- `PENDING` → `CONFIRMED` (deducts stock)
- `CONFIRMED` → `COMPLETED` (final status)

### **Request Headers**
```json
{
  "Content-Type": "application/json"
}
```

### **Request Body**
```json
{
  "status": "CONFIRMED"
}
```

**Allowed Status Values:**
- `"PENDING"` - Initial status
- `"CONFIRMED"` - Stock deducted, order confirmed
- `"COMPLETED"` - Order fulfilled

### **Success Response (200 OK)**
```json
{
  "id": "uuid-order-id",
  "userId": "user123",
  "status": "CONFIRMED",
  "total": 100.00,
  "createdAt": "2025-12-26T10:00:00.000Z",
  "items": [
    {
      "id": "uuid-item-id",
      "productId": "10",
      "quantity": 2,
      "price": 50.00,
      "subtotal": 100.00
    }
  ]
}
```

### **Error Responses**

#### **400 Bad Request** - Invalid Status
```json
{
  "statusCode": 400,
  "message": [
    "status must be one of the following values: PENDING, CONFIRMED, COMPLETED"
  ],
  "error": "Bad Request"
}
```

#### **404 Not Found** - Order Not Found
```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

#### **503 Service Unavailable** - Stock Deduction Failed
```json
{
  "statusCode": 503,
  "message": "Failed to deduct stock for product 10",
  "error": "Service Unavailable"
}
```

### **Integration Notes**
- **Stock Deduction**: When status changes to `CONFIRMED`, calls API Gateway `/stock/{productId}/remove`
- **Irreversible**: Once `CONFIRMED`, stock is deducted and cannot be restored
- **Validation**: Status transitions must follow: PENDING → CONFIRMED → COMPLETED

---

## 3. 📋 Get Orders

### **Endpoint**
```
GET orders?page=1&limit=10
```

### **Purpose**
Retrieves a paginated list of all orders (admin endpoint).

### **Query Parameters**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, max 100

### **Success Response (200 OK)**
```json
{
  "orders": [
    {
      "id": "uuid-order-1",
      "userId": "user123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "address": "123 Main St",
      "city": "Springfield",
      "zipCode": "12345",
      "status": "PENDING",
      "total": 100.00,
      "createdAt": "2025-12-26T10:00:00.000Z",
      "items": [
        {
          "id": "uuid-item-1",
          "productId": "10",
          "quantity": 2,
          "price": 50.00,
          "subtotal": 100.00
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### **Error Responses**

#### **400 Bad Request** - Invalid Parameters
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## 🔗 API Gateway Integration Points

### **Endpoints Called by Order Service**

| Operation | API Gateway Endpoint | When Called |
|-----------|---------------------|-------------|
| Check Stock | `POST /stock/check-availability/bulk` | Order creation |
| Deduct Stock | `POST /stock/{productId}/remove` | Order confirmation |

### **Request Flow**
```
Client Request → API Gateway → Order Service
                              ↓
                       Stock Check/Removal
                              ↓
                    API Gateway Response
                              ↓
                 Order Service Response
```

---

## 🧪 Testing Commands

### **Create Order**
```bash
curl -X POST https://order-service-dm41.onrender.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "fullName": "Test User",
    "email": "test@example.com",
    "address": "123 Test St",
    "city": "Test City",
    "zipCode": "12345",
    "items": [
      {"productId": "10", "quantity": 1, "price": 50.00}
    ]
  }'
```

### **Update Order Status**
```bash
curl -X PATCH https://order-service-dm41.onrender.com/api/orders/{order-id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

### **Get Orders**
```bash
curl https://order-service-dm41.onrender.com/api/orders?page=1&limit=10
```

---

## 📊 Data Types & Validation

### **Order Item Structure**
```typescript
{
  productId: string;    // Required, non-empty
  quantity: number;     // Required, minimum 1
  price: number;        // Required, minimum 0
}
```

### **Order Status Enum**
```typescript
enum OrderStatus {
  PENDING = 'PENDING',    // Initial state
  CONFIRMED = 'CONFIRMED', // Stock deducted
  COMPLETED = 'COMPLETED'  // Final state
}
```

### **Validation Rules**
- Email must be valid format
- All string fields are trimmed
- Quantities must be positive integers
- Prices must be non-negative numbers

---

## ⚠️ Important Notes

1. **Stock Management**: Stock is only deducted when order status becomes `CONFIRMED`
2. **Error Handling**: All API Gateway failures result in 503 Service Unavailable
3. **Guest Checkout**: `userId` is optional, system generates guest IDs
4. **Pagination**: Get Orders supports pagination with `page` and `limit` parameters
5. **Transaction Safety**: If stock check fails, order is not created
6. **Status Transitions**: Only valid transitions are allowed (PENDING → CONFIRMED → COMPLETED)

---

## 📞 Support

For API Gateway integration questions:
- **Base URL**: `https://order-service-dm41.onrender.com/api`
- **Health Check**: `GET /health`
- **Documentation**: See full API docs in project repository

**Last Updated**: December 26, 2025
**API Version**: v1.0</content>
<parameter name="filePath">/home/srunsrorn/Documents/Y4T1/DevOps/final project/order-service/API_GATEWAY_INTEGRATION.md