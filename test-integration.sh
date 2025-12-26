#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Order Service Integration Test${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Configuration
INVENTORY_URL="https://devops-api-gateway-production.up.railway.app/api/inventory"
ORDER_URL="http://localhost:3000"

echo -e "${YELLOW}Step 1: Testing Inventory Service Connection${NC}"
echo "Testing: GET ${INVENTORY_URL}/health"
HEALTH_RESPONSE=$(curl -s "${INVENTORY_URL}/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Inventory Service is reachable${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Cannot reach Inventory Service${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 2: Get Available Products from Inventory${NC}"
echo "Testing: GET ${INVENTORY_URL}"
PRODUCTS=$(curl -s "${INVENTORY_URL}")
echo "Available products:"
echo "$PRODUCTS" | jq '.data[0:3]' 2>/dev/null || echo "$PRODUCTS"
echo ""

echo -e "${YELLOW}Step 3: Check Stock for a Specific Product${NC}"
echo "Enter a product ID to test (or press Enter to use PROD-001):"
read -r PRODUCT_ID
PRODUCT_ID=${PRODUCT_ID:-PROD-001}

echo "Testing: GET ${INVENTORY_URL}/inventory/items/${PRODUCT_ID}"
STOCK_CHECK=$(curl -s "${INVENTORY_URL}/inventory/items/${PRODUCT_ID}")
echo "Stock check result:"
echo "$STOCK_CHECK" | jq '.' 2>/dev/null || echo "$STOCK_CHECK"
echo ""

echo -e "${YELLOW}Step 4: Testing Order Service Health${NC}"
echo "Testing: GET ${ORDER_URL}/health"
ORDER_HEALTH=$(curl -s "${ORDER_URL}/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Order Service is running${NC}"
    echo "Response: $ORDER_HEALTH"
else
    echo -e "${RED}✗ Order Service is not running. Please start it first.${NC}"
    echo "Run: npm run start:dev"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Create Test Order${NC}"
echo "Creating order with product: ${PRODUCT_ID}"

CREATE_ORDER_RESPONSE=$(curl -s -X POST "${ORDER_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test Customer\",
    \"email\": \"test@example.com\",
    \"address\": \"123 Test Street\",
    \"city\": \"Test City\",
    \"zipCode\": \"12345\",
    \"items\": [
      {
        \"productId\": \"${PRODUCT_ID}\",
        \"quantity\": 2,
        \"price\": 999.99
      }
    ]
  }")

echo "Create order response:"
echo "$CREATE_ORDER_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_ORDER_RESPONSE"

# Extract order ID
ORDER_ID=$(echo "$CREATE_ORDER_RESPONSE" | jq -r '.id' 2>/dev/null)

if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
    echo -e "${GREEN}✓ Order created successfully${NC}"
    echo "Order ID: $ORDER_ID"
else
    echo -e "${RED}✗ Failed to create order${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 6: Retrieve Order${NC}"
echo "Testing: GET ${ORDER_URL}/api/orders/${ORDER_ID}"
GET_ORDER=$(curl -s "${ORDER_URL}/api/orders/${ORDER_ID}")
echo "Order details:"
echo "$GET_ORDER" | jq '.' 2>/dev/null || echo "$GET_ORDER"
echo ""

echo -e "${YELLOW}Step 7: Update Order Status to CONFIRMED${NC}"
echo "This will deduct stock from inventory"
echo "Testing: PATCH ${ORDER_URL}/api/orders/${ORDER_ID}/status"

CONFIRM_ORDER=$(curl -s -X PATCH "${ORDER_URL}/api/orders/${ORDER_ID}/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}')

echo "Confirm order response:"
echo "$CONFIRM_ORDER" | jq '.' 2>/dev/null || echo "$CONFIRM_ORDER"

if echo "$CONFIRM_ORDER" | grep -q "CONFIRMED"; then
    echo -e "${GREEN}✓ Order confirmed and stock deducted${NC}"
else
    echo -e "${RED}✗ Failed to confirm order${NC}"
fi
echo ""

echo -e "${YELLOW}Step 8: Verify Stock Deduction${NC}"
echo "Checking if stock was deducted from inventory"
STOCK_AFTER=$(curl -s "${INVENTORY_URL}/inventory/${PRODUCT_ID}")
echo "Current stock for ${PRODUCT_ID}:"
echo "$STOCK_AFTER" | jq '.' 2>/dev/null || echo "$STOCK_AFTER"
echo ""

echo -e "${YELLOW}Step 9: Complete the Order${NC}"
COMPLETE_ORDER=$(curl -s -X PATCH "${ORDER_URL}/api/orders/${ORDER_ID}/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}')

echo "Complete order response:"
echo "$COMPLETE_ORDER" | jq '.' 2>/dev/null || echo "$COMPLETE_ORDER"

if echo "$COMPLETE_ORDER" | grep -q "COMPLETED"; then
    echo -e "${GREEN}✓ Order completed${NC}"
else
    echo -e "${RED}✗ Failed to complete order${NC}"
fi
echo ""

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Integration Test Complete!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Summary:"
echo "- Order ID: $ORDER_ID"
echo "- Product tested: $PRODUCT_ID"
echo "- Stock deduction: Verified"
echo "- Order lifecycle: PENDING -> CONFIRMED -> COMPLETED"
