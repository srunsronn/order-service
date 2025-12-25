# Setup & Run Order Service

## Prerequisites
- Node.js 18+ installed
- Docker installed (for PostgreSQL)
- Internet connection (for Inventory Service)

## Step-by-Step Setup

### 1. Start PostgreSQL Database
```bash
docker-compose up postgres -d
```

Wait 10 seconds for PostgreSQL to start, then verify:
```bash
docker-compose ps
```

You should see postgres running.

### 2. Verify Environment Variables
Check your `.env` file exists and has correct values:
```bash
cat .env
```

Should show:
```
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=order_service
INVENTORY_SERVICE_URL=https://inventory-service-production-fff7.up.railway.app
```

### 3. Install Dependencies (if not already done)
```bash
npm install
```

### 4. Start Order Service
```bash
npm run start:dev
```

You should see:
```
[Nest] INFO Order Service is running on port 3000
```

### 5. Test It Works
Open a new terminal and run:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","timestamp":"...","service":"order-service"}
```

## Common Errors & Solutions

### Error: "Unable to connect to the database"
**Problem:** PostgreSQL is not running

**Solution:**
```bash
docker-compose up postgres -d
docker-compose logs postgres
```

### Error: "Port 3000 is already in use"
**Problem:** Another service is using port 3000

**Solution:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it or change PORT in .env
PORT=3001 npm run start:dev
```

### Error: "Cannot find module"
**Problem:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Failed to verify inventory availability"
**Problem:** No internet or Inventory Service is down

**Solution:**
```bash
# Test inventory service
curl https://inventory-service-production-fff7.up.railway.app/health

# If down, you can't create orders but service will still start
```

## Quick Commands

```bash
# Start everything
docker-compose up postgres -d && npm run start:dev

# Stop database
docker-compose down

# View database logs
docker-compose logs postgres -f

# Reset database
docker-compose down -v && docker-compose up postgres -d

# Run tests
npm run test

# Build for production
npm run build
npm run start:prod
```

## What Each Command Does

| Command | Purpose |
|---------|---------|
| `docker-compose up postgres -d` | Start PostgreSQL in background |
| `npm run start:dev` | Start Order Service with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start:prod` | Run compiled production version |
| `docker-compose down` | Stop and remove containers |
| `docker-compose down -v` | Stop containers and delete data |

## Verify Everything Works

Run the integration test:
```bash
./test-integration.sh
```

This will test the entire order flow with the production inventory service!
