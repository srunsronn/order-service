# 🚀 Order Service - Production Deployment Guide

## Deployment Options

1. **Railway** (Recommended - Same as Inventory Service) ⭐
2. **Docker + VPS** (DigitalOcean, AWS EC2, etc.)
3. **Heroku**
4. **Google Cloud Run**

---

## Option 1: Deploy to Railway (RECOMMENDED) ⭐

Railway is simple and your Inventory Service is already there!

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Your code pushed to GitHub

### Step-by-Step Instructions

#### Step 1: Prepare Your Code

```bash
# 1. Make sure all changes are committed
git status

# 2. Add a .gitignore if not exists
cat >> .gitignore << 'EOF'
node_modules
dist
.env
*.log
EOF

# 3. Commit everything
git add .
git commit -m "feat: Ready for Railway deployment"

# 4. Push to GitHub
git push origin main
```

#### Step 2: Deploy to Railway

1. **Go to Railway:** https://railway.app
2. **Sign in** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `order-service` repository**

#### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically create a PostgreSQL database
3. Copy the connection details (you'll need them for environment variables)

#### Step 4: Configure Environment Variables

1. Click on your **order-service** (not the database)
2. Go to **"Variables"** tab
3. Add these variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=${{Postgres.PGHOST}}
DATABASE_PORT=${{Postgres.PGPORT}}
DATABASE_USERNAME=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
DATABASE_NAME=${{Postgres.PGDATABASE}}
INVENTORY_SERVICE_URL=https://inventory-service-production-fff7.up.railway.app
```

**Note:** The `${{Postgres.XXXX}}` values are Railway's way of referencing the database. Railway will auto-fill them!

#### Step 5: Configure Build & Start Commands

1. In your service settings, go to **"Settings"** tab
2. Set **Build Command:**
   ```bash
   npm install && npm run build
   ```
3. Set **Start Command:**
   ```bash
   npm run start:prod
   ```

#### Step 6: Deploy!

1. Click **"Deploy"** 
2. Wait for deployment (2-3 minutes)
3. Railway will give you a URL like: `https://order-service-production.up.railway.app`

#### Step 7: Verify Deployment

```bash
# Test health endpoint
curl https://your-railway-url.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"...","service":"order-service"}
```

#### Step 8: Test Create Order

```bash
curl -X POST https://your-railway-url.up.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [{
      "productId": "LAPTOP001",
      "quantity": 1,
      "price": 2499.99
    }]
  }'
```

### Railway Tips

- **Free Tier:** $5 credit/month (enough for testing)
- **Auto-redeploy:** Push to GitHub = automatic redeploy
- **View Logs:** Click on your service → "Deployments" → "View Logs"
- **Database Backup:** Railway handles this automatically

---

## Option 2: Deploy with Docker (VPS)

For DigitalOcean, AWS EC2, or any VPS with Docker.

### Prerequisites
- VPS with Docker installed
- Domain name (optional)

### Step 1: Prepare for Production

Update `docker-compose.yml` for production:

```yaml
version: '3.8'

services:
  order-service:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USERNAME: ${DB_USER}
      DATABASE_PASSWORD: ${DB_PASSWORD}
      DATABASE_NAME: order_service
      INVENTORY_SERVICE_URL: https://inventory-service-production-fff7.up.railway.app
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: order_service
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 2: Create Production .env

```bash
# On your VPS
cat > .env << EOF
DB_USER=order_user
DB_PASSWORD=your-secure-password-here
EOF
```

### Step 3: Deploy to VPS

```bash
# 1. SSH to your VPS
ssh user@your-server-ip

# 2. Clone your repository
git clone https://github.com/your-username/order-service.git
cd order-service

# 3. Create .env file (see Step 2)
nano .env

# 4. Build and start
docker-compose up -d --build

# 5. Check logs
docker-compose logs -f order-service

# 6. Test
curl http://localhost:3000/health
```

### Step 4: Setup Nginx (Optional - for domain)

```bash
# 1. Install Nginx
sudo apt install nginx -y

# 2. Create config
sudo nano /etc/nginx/sites-available/order-service

# 3. Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 4. Enable site
sudo ln -s /etc/nginx/sites-available/order-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 5. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Option 3: Deploy to Heroku

### Step 1: Install Heroku CLI

```bash
# Install
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

### Step 2: Create Heroku App

```bash
# In your project directory
heroku create your-order-service

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini
```

### Step 3: Configure Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set INVENTORY_SERVICE_URL=https://inventory-service-production-fff7.up.railway.app
```

### Step 4: Create Procfile

```bash
echo "web: npm run start:prod" > Procfile
git add Procfile
git commit -m "Add Procfile for Heroku"
```

### Step 5: Deploy

```bash
git push heroku main

# Open your app
heroku open

# View logs
heroku logs --tail
```

---

## Post-Deployment Checklist

### 1. Test All Endpoints

```bash
# Set your deployment URL
DEPLOY_URL="https://your-deployed-url.com"

# Health check
curl $DEPLOY_URL/health

# Create order
curl -X POST $DEPLOY_URL/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [{
      "productId": "LAPTOP001",
      "quantity": 1,
      "price": 2499.99
    }]
  }'

# Get order (use ID from previous response)
curl $DEPLOY_URL/api/orders/{ORDER_ID}

# Update status
curl -X PATCH $DEPLOY_URL/api/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

### 2. Verify Inventory Integration

```bash
# Create an order and check if stock is deducted
# Before: Check stock
curl https://inventory-service-production-fff7.up.railway.app/inventory/LAPTOP001

# Create and confirm order (use your deployed URL)
# ... (create and confirm order steps)

# After: Check stock again - should be reduced
curl https://inventory-service-production-fff7.up.railway.app/inventory/LAPTOP001
```

### 3. Monitor Logs

**Railway:**
- Go to your project → Click service → "Deployments" → "View Logs"

**Docker:**
```bash
docker-compose logs -f order-service
```

**Heroku:**
```bash
heroku logs --tail
```

### 4. Set Up Monitoring (Optional but Recommended)

Consider adding:
- **Health checks:** Uptime monitoring (UptimeRobot, Pingdom)
- **Error tracking:** Sentry
- **Performance monitoring:** New Relic, DataDog
- **Log aggregation:** Loggly, Papertrail

---

## Production Environment Variables

Your final production `.env` should look like:

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-user
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=order_service
INVENTORY_SERVICE_URL=https://inventory-service-production-fff7.up.railway.app
```

**⚠️ IMPORTANT:**
- Never commit `.env` to Git
- Use strong passwords for production
- Rotate passwords regularly
- Use different credentials for each environment

---

## Troubleshooting Deployment

### Problem: "Cannot connect to database"

**Solution:**
```bash
# Check database connection details
# Make sure DATABASE_HOST is correct
# For Railway: Use ${{Postgres.PGHOST}}
# For Docker: Use service name (postgres)
```

### Problem: "Port already in use"

**Solution:**
```bash
# Railway: Change PORT in environment variables
# Docker: Change port mapping in docker-compose.yml
ports:
  - "3001:3000"  # Use different external port
```

### Problem: "Service not starting"

**Solution:**
```bash
# Check logs for errors
# Railway: View Logs in dashboard
# Docker: docker-compose logs order-service
# Heroku: heroku logs --tail

# Common issues:
# 1. Missing environment variables
# 2. Wrong build/start commands
# 3. Database not ready
```

### Problem: "Inventory Service connection failed"

**Solution:**
```bash
# Verify INVENTORY_SERVICE_URL is correct
# Test from your deployed service:
curl https://inventory-service-production-fff7.up.railway.app/health
```

---

## Share with Your Team

After deployment, share:

1. **Service URL:** `https://your-deployed-url.com`
2. **API Endpoints:**
   - `POST /api/orders` - Create order
   - `GET /api/orders/:id` - Get order
   - `PATCH /api/orders/:id/status` - Update status
   - `GET /health` - Health check

3. **Test Credentials:**
   - Test Product: `LAPTOP001`
   - No authentication (add at API Gateway)

4. **Documentation:**
   - Share `HANDOFF.md` for complete API documentation
   - Share this deployment guide for future updates

---

## Updating Your Deployment

### Railway:
```bash
# Just push to GitHub - automatic deployment
git add .
git commit -m "Update: description"
git push origin main
# Railway auto-deploys!
```

### Docker (VPS):
```bash
# SSH to server
ssh user@your-server

# Pull latest code
cd order-service
git pull

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f order-service
```

### Heroku:
```bash
git push heroku main
```

---

## Cost Estimates

### Railway (Free Tier):
- **Free:** $5 credit/month
- **Hobby:** $5/month after credits
- **Starter:** $20/month (recommended for production)

### DigitalOcean:
- **Basic Droplet:** $6/month (1GB RAM)
- **Good for production:** $12/month (2GB RAM)

### Heroku:
- **Free:** Dyno sleeps after 30 mins (not good for production)
- **Hobby:** $7/month per dyno
- **Plus PostgreSQL:** $9/month

---

## Recommended: Railway Deployment

**Why Railway?**
- ✅ Same platform as Inventory Service
- ✅ Auto-deploy from GitHub
- ✅ Automatic SSL certificates
- ✅ Easy environment variable management
- ✅ Built-in PostgreSQL
- ✅ Great free tier for testing
- ✅ Simple to upgrade

**Start here, then scale as needed!**

---

## Next Steps After Deployment

1. ✅ Test all endpoints
2. ✅ Verify inventory integration
3. ✅ Share URL with API Gateway team
4. ✅ Set up monitoring
5. ✅ Configure backups (if not automatic)
6. ✅ Add authentication (at API Gateway level)
7. ✅ Set up CI/CD (optional but recommended)

---

**Need help? Check the logs first!**
- Railway: Project → Service → View Logs
- Docker: `docker-compose logs -f`
- Heroku: `heroku logs --tail`

Good luck with your deployment! 🚀
