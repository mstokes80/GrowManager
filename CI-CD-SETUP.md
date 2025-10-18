# GrowManager CI/CD Setup Summary

This document summarizes the CI/CD deployment pipeline implementation for GrowManager.

## Overview

A complete CI/CD deployment pipeline has been implemented with:
- GitHub Actions workflows for automated deployment
- Docker image building and publishing to GitHub Container Registry (GHCR)
- Automated deployment to staging on push to `main`
- Manual deployment to production with approval gates
- Helper scripts for manual deployment and operations
- Comprehensive health checks and rollback capabilities

## Files Created

### GitHub Actions Workflows

**`.github/workflows/deploy.yml`** - Main deployment workflow
- Automated deployment on push to `main` → staging
- Manual deployment to staging or production
- Docker image building and pushing to GHCR
- Zero-downtime deployment strategy
- Automatic database backups (production)
- Health checks and smoke tests
- Rollback capability

### Deployment Scripts

Located in `deployment-scripts/`:

**`deploy.sh`** - Deploy to staging or production
- SSH connection verification
- Automated database backup (production only)
- Code update from Git
- Docker image building
- Service deployment
- Health checks
- Cleanup old images

**`rollback.sh`** - Rollback to previous backup
- List available backups
- Interactive or automated selection
- Database restoration
- Service restart
- Health verification

**`health-check.sh`** - Comprehensive health checking
- SSH connectivity
- Docker container status
- HTTP endpoint checks
- Database connectivity
- Redis connectivity
- Resource usage monitoring
- Error log review

**`README.md`** - Documentation for deployment scripts

### Documentation

**`DEPLOYMENT.md`** (updated) - Complete deployment guide
- GitHub Actions CI/CD setup instructions
- Manual deployment procedures
- Environment configuration
- Health checks
- Rollback procedures
- Troubleshooting guide

**`CI-CD-SETUP.md`** (this file) - CI/CD implementation summary

## GitHub Actions Setup

### Required Secrets

Configure in GitHub Repository Settings → Secrets and variables → Actions:

**Staging:**
- `STAGING_SSH_HOST`
- `STAGING_SSH_USER`
- `STAGING_SSH_PRIVATE_KEY`

**Production:**
- `PRODUCTION_SSH_HOST`
- `PRODUCTION_SSH_USER`
- `PRODUCTION_SSH_PRIVATE_KEY`

### Required Variables

Configure in GitHub Repository Settings → Secrets and variables → Actions → Variables:

