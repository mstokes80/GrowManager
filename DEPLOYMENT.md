# GrowManager Deployment Guide

This guide covers deploying GrowManager to staging and production environments using GitHub Actions CI/CD and manual deployment scripts.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Health Checks](#health-checks)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ (or any Linux with Docker support)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum, 50GB+ recommended (depending on photo uploads)
- **CPU**: 2 cores minimum, 4+ cores recommended

### Software Requirements

- **Docker**: 24.0+ (includes Docker Compose V2 plugin)
- **Git**: 2.x

### Installation

```bash
# Install Docker (includes Docker Compose V2 as a plugin)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version

# Note: Docker Compose V2 is now included with Docker
# If you need to install it separately:
# mkdir -p ~/.docker/cli-plugins/
# curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
# chmod +x ~/.docker/cli-plugins/docker-compose
```

---

## Deployment Methods

GrowManager supports two deployment methods:

1. **GitHub Actions CI/CD** (Recommended) - Automated deployments via GitHub workflows
2. **Manual Deployment** - Deploy using local scripts via SSH

---

## GitHub Actions CI/CD

### Overview

The GitHub Actions CI/CD pipeline (`.github/workflows/deploy.yml`) provides automated deployment with:

- Automated testing before deployment
- Docker image building and pushing to GitHub Container Registry (GHCR)
- Automated deployment to staging on push to `main`
- Manual deployment to production with approval
- Zero-downtime deployment strategy
- Automatic database backups before production deployments
- Health checks after deployment
- Rollback capability

### Setup

#### 1. Configure GitHub Secrets

Navigate to your repository's Settings → Secrets and variables → Actions → Secrets, and add:

**Staging Environment:**
- `STAGING_SSH_HOST` - Staging server hostname or IP
- `STAGING_SSH_USER` - SSH username (e.g., `ubuntu`)
- `STAGING_SSH_PRIVATE_KEY` - SSH private key (entire contents, including `-----BEGIN` and `-----END` lines)

**Production Environment:**
- `PRODUCTION_SSH_HOST` - Production server hostname or IP
- `PRODUCTION_SSH_USER` - SSH username
- `PRODUCTION_SSH_PRIVATE_KEY` - SSH private key (entire contents)

**Note**: `GITHUB_TOKEN` is automatically provided by GitHub Actions.

#### 2. Configure GitHub Variables

Add these variables in Settings → Secrets and variables → Actions → Variables:

**Staging:**
- `STAGING_URL` - https://staging.yourdomain.com (or http://staging-server.com)
- `STAGING_DEPLOY_PATH` - /home/user/growmanager (absolute path on server where code is deployed)

**Production:**
- `PRODUCTION_URL` - https://yourdomain.com
- `PRODUCTION_DEPLOY_PATH` - /home/user/growmanager

#### 3. Configure GitHub Environments

1. Go to Settings → Environments
2. Create two environments: `staging` and `production`
3. For `production` environment:
   - Enable "Required reviewers"
   - Add team members who can approve production deployments
   - Optionally set "Wait timer" for delayed deployments

#### 4. Prepare Server

On both staging and production servers:

```bash
# Create deployment directory
sudo mkdir -p /home/user/growmanager
sudo chown user:user /home/user/growmanager

# Clone repository (initial setup)
cd /home/user/growmanager
git clone https://github.com/yourusername/GrowManager.git .

# Copy and configure environment file
cp .env.production .env
nano .env
```

### Workflow Triggers

The deployment workflow triggers on:

- **Automatic**: Push to `main` branch → Deploys to staging
- **Manual**: Workflow dispatch → Choose staging or production

### Deploying to Staging

**Automatic (on push to main):**

```bash
git checkout main
git merge develop
git push origin main
```

The workflow will automatically:
1. Run all backend and frontend tests
2. Build Docker images
3. Push images to GHCR
4. Deploy to staging server
5. Run smoke tests

**Manual (via GitHub UI):**

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Select "Deploy to Production" workflow
4. Click "Run workflow" button
5. Choose `staging` in the environment dropdown
6. Click "Run workflow"

### Deploying to Production

Production deployments require manual approval and can only be triggered manually:

1. Go to Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Choose `production` in the environment dropdown
5. Click "Run workflow"
6. Wait for staging deployment and tests to pass
7. Approve the production deployment request when prompted

The workflow will:
1. Create database backup
2. Pull latest Docker images
3. Deploy backend (with health check wait)
4. Deploy frontend
5. Run smoke tests
6. Clean up old Docker images

### Monitoring Deployments

**View workflow runs:**
- Go to Actions tab
- Click on the running workflow
- View logs for each step

**Check deployment status:**
```bash
# SSH into server
ssh user@server

# Check running services
cd /home/user/growmanager
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Workflow Features

#### Automated Testing
All tests run before deployment:
- Backend: Unit tests, integration tests, code quality checks
- Frontend: Unit tests, linting, type checking

#### Docker Registry
Images are pushed to GitHub Container Registry (GHCR):
- Backend: `ghcr.io/yourusername/growmanager/backend:latest`
- Frontend: `ghcr.io/yourusername/growmanager/frontend:latest`

#### Zero-Downtime Deployment
Services are updated individually with health check waits:
1. Backend updated first → wait 30s for health check
2. Frontend updated next → wait 10s for health check

#### Automatic Backups
Production deployments automatically:
- Backup PostgreSQL database to `backups/` directory
- Retain last 7 days of backups
- Backup before deploying to allow rollback

#### Health Checks
After deployment, smoke tests verify:
- Backend `/api/actuator/health` returns 200 OK
- Frontend `/health` returns 200 OK
- Auth endpoint accepts requests

### Rollback via GitHub Actions

If you need to rollback a deployment:

1. Go to Actions tab
2. Find the last successful deployment workflow run
3. Click "Re-run all jobs"

Or trigger rollback workflow manually (if implemented).

---

## Manual Deployment

For deployments without GitHub Actions, use the provided deployment scripts.

### Setup

#### 1. Configure Local Environment

Set up environment variables on your local machine:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PRODUCTION_SSH_HOST="your-server.com"
export PRODUCTION_SSH_USER="ubuntu"
export PRODUCTION_DEPLOY_PATH="/home/ubuntu/growmanager"
export PRODUCTION_URL="https://growmanager.yourdomain.com"

export STAGING_SSH_HOST="staging-server.com"
export STAGING_SSH_USER="ubuntu"
export STAGING_DEPLOY_PATH="/home/ubuntu/growmanager"
export STAGING_URL="https://staging.yourdomain.com"

# Reload shell configuration
source ~/.bashrc
```

#### 2. Prepare Server

Follow the same server preparation steps as in [GitHub Actions Setup](#4-prepare-server).

### Using Deployment Scripts

The project includes three deployment helper scripts in `deployment-scripts/`:

- `deploy.sh` - Deploy to staging or production
- `rollback.sh` - Rollback to a previous backup
- `health-check.sh` - Check health of all services

#### Deploy to Staging

```bash
cd deployment-scripts
./deploy.sh staging
```

#### Deploy to Production

```bash
cd deployment-scripts
./deploy.sh production
```

The deployment script will:
1. Verify SSH connection
2. Create database backup (production only)
3. Pull latest code from repository
4. Build Docker images
5. Deploy containers with zero-downtime
6. Run health checks
7. Clean up old Docker images
8. Display deployment summary

**Expected Output:**

```
[INFO] Deploying to production environment...
[SUCCESS] SSH connection verified
[INFO] Creating backup...
[SUCCESS] Backup completed
[INFO] Pulling latest code from repository...
[SUCCESS] Code updated
[INFO] Building and deploying Docker images...
[SUCCESS] Deployment completed
[INFO] Running health checks...
[SUCCESS] Backend is healthy
[SUCCESS] Frontend is healthy
[SUCCESS] Cleanup completed

============================================================
[SUCCESS] Deployment to production completed successfully!
============================================================
Frontend URL: https://growmanager.yourdomain.com
Backend API: https://growmanager.yourdomain.com/api
MinIO Console: http://your-server:9001
============================================================
```

---

## Environment Configuration

### Required Environment Variables

Create `.env.production` (or `.env.staging`) on your server with these variables:

**Application:**
```bash
SPRING_PROFILES_ACTIVE=prod
FRONTEND_URL=https://growmanager.yourdomain.com
CORS_ALLOWED_ORIGINS=https://growmanager.yourdomain.com
```

**Database:**
```bash
DB_NAME=growmanager
DB_USERNAME=growmanager
DB_PASSWORD=<strong-password-16+-chars>
DB_PORT=5432
```

**Redis:**
```bash
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
```

**MinIO/S3:**
```bash
MINIO_ENDPOINT=http://minio:9000
MINIO_PUBLIC_ENDPOINT=https://growmanager.yourdomain.com/storage
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
MINIO_BUCKET_PHOTOS=growmanager-photos
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
```

**JWT:**
```bash
# Generate with: openssl rand -base64 64 | tr -d '\n'
JWT_SECRET=<256+-bit-random-string>
JWT_ACCESS_EXPIRATION=900000        # 15 minutes
JWT_REFRESH_EXPIRATION=604800000    # 7 days
```

**Email (SMTP):**
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=<app-password>
EMAIL_FROM=noreply@yourdomain.com
```

**JVM Options:**
```bash
JAVA_OPTS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0
```

See `.env.production` in the repository for a complete example.

---

## Health Checks

### Automated Health Check Script

Use the provided health check script to verify all services:

```bash
cd deployment-scripts
./health-check.sh production
```

This will check:
- SSH connectivity
- Docker container status (frontend, backend, postgres, redis, minio)
- HTTP endpoints (frontend, backend API)
- Database connectivity
- Redis connectivity
- Container resource usage
- Recent error logs

**Expected Output:**

```
============================================================
GrowManager Health Check - production
============================================================

[INFO] Checking SSH connectivity...
[✓] SSH connection successful

[INFO] Checking Docker containers...
[✓] frontend container is running
[✓] backend container is running
[✓] postgres container is running
[✓] redis container is running
[✓] minio container is running

[INFO] Checking HTTP endpoints...
[✓] Frontend is healthy
[✓] Backend API is healthy
[✓] MinIO Storage is healthy

[INFO] Checking database connectivity...
[✓] PostgreSQL is accepting connections

[INFO] Checking Redis connectivity...
[✓] Redis is responding
```

### Manual Health Checks

**Frontend:**
```bash
curl -f https://growmanager.yourdomain.com/health
```

**Backend:**
```bash
curl -f https://growmanager.yourdomain.com/api/actuator/health
```

**Backend (detailed):**
```bash
curl -s https://growmanager.yourdomain.com/api/actuator/health | jq .
```

**Database:**
```bash
ssh user@server "cd /home/user/growmanager && docker compose -f docker-compose.prod.yml exec postgres pg_isready -U growmanager"
```

**Redis:**
```bash
ssh user@server "cd /home/user/growmanager && docker compose -f docker-compose.prod.yml exec redis redis-cli ping"
```

---

## Rollback Procedures

### Using Rollback Script

The rollback script restores from a previous database backup:

```bash
cd deployment-scripts
./rollback.sh production
```

The script will:
1. List available backups
2. Prompt for confirmation
3. Prompt for backup selection (or use 'latest')
4. Stop all services
5. Restore database from backup
6. Restore environment configuration (if available)
7. Restart all services
8. Run health checks

**Interactive Example:**

```
[WARNING] You are about to rollback production environment!
Are you sure you want to continue? (yes/no): yes
[INFO] Available backups:
drwxr-xr-x  3 user user 4096 Oct 17 14:30 20241017_143000
drwxr-xr-x  3 user user 4096 Oct 17 12:15 20241017_121500
drwxr-xr-x  3 user user 4096 Oct 16 09:00 20241016_090000

Enter backup name (or 'latest' for most recent): latest
[INFO] Using latest backup: 20241017_143000
[SUCCESS] Backup verified: 20241017_143000
[INFO] Starting rollback to 20241017_143000...
```

### Manual Rollback

#### 1. List Backups

```bash
ssh user@server
cd /home/user/growmanager
ls -lt backups/
```

#### 2. Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

#### 3. Restore Database

```bash
# Start PostgreSQL only
docker compose -f docker-compose.prod.yml up -d postgres redis minio
sleep 10

# Restore from backup
BACKUP_DIR="backups/20241017_143000"  # Replace with your backup
cat $BACKUP_DIR/database.sql | \
    docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U growmanager growmanager
```

#### 4. Restart All Services

```bash
docker compose -f docker-compose.prod.yml up -d
sleep 30
```

#### 5. Verify Health

```bash
curl -f https://yourdomain.com/api/actuator/health
curl -f https://yourdomain.com/health
```

---

## Quick Start

### 1. Prepare Deployment Package

On your local development machine:

```bash
# Navigate to project root
cd /path/to/growmanager

# Create deployment tarball (excludes unnecessary files)
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='target' \
    --exclude='dist' \
    --exclude='.env*' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    --exclude='.idea' \
    --exclude='.vscode' \
    -czf growmanager-deploy.tar.gz .

# Verify tarball created
ls -lh growmanager-deploy.tar.gz
```

### 2. Upload to Production Server

```bash
# Upload tarball to server (replace with your server details)
scp growmanager-deploy.tar.gz user@your-server-ip:/opt/growmanager/

# SSH into server
ssh user@your-server-ip

# Extract tarball
cd /opt/growmanager
tar -xzf growmanager-deploy.tar.gz
rm growmanager-deploy.tar.gz
```

### 3. Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production.example .env.production

# Edit the file and set all required values
nano .env.production
```

**IMPORTANT**: Update these critical values:
- `DB_PASSWORD` - Strong database password
- `REDIS_PASSWORD` - Strong Redis password
- `JWT_SECRET` - Generate with: `openssl rand -base64 64 | tr -d '\n'`
- `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` - Strong S3 credentials
- `MAIL_*` - Production email service credentials
- `FRONTEND_URL` - Your production domain
- `CORS_ALLOWED_ORIGINS` - Your production domain(s)

### 3. Build and Deploy

```bash
# Build Docker images
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Verify Deployment

```bash
# Check backend health
curl http://localhost:8080/actuator/health

# Check frontend
curl http://localhost:80/health

# Check all services are running
docker compose -f docker-compose.prod.yml ps
```

---

## Production Configuration

### Environment Variables

All configuration is done via environment variables in `.env.production`. See `.env.production.example` for all available options.

### Database Migrations

Flyway migrations run automatically when the backend starts. To run migrations manually:

```bash
docker compose -f docker-compose.prod.yml exec backend \
  java -cp app.jar org.springframework.boot.loader.JarLauncher \
  --spring.flyway.command=migrate
```

### Storage Configuration

GrowManager uses MinIO (S3-compatible) for photo storage. The bucket is created automatically on first startup.

To access MinIO Console:
- URL: `http://your-server:9001`
- Credentials: `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` from `.env.production`

---

## Building Docker Images

### Backend (Spring Boot API)

```bash
cd growmanager-api
docker build -t growmanager-backend:latest .
```

**Build Arguments** (optional):
```bash
docker build \
  --build-arg MAVEN_OPTS="-Xmx512m" \
  -t growmanager-backend:latest .
```

### Frontend (React + Nginx)

```bash
cd growmanager-ui
docker build -t growmanager-frontend:latest .
```

### Full Stack Build

```bash
docker compose -f docker-compose.prod.yml build --parallel
```

---

## Deployment

### Initial Deployment

Follow the steps in [Quick Start](#quick-start) above.

### Update Deployment

On your **local development machine**:

```bash
# 1. Navigate to project root
cd /path/to/growmanager

# 2. Create new deployment tarball with version tag
VERSION=$(date +%Y%m%d_%H%M%S)
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='target' \
    --exclude='dist' \
    --exclude='.env*' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    --exclude='.idea' \
    --exclude='.vscode' \
    -czf growmanager-${VERSION}.tar.gz .

# 3. Upload to server
scp growmanager-${VERSION}.tar.gz user@your-server-ip:/opt/growmanager/releases/

# 4. Create deployment script
cat > deploy-update.sh << 'EOF'
#!/bin/bash
set -e

VERSION=$1
DEPLOY_DIR="/opt/growmanager"
RELEASE_DIR="${DEPLOY_DIR}/releases"
BACKUP_DIR="${DEPLOY_DIR}/backups"

echo "=== GrowManager Deployment Update ==="
echo "Version: ${VERSION}"

# Create backup of current deployment
echo "Creating backup..."
cd ${DEPLOY_DIR}
tar -czf ${BACKUP_DIR}/backup-$(date +%Y%m%d_%H%M%S).tar.gz \
    --exclude='releases' \
    --exclude='backups' \
    --exclude='.env.production' \
    .

# Stop services
echo "Stopping services..."
docker compose -f docker-compose.prod.yml down

# Extract new version
echo "Extracting new version..."
tar -xzf ${RELEASE_DIR}/growmanager-${VERSION}.tar.gz -C ${DEPLOY_DIR}

# Rebuild images
echo "Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for health checks
echo "Waiting for services to be healthy..."
sleep 10

# Verify deployment
echo "Verifying deployment..."
curl -f http://localhost:8080/actuator/health || exit 1
curl -f http://localhost:80/health || exit 1

echo "Deployment successful!"
docker compose -f docker-compose.prod.yml ps
EOF

# 5. Upload deployment script
scp deploy-update.sh user@your-server-ip:/opt/growmanager/
```

On your **production server**:

```bash
# SSH into server
ssh user@your-server-ip

# Make script executable
chmod +x /opt/growmanager/deploy-update.sh

# Run deployment (replace with your version timestamp)
cd /opt/growmanager
sudo ./deploy-update.sh 20231201_143000

# Monitor logs
docker compose -f docker-compose.prod.yml logs -f

# Clean up old images
docker image prune -f
```

### Rollback

On your **production server**:

```bash
# 1. List available backups
ls -lh /opt/growmanager/backups/

# 2. Stop services
cd /opt/growmanager
docker compose -f docker-compose.prod.yml down

# 3. Restore from backup (replace with your backup filename)
tar -xzf /opt/growmanager/backups/backup-20231201_120000.tar.gz -C /opt/growmanager

# 4. Rebuild and start
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 5. Verify
curl http://localhost:8080/actuator/health
curl http://localhost:80/health
```

---

## SSL/TLS Configuration

### Option 1: Nginx with Let's Encrypt (Recommended)

Add an Nginx reverse proxy container with Certbot:

1. Create `docker-compose.ssl.yml`:

```yaml
services:
  nginx-proxy:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/nginx.conf:ro
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - web-root:/var/www/html
    depends_on:
      - frontend
    networks:
      - growmanager-network

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - web-root:/var/www/html
    command: certonly --webroot --webroot-path=/var/www/html --email your@email.com --agree-tos --no-eff-email -d growmanager.com -d www.growmanager.com

volumes:
  certbot-etc:
  certbot-var:
  web-root:
```

2. Start with SSL:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d
```

### Option 2: Cloud Load Balancer

If deploying to AWS, Azure, or GCP, use their managed load balancers with SSL certificates:
- AWS: Application Load Balancer + ACM
- Azure: Application Gateway + Key Vault
- GCP: Cloud Load Balancing + Certificate Manager

---

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Database Backup

```bash
# Backup PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U growmanager growmanager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U growmanager growmanager < backup_20231201_120000.sql
```

### MinIO Backup

```bash
# Backup MinIO data
docker compose -f docker-compose.prod.yml exec minio \
  mc mirror /data /backup-$(date +%Y%m%d)

# Or copy volume data
docker run --rm -v growmanager_minio_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data
```

### Clean Up

```bash
# Remove stopped containers
docker compose -f docker-compose.prod.yml down

# Remove unused images
docker image prune -a -f

# Remove unused volumes (CAUTION: deletes data!)
docker volume prune -f
```

---

## Troubleshooting

### Backend Won't Start

1. Check logs:
```bash
docker compose -f docker-compose.prod.yml logs backend
```

2. Common issues:
   - Database connection failure: Verify `DB_PASSWORD` matches
   - Redis connection failure: Verify `REDIS_PASSWORD` matches
   - MinIO connection failure: Verify `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`
   - Port conflict: Check if port 8080 is already in use

### Frontend Won't Load

1. Check Nginx logs:
```bash
docker compose -f docker-compose.prod.yml logs frontend
```

2. Common issues:
   - Backend not responding: Check backend health endpoint
   - Static files not found: Rebuild frontend image
   - API proxy error: Verify backend service name in nginx.conf

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker compose -f docker-compose.prod.yml exec postgres psql -U growmanager -d growmanager -c "SELECT version();"

# Check if database is accepting connections
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U growmanager
```

### Performance Issues

1. Check resource usage:
```bash
docker stats
```

2. Increase JVM memory for backend:
```bash
# In .env.production
JAVA_OPTS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=80.0
```

3. Scale services (if needed):
```bash
# Run multiple backend instances
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

### SSL Certificate Issues

```bash
# Check certificate status
docker compose -f docker-compose.prod.yml exec nginx-proxy \
  cat /etc/letsencrypt/live/growmanager.com/cert.pem

# Renew certificate manually
docker compose -f docker-compose.prod.yml exec certbot \
  certbot renew
```

---

## Security Checklist

Before going live, ensure:

- [ ] All passwords changed from defaults (database, Redis, MinIO, JWT secret)
- [ ] JWT_SECRET is cryptographically secure (256+ bits)
- [ ] SSL/TLS certificate installed and working
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Database backups automated
- [ ] MinIO backups automated
- [ ] Monitoring and alerting configured
- [ ] Production email service configured
- [ ] CORS restricted to production domain(s)
- [ ] Error tracking configured (Sentry)
- [ ] Rate limiting tested
- [ ] All tests passing
- [ ] Load testing completed

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/growmanager/issues
- Documentation: https://docs.growmanager.com
- Email: support@growmanager.com

---

**Last Updated**: 2025-10-17