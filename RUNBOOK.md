# 📘 Runbook - Operational Guide

Complete operational guide for running, troubleshooting, and maintaining the Nursery Management System.

## Table of Contents
- [Quick Reference](#quick-reference)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)
- [Database Operations](#database-operations)
- [Backup & Recovery](#backup--recovery)
- [Performance Tuning](#performance-tuning)
- [Security](#security)

## Quick Reference

### Essential Commands

```bash
# Start system
make up

# Stop system
make down

# View logs
make logs

# Run tests
make test

# Health check
make health

# Smoke tests
make smoke

# Database shell
make db-shell

# Backend shell
make backend-shell
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:4173 | Web application |
| Backend API | http://localhost:8000 | REST API |
| API Docs | http://localhost:8000/docs | Swagger/OpenAPI |
| Adminer | http://localhost:8080 | Database GUI |
| Health Check | http://localhost:8000/health | Service status |

### Default Credentials

**Admin User**:
- Email: `admin@nursery.local`
- Password: `Admin123!`

**Database**:
- User: `nursery_user`
- Password: `nursery_password123`
- Database: `nursery_db`

**Redis**:
- Password: `redis_password123`

## Common Operations

### First-Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd nursy

# 2. Create environment file
cp .env.docker .env

# 3. Run complete setup
make dev-setup

# This will:
# - Build Docker images
# - Start all services
# - Run migrations
# - Seed database
# - Run health checks
```

### Daily Development Workflow

```bash
# Start services
make up

# View logs (follow mode)
make logs

# Make code changes...
# (hot reload enabled for both frontend and backend)

# Run tests
make test

# Stop services
make down
```

### Updating Dependencies

**Backend (Python)**:
```bash
# Edit requirements.txt
vim nursery-system/backend/requirements.txt

# Rebuild backend
docker compose build backend

# Restart
make restart
```

**Frontend (Node)**:
```bash
# Edit package.json
vim nursery-system/frontend/package.json

# Rebuild frontend
docker compose build frontend

# Restart
make restart
```

## Troubleshooting

### Port Already in Use

**Symptom**: `Bind for 0.0.0.0:4173 failed: port is already allocated`

**Solution**:
```bash
# Find process using port
netstat -ano | findstr :4173  # Windows
lsof -i :4173  # Linux/Mac

# Kill process or change port in .env
# Edit .env:
FRONTEND_PORT=4174

# Restart
make restart
```

### Containers Won't Start

**Symptom**: Container exits immediately

**Solution**:
```bash
# Check logs
docker compose logs <service-name>

# Common issues:
# 1. Missing environment variables - check .env
# 2. Port conflicts - change ports in .env
# 3. Permission issues - check file ownership

# Try rebuilding
make build
make up
```

### Database Connection Failed

**Symptom**: `could not connect to server: Connection refused`

**Solution**:
```bash
# Check if database is running
docker compose ps db

# Check database logs
docker compose logs db

# Wait for database to be ready
docker compose exec backend bash -c 'until pg_isready -h db -U nursery_user; do sleep 1; done'

# Restart database
docker compose restart db
```

### Migration Errors

**Symptom**: `relation "users" does not exist`

**Solution**:
```bash
# Re-run migrations
make migrate

# If that fails, reset database (DANGER: deletes data)
make db-reset
```

### Out of Memory

**Symptom**: Containers keep restarting, `OOMKilled` in logs

**Solution**:
```bash
# Check Docker resources
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings -> Resources -> Memory (recommend 4GB+)

# Reduce worker count in docker-compose.yml
# backend -> command: change --workers 2 to --workers 1
```

### Slow Performance

**Symptoms**: Slow API responses, timeouts

**Diagnosis**:
```bash
# Check container resource usage
docker stats

# Check database connections
make db-shell
SELECT count(*) FROM pg_stat_activity;

# Check logs for slow queries
docker compose logs backend | grep "slow"
```

**Solutions**:
- Increase Docker resources
- Add database indexes
- Enable Redis caching
- Optimize database queries

### UTF-8/Arabic Text Issues

**Symptom**: Arabic text shows as ????????? or ØØØ

**Solution**:
```bash
# Verify database encoding
make db-shell
# In psql:
\l
# Should show: Encoding = UTF8

# Check API response headers
curl -I http://localhost:8000/health
# Should include: Content-Type: application/json; charset=utf-8

# If still broken, rebuild images
make build
make up
```

### Cannot Access Frontend

**Symptom**: `ERR_CONNECTION_REFUSED` on http://localhost:4173

**Solution**:
```bash
# Check if frontend is running
docker compose ps frontend

# Check nginx logs
docker compose logs frontend

# Check if port is exposed
docker compose port frontend 80

# Try accessing directly
curl http://localhost:4173

# Restart frontend
docker compose restart frontend
```

## Database Operations

### Accessing Database

```bash
# Via Adminer (GUI)
open http://localhost:8080
# System: PostgreSQL
# Server: db
# Username: nursery_user
# Password: nursery_password123
# Database: nursery_db

# Via psql (CLI)
make db-shell

# Or directly:
docker compose exec db psql -U nursery_user -d nursery_db
```

### Common Queries

```sql
-- Check governorates
SELECT * FROM governorates ORDER BY name_ar;

-- Check users
SELECT id, email, role, is_active FROM users;

-- Check nurseries
SELECT id, name, governorate_id, is_active FROM nurseries;

-- Check branches
SELECT b.id, b.name, n.name as nursery_name 
FROM branches b 
JOIN nurseries n ON b.nursery_id = n.id;

-- User statistics
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
```

### Manual Migration

```bash
# Create migration file
vim nursery-system/backend/migrations/add_some_feature.sql

# Run migration
docker compose exec backend python -c "
from app.database import engine
with open('/app/migrations/add_some_feature.sql') as f:
    sql = f.read()
with engine.connect() as conn:
    conn.execute(sql)
    conn.commit()
"
```

### Database Backup

```bash
# Backup database
docker compose exec db pg_dump -U nursery_user nursery_db > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T db psql -U nursery_user nursery_db < backup_20250105.sql
```

### Reset Database

```bash
# Option 1: Drop and recreate (keeps container)
make db-shell
DROP DATABASE nursery_db;
CREATE DATABASE nursery_db WITH ENCODING 'UTF8';
\q
make migrate
make seed

# Option 2: Nuke everything (deletes volumes)
make nuke
make up
```

## Backup & Recovery

### Automated Backups

Backups are stored in `./backups/` directory.

```bash
# Manual backup
docker compose exec db pg_dump -U nursery_user -F c -f /backups/manual_backup.dump nursery_db

# List backups
ls -lh backups/

# Restore from backup
docker compose exec db pg_restore -U nursery_user -d nursery_db -c /backups/manual_backup.dump
```

### Volume Backup

```bash
# Backup database volume
docker run --rm \
  -v nursy_db_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db_volume_$(date +%Y%m%d).tar.gz -C /data .

# Restore database volume
docker run --rm \
  -v nursy_db_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/db_volume_20250105.tar.gz -C /data
```

### Disaster Recovery

```bash
# 1. Stop system
make down

# 2. Restore database volume (if needed)
# (see Volume Backup above)

# 3. Start system
make up

# 4. Verify data
make db-shell
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM nurseries;

# 5. Run smoke tests
make smoke
```

## Performance Tuning

### Database Optimization

```sql
-- Add indexes
CREATE INDEX CONCURRENTLY idx_users_email_normalized ON users(email_normalized);
CREATE INDEX CONCURRENTLY idx_nurseries_governorate ON nurseries(governorate_id);
CREATE INDEX CONCURRENTLY idx_branches_nursery ON branches(nursery_id);

-- Analyze tables
ANALYZE users;
ANALYZE nurseries;
ANALYZE branches;

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Container Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Redis Caching

```bash
# Check Redis stats
docker compose exec redis redis-cli -a redis_password123 INFO stats

# Clear cache
docker compose exec redis redis-cli -a redis_password123 FLUSHDB
```

## Security

### Changing Admin Password

```bash
make db-shell
# In psql:
UPDATE users 
SET hashed_password = crypt('NewPassword123!', gen_salt('bf', 12)),
    must_reset_password = false
WHERE email = 'admin@nursery.local';
```

### Rotating Secrets

```bash
# 1. Generate new secrets
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Update .env
vim .env
# Change JWT_SECRET_KEY, APP_SECRET, DB_PASSWORD, REDIS_PASSWORD

# 3. Rebuild and restart
make build
make down
make up

# 4. Verify
make health
```

### Checking Logs for Security Issues

```bash
# Failed login attempts
docker compose logs backend | grep "login failed"

# Rate limit hits
docker compose logs backend | grep "rate limit"

# SQL injection attempts
docker compose logs backend | grep -i "sql"
```

## Monitoring

### Health Checks

```bash
# Quick health check
make health

# Detailed status
docker compose ps

# Container resource usage
docker stats

# Disk usage
docker system df
```

### Log Management

```bash
# Follow all logs
make logs

# Specific service
make logs-backend
make logs-frontend

# Last 100 lines
docker compose logs --tail=100

# Since timestamp
docker compose logs --since 2024-01-01T00:00:00

# Save logs to file
docker compose logs > logs_$(date +%Y%m%d).txt
```

## See Also
- [SMOKE.md](./SMOKE.md) - Smoke testing guide
- [CI.md](./CI.md) - CI/CD pipeline guide
- [README.md](./README.md) - Complete documentation