**Staging:**
- `STAGING_URL` (e.g., https://staging.yourdomain.com)
- `STAGING_DEPLOY_PATH` (e.g., /home/user/growmanager)

**Production:**
- `PRODUCTION_URL` (e.g., https://yourdomain.com)
- `PRODUCTION_DEPLOY_PATH` (e.g., /home/user/growmanager)

### Required Environments

Create in GitHub Repository Settings → Environments:

1. **staging** - No restrictions
2. **production** - Enable "Required reviewers" for manual approval

## Deployment Workflow

### Automatic Deployment (Staging)

```
Push to main branch
    ↓
Run backend tests
    ↓
Run frontend tests
    ↓
Build backend Docker image → Push to GHCR
    ↓
Build frontend Docker image → Push to GHCR
    ↓
Deploy to staging server
    ↓
Run smoke tests
    ↓
✓ Complete
```

### Manual Deployment (Production)

```
Trigger workflow manually (Actions tab)
    ↓
Select "production" environment
    ↓
Run all tests
    ↓
Build Docker images → Push to GHCR
    ↓
Deploy to staging (if enabled)
    ↓
Wait for manual approval
    ↓
Create database backup
    ↓
Deploy to production server
    ↓
Run smoke tests
    ↓
Clean up old images
    ↓
✓ Complete
```

## Manual Deployment Process

For environments without GitHub Actions:

```bash
# 1. Set up environment variables (one-time)
export PRODUCTION_SSH_HOST="your-server.com"
export PRODUCTION_SSH_USER="ubuntu"
export PRODUCTION_DEPLOY_PATH="/home/ubuntu/growmanager"

# 2. Deploy to production
cd deployment-scripts
./deploy.sh production

# 3. Verify deployment
./health-check.sh production

# 4. If issues occur, rollback
./rollback.sh production latest
```

## Features

### Zero-Downtime Deployment

Services are updated individually:
1. Backend updated first → wait for health check (30s)
2. Frontend updated next → wait for health check (10s)
3. Other services remain running throughout

### Automatic Backups

Production deployments automatically:
- Backup PostgreSQL database to `backups/YYYYMMDD_HHMMSS/`
- Retain last 7 days of backups
- Include environment configuration

### Health Checks

After every deployment:
- Backend: `/api/actuator/health` → 200 OK
- Frontend: `/health` → 200 OK
- Auth endpoint: Accepts requests
- Database: `pg_isready` → success
- Redis: `ping` → PONG

### Rollback Strategy

1. **Automated rollback**: Re-run previous successful workflow
2. **Script rollback**: Use `rollback.sh` to restore from backup
3. **Manual rollback**: Follow manual steps in DEPLOYMENT.md

### Docker Registry

Images pushed to GitHub Container Registry (GHCR):
- `ghcr.io/OWNER/REPO/backend:latest`
- `ghcr.io/OWNER/REPO/backend:main-SHA`
- `ghcr.io/OWNER/REPO/frontend:latest`
- `ghcr.io/OWNER/REPO/frontend:main-SHA`

## Testing the Pipeline

### 1. Test GitHub Actions Workflow

```bash
# Create a test branch
git checkout -b test-deployment

# Make a trivial change
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: deployment pipeline"

# Push to trigger workflow (if configured for all branches)
git push origin test-deployment

# Or merge to main for staging deployment
git checkout main
git merge test-deployment
git push origin main
```

### 2. Test Manual Deployment Scripts

```bash
# Test health check first
cd deployment-scripts
./health-check.sh staging

# Test deployment to staging
./deploy.sh staging

# Verify deployment
./health-check.sh staging

# Test rollback (optional)
./rollback.sh staging latest
```

### 3. Test Production Deployment

```bash
# Via GitHub Actions (recommended)
1. Go to Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Choose "production"
5. Approve when prompted

# Via scripts (if GitHub Actions unavailable)
cd deployment-scripts
./deploy.sh production
./health-check.sh production
```

## Monitoring Deployments

### GitHub Actions

- **View workflow runs**: Actions tab → Select workflow
- **View logs**: Click on workflow run → View step details
- **Re-run failed workflows**: Click "Re-run all jobs"

### Server Monitoring

```bash
# SSH into server
ssh user@server

# Check service status
cd /home/user/growmanager
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats
```

## Troubleshooting

### Workflow Fails at Tests

**Issue**: Tests fail before deployment

**Solution**:
1. Review test logs in workflow output
2. Fix failing tests locally
3. Push fix and re-run workflow

### Workflow Fails at Docker Build

**Issue**: Docker image build fails

**Solution**:
1. Check Dockerfile syntax
2. Verify all dependencies are available
3. Test build locally: `docker build -t test .`

### Workflow Fails at Deployment

**Issue**: Deployment to server fails

**Solution**:
1. Verify SSH secrets are configured correctly
2. Test SSH connection manually
3. Check server has enough disk space
4. Verify Docker is running on server

### Deployment Script Fails

**Issue**: `deploy.sh` reports errors

**Solution**:
1. Check environment variables are set
2. Verify SSH connection works
3. Check server logs: `docker compose logs`
4. Try health check: `./health-check.sh production`

## Security Considerations

- [ ] SSH keys are used (not passwords)
- [ ] SSH private keys are stored in GitHub Secrets (not in code)
- [ ] Production environment requires manual approval
- [ ] Database backups are created before production deployments
- [ ] Sensitive environment variables are not logged
- [ ] GHCR images are private (or public if intended)
- [ ] Server firewall only allows necessary ports (80, 443, 22)
- [ ] Deployment scripts validate inputs

## Maintenance

### Update Deployment Scripts

```bash
# Edit scripts
nano deployment-scripts/deploy.sh

# Test changes in staging
./deployment-scripts/deploy.sh staging

# Commit and push
git add deployment-scripts/
git commit -m "update: deployment scripts"
git push origin main
```

### Update GitHub Actions Workflow

```bash
# Edit workflow
nano .github/workflows/deploy.yml

# Test in a feature branch first
git checkout -b update-workflow
git add .github/workflows/deploy.yml
git commit -m "update: deployment workflow"
git push origin update-workflow

# Merge after verification
git checkout main
git merge update-workflow
git push origin main
```

### Clean Up Old Backups

Automatic cleanup keeps last 7 days. For manual cleanup:

```bash
ssh user@server "cd /home/user/growmanager && find backups/ -type d -mtime +30 -exec rm -rf {} +"
```

### Clean Up Old Docker Images

```bash
ssh user@server "docker image prune -a -f"
```

## Best Practices

1. **Always deploy to staging first**
2. **Test in staging before production**
3. **Use manual approval for production**
4. **Monitor logs during deployment**
5. **Run health checks after deployment**
6. **Keep backups for 7-30 days**
7. **Document custom changes**
8. **Review deployment logs weekly**
9. **Test rollback procedure monthly**
10. **Update documentation as needed**

## Next Steps

### Recommended Enhancements

1. **Monitoring & Alerting**
   - Set up Prometheus + Grafana for metrics
   - Configure alerting for service downtime
   - Add log aggregation (ELK stack or similar)

2. **Advanced Deployment Strategies**
   - Implement blue-green deployment
   - Add canary deployment option
   - Set up A/B testing infrastructure

3. **Automated Testing**
   - Add integration tests to workflow
   - Implement end-to-end tests with Playwright
   - Add load testing before production

4. **Security Hardening**
   - Add SAST (Static Application Security Testing)
   - Implement dependency scanning
   - Add container vulnerability scanning

5. **Performance Optimization**
   - Add CDN for static assets
   - Implement Redis caching strategy
   - Optimize Docker image sizes

6. **Disaster Recovery**
   - Automate backup to S3/cloud storage
   - Document disaster recovery procedures
   - Test recovery process quarterly

## Support

For detailed information:
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Script Usage**: See [deployment-scripts/README.md](deployment-scripts/README.md)
- **GitHub Actions**: See [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

For issues:
- Create an issue in GitHub repository
- Check troubleshooting section in DEPLOYMENT.md
- Review workflow logs in Actions tab
- Contact development team

---

**Implementation Date**: 2025-10-17
**Implemented By**: Claude Code
**Status**: Complete and Ready for Use