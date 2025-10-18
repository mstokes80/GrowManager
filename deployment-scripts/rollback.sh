#!/bin/bash
# ============================================================
# GrowManager Rollback Script
# ============================================================
# Rollback to a previous deployment backup
# Usage: ./rollback.sh [staging|production] [backup-name]
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
BACKUP_NAME=$2

if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [staging|production] [backup-name]"
    exit 1
fi

# Load environment-specific configuration
if [ "$ENVIRONMENT" == "production" ]; then
    SSH_HOST="${PRODUCTION_SSH_HOST}"
    SSH_USER="${PRODUCTION_SSH_USER}"
    DEPLOY_PATH="${PRODUCTION_DEPLOY_PATH}"
else
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

# Confirm rollback
log_warning "You are about to rollback $ENVIRONMENT environment!"
echo -n "Are you sure you want to continue? (yes/no): "
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

# List available backups if no backup name provided
if [ -z "$BACKUP_NAME" ]; then
    log_info "Available backups:"
    ssh "$SSH_USER@$SSH_HOST" "cd $DEPLOY_PATH && ls -lt backups/ | head -10"
    echo ""
    echo -n "Enter backup name (or 'latest' for most recent): "
    read -r BACKUP_NAME
fi

# Determine backup directory
if [ "$BACKUP_NAME" == "latest" ]; then
    BACKUP_DIR=$(ssh "$SSH_USER@$SSH_HOST" "cd $DEPLOY_PATH && ls -t backups/ | head -1")
    if [ -z "$BACKUP_DIR" ]; then
        log_error "No backups found!"
        exit 1
    fi
    log_info "Using latest backup: $BACKUP_DIR"
else
    BACKUP_DIR="$BACKUP_NAME"
fi

# Verify backup exists
log_info "Verifying backup exists..."
if ! ssh "$SSH_USER@$SSH_HOST" "[ -d $DEPLOY_PATH/backups/$BACKUP_DIR ]"; then
    log_error "Backup not found: $BACKUP_DIR"
    exit 1
fi
log_success "Backup verified: $BACKUP_DIR"

# Perform rollback
log_info "Starting rollback to $BACKUP_DIR..."

ssh "$SSH_USER@$SSH_HOST" << EOF
    cd $DEPLOY_PATH

    # Stop all services
    echo "Stopping services..."
    docker compose -f docker-compose.prod.yml down

    # Restore database
    echo "Restoring database from backup..."
    docker compose -f docker-compose.prod.yml up -d postgres redis minio
    sleep 10

    # Drop existing database and restore
    docker compose -f docker-compose.prod.yml exec -T postgres \
        dropdb -U \$DB_USERNAME --if-exists \$DB_NAME
    docker compose -f docker-compose.prod.yml exec -T postgres \
        createdb -U \$DB_USERNAME \$DB_NAME
    cat backups/$BACKUP_DIR/database.sql | \
        docker compose -f docker-compose.prod.yml exec -T postgres \
        psql -U \$DB_USERNAME \$DB_NAME

    # Restore environment file if exists
    if [ -f backups/$BACKUP_DIR/.env.production ]; then
        echo "Restoring environment configuration..."
        cp backups/$BACKUP_DIR/.env.production .env
    fi

    # Restart all services
    echo "Starting all services..."
    docker compose -f docker-compose.prod.yml up -d

    # Wait for services to be healthy
    sleep 30

    echo "Services status:"
    docker compose -f docker-compose.prod.yml ps
EOF

log_success "Rollback completed"

# Run health checks
log_info "Running health checks..."
FRONTEND_URL="http://$SSH_HOST"
BACKEND_URL="http://$SSH_HOST/api"

sleep 10

# Check backend health
if curl -f -s "$BACKEND_URL/actuator/health" > /dev/null; then
    log_success "Backend is healthy"
else
    log_error "Backend health check failed!"
fi

# Check frontend health
if curl -f -s "$FRONTEND_URL/health" > /dev/null; then
    log_success "Frontend is healthy"
else
    log_error "Frontend health check failed!"
fi

# Show rollback summary
echo ""
echo "============================================================"
log_success "Rollback to $BACKUP_DIR completed!"
echo "============================================================"
echo "Environment: $ENVIRONMENT"
echo "Backup: $BACKUP_DIR"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend API: $BACKEND_URL"
echo "============================================================"