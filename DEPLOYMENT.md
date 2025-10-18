# GrowManager Deployment Guide

This guide covers deploying GrowManager to production using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Configuration](#production-configuration)
- [Building Docker Images](#building-docker-images)
- [Deployment](#deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
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