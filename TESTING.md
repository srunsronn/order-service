# Jest Testing Documentation

## Overview
This project uses **Jest** as the testing framework with **ts-jest** for TypeScript support. The testing suite covers unit tests, integration tests, and end-to-end tests to ensure code quality and reliability.

## Testing Stack
- **Jest**: v30.x - JavaScript testing framework
- **ts-jest**: TypeScript preprocessor for Jest
- **@nestjs/testing**: NestJS testing utilities
- **Supertest**: HTTP assertion library for E2E tests

## Test Structure

### Unit Tests
Unit tests are located alongside source files with `.spec.ts` extension:
- `src/orders/orders.controller.spec.ts` - Controller layer tests
- `src/orders/orders.service.spec.ts` - Service layer tests
- `src/inventory/inventory.service.spec.ts` - Inventory integration tests
- `src/app.controller.spec.ts` - Application controller tests

### E2E Tests
End-to-end tests are located in the `test/` directory:
- `test/app.e2e-spec.ts` - Full application flow tests

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npm test -- orders.service.spec.ts
```

## Test Coverage

The test suite covers:

### 1. Orders Controller Tests (`orders.controller.spec.ts`)
- ✅ **POST /api/orders** - Order creation
- ✅ **GET /api/orders** - List all orders with pagination
- ✅ **GET /api/orders/:id** - Get single order
- ✅ **PATCH /api/orders/:id/status** - Update order status
- ✅ Mock service dependencies
- ✅ Validation testing

### 2. Orders Service Tests (`orders.service.spec.ts`)
- ✅ Order creation with inventory checking
- ✅ Guest user ID auto-generation
- ✅ Inventory availability validation
- ✅ Stock deduction on order confirmation
- ✅ Pagination logic
- ✅ Order status transitions (PENDING → CONFIRMED → DELIVERED/CANCELLED)
- ✅ Error handling (insufficient stock, not found, invalid status)
- ✅ Repository mock interactions

### 3. Inventory Service Tests (`inventory.service.spec.ts`)
- ✅ Bulk availability checking
- ✅ Stock deduction via API Gateway
- ✅ API error handling
- ✅ HTTP service mock interactions
- ✅ Unavailable items detection

## Test Examples

### Controller Test Example
```typescript
it('should create a new order', async () => {
  const createOrderDto: CreateOrderDto = {
    userId: 'user-123',
    fullName: 'John Doe',
    email: 'john@example.com',
    items: [{ productId: 'PROD-001', quantity: 2, price: 50 }],
  };

  const result = await controller.create(createOrderDto);

  expect(result).toBeDefined();
  expect(mockOrdersService.create).toHaveBeenCalledWith(createOrderDto);
});
```

### Service Test Example
```typescript
it('should check inventory availability before creating order', async () => {
  mockInventoryService.checkAvailability.mockResolvedValue({
    available: true,
  });

  await service.create(createOrderDto);

  expect(mockInventoryService.checkAvailability).toHaveBeenCalledWith({
    items: expect.arrayContaining([
      expect.objectContaining({
        productId: 'PROD-001',
        quantity: 2,
      }),
    ]),
  });
});
```

## Mocking Strategy

### Repository Mocking
```typescript
const mockOrderRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
};
```

### Service Mocking
```typescript
const mockInventoryService = {
  checkAvailability: jest.fn(),
  deductStock: jest.fn(),
};
```

### HTTP Service Mocking
```typescript
const mockHttpService = {
  post: jest.fn().mockReturnValue(of({ data: mockResponse })),
};
```

## CI/CD Integration

Tests are automatically run in CI/CD pipelines to ensure:
- ✅ All tests pass before deployment
- ✅ Code coverage meets minimum threshold
- ✅ No breaking changes in pull requests

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm test

- name: Generate Coverage Report
  run: npm run test:cov
```

## Best Practices

1. **Test Naming**: Use descriptive test names with `should` statements
2. **AAA Pattern**: Arrange, Act, Assert structure
3. **Mocking**: Mock external dependencies and services
4. **Coverage**: Aim for >80% code coverage
5. **Isolation**: Each test should be independent
6. **Cleanup**: Use `afterEach` to reset mocks

## DevOps Benefits

### 1. Continuous Testing
- Automated test execution on every commit
- Immediate feedback on code quality
- Prevents regression bugs

### 2. Quality Assurance
- Validates business logic
- Ensures API contracts
- Tests error handling

### 3. Confidence in Deployment
- Green tests = safe to deploy
- Catch issues before production
- Faster development cycles

### 4. Documentation
- Tests serve as living documentation
- Shows expected behavior
- Demonstrates API usage

## Test Metrics

```bash
# Example Coverage Output
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   85.67 |    78.12 |   89.45 |   85.67 |
 src/orders                |   92.31 |    85.71 |   95.00 |   92.31 |
  orders.controller.ts     |   100   |    100   |   100   |   100   |
  orders.service.ts        |   88.89 |    80.00 |   92.86 |   88.89 |
 src/inventory             |   87.50 |    75.00 |   90.00 |   87.50 |
  inventory.service.ts     |   87.50 |    75.00 |   90.00 |   87.50 |
---------------------------|---------|----------|---------|---------|
```

## Troubleshooting

### Tests Failing
1. Check mock implementations
2. Verify test data matches expectations
3. Review error messages carefully
4. Ensure database connections in E2E tests

### Coverage Issues
1. Add tests for uncovered branches
2. Test error scenarios
3. Cover edge cases
4. Test async operations

## Future Improvements
- [ ] Add integration tests for API Gateway
- [ ] Implement performance testing
- [ ] Add mutation testing
- [ ] Increase coverage to 90%+
- [ ] Add visual regression testing

---

**Note**: Always run tests before committing code and ensure all tests pass before creating pull requests.
