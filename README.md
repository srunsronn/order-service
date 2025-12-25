# Order Service

A production-ready microservice for managing orders in a microservices-based ordering platform, built with NestJS, TypeORM, and PostgreSQL.

## Architecture Overview

```
Client → API Gateway → Order Service → Inventory Service
                             ↓
                       PostgreSQL
```

## Features

- ✅ Order creation with inventory validation
- ✅ Order retrieval by ID
- ✅ Order status lifecycle management (PENDING → CONFIRMED → COMPLETED)
- ✅ RESTful API endpoints
- ✅ PostgreSQL with TypeORM
- ✅ DTO validation with class-validator
- ✅ External service communication (Inventory Service)
- ✅ Health check endpoint
- ✅ Docker support
- ✅ Environment-based configuration

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Validation**: class-validator, class-transformer
- **HTTP Client**: Axios
- **Containerization**: Docker

## Database Schema

### Order Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | String | User identifier |
| status | Enum | PENDING, CONFIRMED, COMPLETED |
| total | Decimal | Order total amount |
| createdAt | Timestamp | Creation timestamp |

### OrderItem Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| orderId | UUID | Foreign key to Order |
| productId | String | Product identifier |
| quantity | Integer | Item quantity |
| price | Decimal | Item price |

## API Endpoints

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "productId": "p1",
      "quantity": 2,
      "price": 29.99
    }
  ]
}
```

### Get Order
```http
GET /api/orders/:id
```

### Update Order Status
```http
PATCH /api/orders/:id/status
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

### Health Check
```http
GET /health
```

## Project Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the values:
```env
NODE_ENV=development
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=order_service

INVENTORY_SERVICE_URL=http://localhost:3001
```

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Docker Compose
```bash
docker-compose up --build
```

This will start:
- Order Service on `http://localhost:3000`
- PostgreSQL on `localhost:5432`

## Project Structure

```
src/
├── config/
│   └── configuration.ts        # Environment configuration
├── health/
│   └── health.controller.ts    # Health check endpoint
├── inventory/
│   ├── interfaces/
│   │   └── inventory.interface.ts
│   └── inventory.service.ts    # Inventory service client
├── orders/
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   └── update-order-status.dto.ts
│   ├── entities/
│   │   ├── order.entity.ts
│   │   └── order-item.entity.ts
│   ├── enums/
│   │   └── order-status.enum.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.module.ts
├── app.module.ts
└── main.ts
```

## Key Design Decisions

### TypeORM over Prisma
- Native NestJS integration with `@nestjs/typeorm`
- Decorator-based entity definitions
- Simpler setup for NestJS projects

### Status Lifecycle Validation
- Enforces valid state transitions
- Prevents invalid status updates
- Business logic in service layer

### Inventory Service Communication
- HTTP-based REST communication
- Timeout and error handling
- Service unavailability handling

### Database Synchronization
- Auto-sync enabled in development
- Should be disabled in production (use migrations)

## Production Considerations

### Environment Variables
- All sensitive data in environment variables
- No hardcoded credentials

### Error Handling
- Proper HTTP status codes
- Descriptive error messages
- Logging for debugging

### Validation
- DTO validation on all inputs
- UUID validation for IDs
- Enum validation for status

### Docker
- Multi-stage build for smaller images
- Production-optimized Node.js image
- Health check support

## Next Steps for Production

1. **Migrations**: Replace `synchronize: true` with proper migrations
2. **Authentication**: Add JWT/API key validation
3. **Rate Limiting**: Implement rate limiting middleware
4. **Monitoring**: Add APM (e.g., New Relic, DataDog)
5. **Logging**: Structured logging (e.g., Winston, Pino)
6. **Testing**: Unit and integration tests
7. **CI/CD**: GitHub Actions or GitLab CI
8. **API Documentation**: Swagger/OpenAPI

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## License

MIT

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
