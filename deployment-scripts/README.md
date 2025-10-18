# GrowManager Deployment Scripts

This directory contains helper scripts for deploying GrowManager to staging and production environments.

## Scripts Overview

- **deploy.sh** - Deploy or update GrowManager to staging or production
- **rollback.sh** - Rollback to a previous database backup
- **health-check.sh** - Check health and status of all services

## Prerequisites

### Local Machine

Set up environment variables in `~/.bashrc` or `~/.zshrc`:

```bash
# Production environment
export PRODUCTION_SSH_HOST="your-server.com"
export PRODUCTION_SSH_USER="ubuntu"
export PRODUCTION_DEPLOY_PATH="/home/ubuntu/growmanager"
export PRODUCTION_URL="https://growmanager.yourdomain.com"

# Staging environment
export STAGING_SSH_HOST="staging-server.com"
export STAGING_SSH_USER="ubuntu"
export STAGING_DEPLOY_PATH="/home/ubuntu/growmanager"
export STAGING_URL="https://staging.yourdomain.com"
```

Then reload your shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Remote Server

1. **SSH access** configured with public key authentication
2. **Docker and Docker Compose** installed
3. **Git** installed
4. **GrowManager repository** cloned to deploy path
5. **Environment file** (`.env.production`) configured with all required variables

## Usage

### Deploy Script

Deploy or update GrowManager to an environment:

```bash
./deploy.sh [staging|production]
```

**Examples:**
```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production
```

**What it does:**
1. Verifies SSH connection to server
2. Creates database backup (production only)
3. Pulls latest code from Git repository
4. Builds Docker images
5. Deploys containers
6. Waits for services to be healthy
7. Runs health checks
8. Cleans up old Docker images
9. Displays deployment summary

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

### Rollback Script

Rollback to a previous database backup:

```bash
./rollback.sh [staging|production] [backup-name]
```

**Examples:**
```bash
# Rollback production (interactive - will prompt for backup)
./rollback.sh production

# Rollback to latest backup
./rollback.sh production latest

# Rollback to specific backup
./rollback.sh production 20241017_143000
```

**What it does:**
1. Lists available backups (if no backup specified)
2. Prompts for confirmation
3. Stops all services
4. Restores database from selected backup
5. Restores environment configuration (if exists)
6. Restarts all services
7. Runs health checks

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

### Health Check Script

Check the health of all GrowManager services:

```bash
./health-check.sh [staging|production]
```

**Examples:**
```bash
# Check production health
./health-check.sh production

# Check staging health
./health-check.sh staging
```

**What it checks:**
- SSH connectivity
- Docker container status (frontend, backend, postgres, redis, minio)
- HTTP endpoints (frontend, backend API, MinIO)
- Database connectivity (PostgreSQL)
- Redis connectivity
- Container resource usage (CPU, memory)
- Recent error logs from containers

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

[INFO] Container resource usage...
NAME                       CPU %     MEM USAGE
growmanager-frontend       0.12%     45MiB / 8GiB
growmanager-backend        2.45%     512MiB / 8GiB
growmanager-postgres       0.89%     256MiB / 8GiB
growmanager-redis          0.05%     12MiB / 8GiB
growmanager-minio          0.34%     128MiB / 8GiB
```

## Troubleshooting

### SSH Connection Fails

**Problem:**
```
[ERROR] Cannot connect via SSH
```

**Solutions:**
1. Verify environment variables are set:
   ```bash
   echo $PRODUCTION_SSH_HOST
   echo $PRODUCTION_SSH_USER
   ```

2. Test SSH connection manually:
   ```bash
   ssh $PRODUCTION_SSH_USER@$PRODUCTION_SSH_HOST "echo 'OK'"
   ```

3. Check SSH key is added:
   ```bash
   ssh-add -l
   ```

4. Verify SSH key permissions:
   ```bash
   chmod 600 ~/.ssh/id_rsa
   ```

### Deployment Fails

**Problem:**
```
[ERROR] Deployment failed
```

**Solutions:**
1. Check Docker logs on server:
   ```bash
   ssh user@server "cd /path/to/growmanager && docker compose -f docker-compose.prod.yml logs"
   ```

2. Verify `.env.production` file exists and is configured correctly

3. Check disk space:
   ```bash
   ssh user@server "df -h"
   ```

4. Check Docker service is running:
   ```bash
   ssh user@server "docker --version && docker compose version"
   ```

### Rollback Fails

**Problem:**
```
[ERROR] No backups found for rollback
```

**Solutions:**
1. Verify backups directory exists:
   ```bash
   ssh user@server "ls -la /path/to/growmanager/backups/"
   ```

2. Check if backups are being created during deployments

3. Manually create backup:
   ```bash
   ssh user@server "cd /path/to/growmanager && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U growmanager growmanager > backups/manual-backup.sql"
   ```

### Health Check Shows Services Down

**Problem:**
```
[✗] backend container is not running
```

**Solutions:**
1. Check why container stopped:
   ```bash
   ssh user@server "cd /path/to/growmanager && docker compose -f docker-compose.prod.yml ps"
   ssh user@server "cd /path/to/growmanager && docker compose -f docker-compose.prod.yml logs backend"
   ```

2. Restart services:
   ```bash
   ssh user@server "cd /path/to/growmanager && docker compose -f docker-compose.prod.yml up -d"
   ```

3. Check for resource issues:
   ```bash
   ssh user@server "docker stats --no-stream"
   ```

## Security Notes

- **Never commit** these scripts with hardcoded credentials
- **Use SSH keys** instead of password authentication
- **Restrict SSH access** to specific IP addresses if possible
- **Review logs** after each deployment
- **Test rollback** procedure in staging before production
- **Keep backups** for at least 7-30 days

## Best Practices

1. **Always deploy to staging first** before production
2. **Run health checks** after every deployment
3. **Create manual backup** before major changes
4. **Monitor logs** during and after deployment
5. **Test rollback** procedure periodically
6. **Document custom changes** to deployment process
7. **Use version tags** for deployments
8. **Keep deployment scripts** in version control

## Advanced Usage

### Custom Deployment Path

Override the default deploy path:

```bash
PRODUCTION_DEPLOY_PATH="/custom/path" ./deploy.sh production
```

### Skip Health Checks

Modify the deploy script to skip health checks (not recommended):

```bash
# Comment out health check section in deploy.sh
# [INFO] Running health checks...
# curl -f "$BACKEND_URL/actuator/health" > /dev/null
```

### Custom Backup Location

Modify the rollback script to use a custom backup location:

```bash
BACKUP_DIR="/custom/backup/path"
./rollback.sh production
```

## Support

For detailed deployment documentation, see `/DEPLOYMENT.md` in the repository root.

For issues or questions:
- Check the main [DEPLOYMENT.md](../DEPLOYMENT.md) guide
- Review container logs
- Create an issue in the GitHub repository
- Contact the development team