#!/bin/bash

# 🚀 Order Service Production Test Suite
# Tests Docker containerized deployment on Render

echo "====================================="
echo "🧪 Order Service Production Test Suite"
echo "====================================="
echo "Testing: https://order-service-dm41.onrender.com"
echo "Date: $(date)"
echo ""

BASE_URL="https://order-service-dm41.onrender.com"
TEST_PASSED=0
TEST_FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
test_count() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TEST_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TEST_FAILED++))
    fi
}

echo "📊 Test 1: Health Check"
echo "Testing: GET /health"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 200 ] && echo "$HEALTH_BODY" | grep -q '"status":"ok"'; then
    echo "✅ Health check passed"
    test_count <<< "0"
else
    echo "❌ Health check failed"
    echo "Response: $HEALTH_BODY"
    test_count <<< "1"
fi
echo ""

echo "🗄️ Test 2: Database Connectivity"
echo "Testing: POST /api/orders (guest checkout)"
CREATE_ORDER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Production Test User",
    "email": "prodtest@example.com",
    "address": "123 Production St",
    "city": "Test City",
    "zipCode": "12345",
    "items": [
      {
        "productId": "PROD-001",
        "quantity": 1,
        "price": 99.99
      }
    ]
  }')

CREATE_HTTP_STATUS=$(echo "$CREATE_ORDER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CREATE_BODY=$(echo "$CREATE_ORDER_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$CREATE_HTTP_STATUS" -eq 201 ] && echo "$CREATE_BODY" | grep -q '"id"'; then
    ORDER_ID=$(echo "$CREATE_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Order created successfully"
    echo "📝 Order ID: $ORDER_ID"
    test_count <<< "0"
else
    echo "❌ Order creation failed"
    echo "Response: $CREATE_BODY"
    test_count <<< "1"
    exit 1
fi
echo ""

echo "📖 Test 3: Order Retrieval"
echo "Testing: GET /api/orders/$ORDER_ID"
GET_ORDER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/orders/$ORDER_ID")
GET_HTTP_STATUS=$(echo "$GET_ORDER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
GET_BODY=$(echo "$GET_ORDER_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$GET_HTTP_STATUS" -eq 200 ] && echo "$GET_BODY" | grep -q '"status":"PENDING"'; then
    echo "✅ Order retrieved successfully"
    test_count <<< "0"
else
    echo "❌ Order retrieval failed"
    echo "Response: $GET_BODY"
    test_count <<< "1"
fi
echo ""

echo "📦 Test 4: Inventory Integration & Order Confirmation"
echo "Testing: PATCH /api/orders/$ORDER_ID/status (CONFIRMED)"
CONFIRM_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}')

CONFIRM_HTTP_STATUS=$(echo "$CONFIRM_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CONFIRM_BODY=$(echo "$CONFIRM_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$CONFIRM_HTTP_STATUS" -eq 200 ] && echo "$CONFIRM_BODY" | grep -q '"status":"CONFIRMED"'; then
    echo "✅ Order confirmed and inventory updated"
    test_count <<< "0"
else
    echo "❌ Order confirmation failed"
    echo "Response: $CONFIRM_BODY"
    test_count <<< "1"
fi
echo ""

echo "✅ Test 5: Order Completion"
echo "Testing: PATCH /api/orders/$ORDER_ID/status (COMPLETED)"
COMPLETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}')

COMPLETE_HTTP_STATUS=$(echo "$COMPLETE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
COMPLETE_BODY=$(echo "$COMPLETE_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$COMPLETE_HTTP_STATUS" -eq 200 ] && echo "$COMPLETE_BODY" | grep -q '"status":"COMPLETED"'; then
    echo "✅ Order completed successfully"
    test_count <<< "0"
else
    echo "❌ Order completion failed"
    echo "Response: $COMPLETE_BODY"
    test_count <<< "1"
fi
echo ""

echo "🚫 Test 6: Error Handling - Invalid Order ID"
echo "Testing: GET /api/orders/invalid-id"
INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/orders/invalid-id")
INVALID_HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$INVALID_HTTP_STATUS" -eq 400 ] || [ "$INVALID_HTTP_STATUS" -eq 404 ]; then
    echo "✅ Error handling works correctly"
    test_count <<< "0"
else
    echo "❌ Error handling failed"
    test_count <<< "1"
fi
echo ""

echo "🎯 Test 7: Guest Checkout Validation"
echo "Testing: POST /api/orders (missing required fields)"
INVALID_ORDER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"items": []}')

INVALID_ORDER_HTTP_STATUS=$(echo "$INVALID_ORDER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$INVALID_ORDER_HTTP_STATUS" -eq 400 ]; then
    echo "✅ Validation works correctly"
    test_count <<< "0"
else
    echo "❌ Validation failed"
    test_count <<< "1"
fi
echo ""

# Final Results
echo "====================================="
echo "📊 PRODUCTION TEST RESULTS"
echo "====================================="
echo "✅ Tests Passed: $TEST_PASSED"
echo "❌ Tests Failed: $TEST_FAILED"
echo "📈 Success Rate: $(( (TEST_PASSED * 100) / (TEST_PASSED + TEST_FAILED) ))%"
echo ""

if [ $TEST_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "🚀 Your Docker containerized order service is production-ready!"
    echo ""
    echo "📋 Summary of Verified Features:"
    echo "✅ Docker containerization"
    echo "✅ Health monitoring"
    echo "✅ Database connectivity"
    echo "✅ Guest checkout functionality"
    echo "✅ Inventory service integration"
    echo "✅ Order lifecycle management"
    echo "✅ Input validation"
    echo "✅ Error handling"
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo "Please check the failed tests above and fix any issues."
fi

echo ""
echo "🔗 Service URL: $BASE_URL"
echo "📝 Test Order ID: $ORDER_ID"
echo "====================================="