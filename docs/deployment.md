# Deployment Guide

This document describes how to deploy the **Linkly URL Management Platform** in development, staging, and production environments.

---

## 1. Quick Start (Development/Local Run)

The easiest way to boot the stack is via Docker Compose, which starts PostgreSQL, Redis, the Backend API, the Frontend client, and the Nginx reverse proxy.

### Prerequisites
- **Docker** (version 24+)
- **Docker Compose** (version 2.20+)

### Step-by-Step Instructions
1. **Clone project files** and navigate to the project directory.
2. **Setup environment parameters**:
   ```bash
   cp .env.example .env
   ```
   *(Adjust `.env` variables if you want custom database credentials or secrets).*
3. **Run the services**:
   ```bash
   docker compose up --build -d
   ```
4. **Run database migrations**:
   Migrations run automatically on backend start, but can be manually triggered if running locally:
   ```bash
   cd backend && npm run db:migrate
   ```
5. **Verify active containers**:
   ```bash
   docker compose ps
   ```

You should see 5 running containers:
- `linkly-postgres`
- `linkly-redis`
- `linkly-backend`
- `linkly-frontend`
- `linkly-nginx`

Access the platform interfaces at:
- **Frontend App**: `http://localhost`
- **Backend API Docs (Swagger)**: `http://localhost/api/docs`

---

## 2. Production Deployment Practices

### A. Environment Configuration (`.env`)
In production, ensure you override these default keys:
- `NODE_ENV=production`
- `JWT_SECRET`: Secure 64-character random string.
- `POSTGRES_PASSWORD` & `REDIS_PASSWORD`: Strong unique credentials.
- `APP_URL`: Your custom production domain (e.g., `https://lnkly.app`).

### B. SSL and TLS Configuration (HTTPS)
To enable HTTPS in production:
1. Obtain certs using Certbot:
   ```bash
   docker run -it --rm --name certbot \
     -v "/etc/letsencrypt:/etc/letsencrypt" \
     -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
     -v "$(pwd)/nginx/certbot:/var/www/certbot" \
     certbot/certbot certonly --webroot \
     -w /var/www/certbot -d yourdomain.com -d www.yourdomain.com
   ```
2. In `nginx/conf.d/default.conf`, uncomment the `HTTPS Server (Port 443)` server block and update path keys.
3. Uncomment the `HTTP to HTTPS Redirect` server block.
4. Reload the Nginx container:
   ```bash
   docker exec -it linkly-nginx nginx -s reload
   ```

### C. Scaling Services
To handle heavy redirect traffic, scale the background workers and API layer:
```bash
docker compose up -d --scale backend=3 --scale click-worker=2
```
*Note: Ensure your load balancer (Nginx) is configured to route round-robin upstream.*

### D. System Diagnostics & Monitoring
Check application logs using:
- **Nginx Logs**: `docker compose logs nginx`
- **Backend API Logs**: `docker compose logs backend`
- **Postgres Health Check**:
  `docker exec -it linkly-postgres pg_isready`
- **Redis Health Check**:
  `docker exec -it linkly-redis redis-cli ping`
