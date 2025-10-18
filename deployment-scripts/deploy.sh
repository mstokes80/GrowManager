#!/bin/bash
# ============================================================
# GrowManager Deployment Script
# ============================================================
# Deploys GrowManager to a remote server via SSH
# Usage: ./deploy.sh [staging|production]
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check arguments
ENVIRONMENT=${1:-staging}

if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

log_info "Deploying to $ENVIRONMENT environment..."

# Load environment-specific configuration
if [ "$ENVIRONMENT" == "production" ]; then
    ENV_FILE=".env.production"
    SSH_HOST="${PRODUCTION_SSH_HOST}"
    SSH_USER="${PRODUCTION_SSH_USER}"
    DEPLOY_PATH="${PRODUCTION_DEPLOY_PATH}"
else
    ENV_FILE=".env.staging"
    SSH_HOST="${STAGING_SSH_HOST}"
    SSH_USER="${STAGING_SSH_USER}"
    DEPLOY_PATH="${STAGING_DEPLOY_PATH}"
fi

# Verify environment variables
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ] || [ -z "$DEPLOY_PATH" ]; then
    log_error "Missing required environment variables!"
    echo "Required: SSH_HOST, SSH_USER, DEPLOY_PATH"
    exit 1
fi

# Verify SSH connection
log_info "Testing SSH connection to $SSH_USER@$SSH_HOST..."
if ! ssh -o ConnectTimeout=5 "$SSH_USER@$SSH_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    log_error "Failed to connect to $SSH_HOST"
    exit 1
fi
log_success "SSH connection verified"

# Create backup (production only)
if [ "$ENVIRONMENT" == "production" ]; then
    log_info "Creating backup..."
    ssh "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH

        # Create backup directory
        BACKUP_DIR="backups/\$(date +%Y%m%d_%H%M%S)"
        mkdir -p \$BACKUP_DIR

        # Backup database
        docker compose -f docker-compose.prod.yml exec -T postgres \
            pg_dump -U \$DB_USERNAME \$DB_NAME > \$BACKUP_DIR/database.sql

        # Backup .env file
        cp .env.production \$BACKUP_DIR/

        # Cleanup old backups (keep last 7 days)
        find backups/ -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

        echo "Backup created at \$BACKUP_DIR"
EOF
    log_success "Backup completed"
fi

# Pull latest code
log_info "Pulling latest code from repository..."
ssh "$SSH_USER@$SSH_HOST" << EOF
    cd $DEPLOY_PATH

    # Pull latest changes
    git fetch origin
    git reset --hard origin/main

    # Copy environment file
    cp $ENV_FILE .env
EOF
log_success "Code updated"

# Build and deploy Docker images
log_info "Building and deploying Docker images..."
ssh "$SSH_USER@$SSH_HOST" << EOF
    cd $DEPLOY_PATH

    # Login to GitHub Container Registry (if using GHCR)
    # echo "\$GITHUB_TOKEN" | docker login ghcr.io -u \$GITHUB_USER --password-stdin

    # Pull latest images (if using pre-built images)
    # docker compose -f docker-compose.prod.yml pull

    # Build and start services
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d --force-recreate

    # Wait for services to be healthy
    echo "Waiting for services to start..."
    sleep 30

    # Check service status
    docker compose -f docker-compose.prod.yml ps
EOF
log_success "Deployment completed"

# Run health checks
log_info "Running health checks..."
FRONTEND_URL="http://$SSH_HOST"
BACKEND_URL="http://$SSH_HOST/api"

sleep 10

# Check backend health
if curl -f -s "$BACKEND_URL/actuator/health" > /dev/null; then
    log_success "Backend is healthy"
else
    log_warning "Backend health check failed"
fi

# Check frontend health
if curl -f -s "$FRONTEND_URL/health" > /dev/null; then
    log_success "Frontend is healthy"
else
    log_warning "Frontend health check failed"
fi

# Cleanup old Docker images
log_info "Cleaning up old Docker images..."
ssh "$SSH_USER@$SSH_HOST" << 'EOF'
    # Remove dangling images
    docker image prune -f

    # Remove old images (keep last 3 versions)
    docker images | grep growmanager | tail -n +4 | awk '{print $3}' | xargs -r docker rmi 2>/dev/null || true
EOF
log_success "Cleanup completed"

# Show deployment summary
echo ""
echo "============================================================"
log_success "Deployment to $ENVIRONMENT completed successfully!"
echo "============================================================"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend API: $BACKEND_URL"
echo "MinIO Console: http://$SSH_HOST:9001"
echo "============================================================"

# Show running services
log_info "Current running services:"
ssh "$SSH_USER@$SSH_HOST" "cd $DEPLOY_PATH && docker compose -f docker-compose.prod.yml ps"