#!/bin/bash
# ============================================================
# GrowManager Health Check Script
# ============================================================
# Checks the health of all GrowManager services
# Usage: ./health-check.sh [staging|production]
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
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_service() {
    local url=$1
    local name=$2
    local timeout=${3:-10}

    if curl -f -s -m "$timeout" "$url" > /dev/null 2>&1; then
        log_success "$name is healthy"
        return 0
    else
        log_error "$name is unhealthy or unreachable"
        return 1
    fi
}

check_docker_service() {
    local service=$1
    local ssh_cmd=$2

    if $ssh_cmd "docker compose -f docker-compose.prod.yml ps $service | grep -q 'Up'"; then
        log_success "$service container is running"
        return 0
    else
        log_error "$service container is not running"
        return 1
    fi
}

# Check arguments
ENVIRONMENT=${1:-staging}

if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "Usage: $0 [staging|production]"
    exit 1
fi

# Load environment-specific configuration
if [ "$ENVIRONMENT" == "production" ]; then
    SSH_HOST="${PRODUCTION_SSH_HOST}"
    SSH_USER="${PRODUCTION_SSH_USER}"
    DEPLOY_PATH="${PRODUCTION_DEPLOY_PATH}"
    BASE_URL="${PRODUCTION_URL:-http://$SSH_HOST}"
else
    SSH_HOST="${STAGING_SSH_HOST}"
    SSH_USER="${STAGING_SSH_USER}"
    DEPLOY_PATH="${STAGING_DEPLOY_PATH}"
    BASE_URL="${STAGING_URL:-http://$SSH_HOST}"
fi

# Verify environment variables
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ]; then
    log_error "Missing required environment variables!"
    exit 1
fi

SSH_CMD="ssh $SSH_USER@$SSH_HOST cd $DEPLOY_PATH &&"

echo "============================================================"
echo "GrowManager Health Check - $ENVIRONMENT"
echo "============================================================"
echo ""

# Check SSH connectivity
log_info "Checking SSH connectivity..."
if ssh -o ConnectTimeout=5 "$SSH_USER@$SSH_HOST" "echo 'OK'" > /dev/null 2>&1; then
    log_success "SSH connection successful"
else
    log_error "Cannot connect via SSH"
    exit 1
fi

echo ""
log_info "Checking Docker containers..."

# Check Docker containers
check_docker_service "frontend" "$SSH_CMD"
check_docker_service "backend" "$SSH_CMD"
check_docker_service "postgres" "$SSH_CMD"
check_docker_service "redis" "$SSH_CMD"
check_docker_service "minio" "$SSH_CMD"

echo ""
log_info "Checking HTTP endpoints..."

# Check HTTP endpoints
check_service "$BASE_URL/health" "Frontend"
check_service "$BASE_URL/api/actuator/health" "Backend API"
check_service "$BASE_URL/storage/growmanager/" "MinIO Storage" 30

echo ""
log_info "Checking backend metrics..."

# Get backend health details
BACKEND_HEALTH=$(curl -s "$BASE_URL/api/actuator/health" 2>/dev/null)
if [ -n "$BACKEND_HEALTH" ]; then
    echo "$BACKEND_HEALTH" | grep -q '"status":"UP"' && log_success "Backend status: UP" || log_error "Backend status: DOWN"
else
    log_error "Cannot retrieve backend health"
fi

echo ""
log_info "Checking database connectivity..."

# Check database via backend
ssh "$SSH_USER@$SSH_HOST" << EOF > /dev/null 2>&1
    cd $DEPLOY_PATH
    docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U \$DB_USERNAME
EOF

if [ $? -eq 0 ]; then
    log_success "PostgreSQL is accepting connections"
else
    log_error "PostgreSQL is not responding"
fi

echo ""
log_info "Checking Redis connectivity..."

# Check Redis
ssh "$SSH_USER@$SSH_HOST" << EOF > /dev/null 2>&1
    cd $DEPLOY_PATH
    docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping
EOF

if [ $? -eq 0 ]; then
    log_success "Redis is responding"
else
    log_error "Redis is not responding"
fi

echo ""
log_info "Container resource usage..."

# Show container stats
ssh "$SSH_USER@$SSH_HOST" << EOF
    cd $DEPLOY_PATH
    docker compose -f docker-compose.prod.yml ps
    echo ""
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        \$(docker compose -f docker-compose.prod.yml ps -q)
EOF

echo ""
log_info "Recent container logs (errors only)..."

# Check for recent errors in logs
ssh "$SSH_USER@$SSH_HOST" << EOF
    cd $DEPLOY_PATH
    echo "Backend errors (last 10):"
    docker compose -f docker-compose.prod.yml logs --tail=100 backend 2>&1 | grep -i error | tail -10 || echo "No errors found"
    echo ""
    echo "Frontend errors (last 10):"
    docker compose -f docker-compose.prod.yml logs --tail=100 frontend 2>&1 | grep -i error | tail -10 || echo "No errors found"
EOF

echo ""
echo "============================================================"
echo "Health Check Complete"
echo "============================================================"