# 🧪 Smoke Tests - Quick Start Guide

This guide explains how to run smoke tests to verify that the Nursery Management System is working correctly after deployment.

## What are Smoke Tests?

Smoke tests are quick, automated checks that verify the core functionality of the application:
- ✅ Services are running and healthy
- ✅ API endpoints respond correctly
- ✅ Database connectivity works
- ✅ UTF-8/Arabic text renders properly
- ✅ Authentication works
- ✅ Frontend-backend integration works

## Running Smoke Tests

### Prerequisites
- Docker and Docker Compose installed
- System is running (`make up`)

### Run All Smoke Tests

```bash
make smoke
```

Or directly:

```bash
bash ./scripts/smoke.sh
```

## What Gets Tested

### 1. Backend Health Check
- **Endpoint**: `GET http://localhost:8000/health`
- **Expected**: HTTP 200 with JSON response
- **Checks**: Backend API is responding

### 2. Frontend Health Check
- **Endpoint**: `GET http://localhost:4173/health`
- **Expected**: HTTP 200
- **Checks**: Frontend nginx is serving

### 3. API Proxy
- **Endpoint**: `GET http://localhost:4173/api/health`
- **Expected**: HTTP 200
- **Checks**: Nginx correctly proxies `/api/*` to backend

### 4. Governorates API
- **Endpoint**: `GET http://localhost:8000/admin/settings/governorates`
- **Expected**: JSON with ≥12 governorates
- **Checks**: Database is seeded, API returns data

### 5. UTF-8 Encoding
- **Test**: Fetch Arabic governorate names
- **Expected**: Valid Arabic characters (ء-ي range)
- **Checks**: No mojibake, proper UTF-8 encoding

### 6. Database Connectivity
- **Command**: `pg_isready` in database container
- **Expected**: "accepting connections"
- **Checks**: PostgreSQL is running and accessible

### 7. Redis Connectivity
- **Command**: `redis-cli ping`
- **Expected**: "PONG"
- **Checks**: Redis is running and accepts commands

### 8. Admin User Seeded
- **Endpoint**: `POST http://localhost:8000/auth/login`
- **Credentials**: admin@nursery.local / Admin123!
- **Expected**: HTTP 200 with access_token
- **Checks**: Default admin user exists and can login

### 9. CORS Headers
- **Test**: Check response headers
- **Expected**: Access-Control-Allow-Origin present
- **Checks**: CORS is configured

### 10. Container Health
- **Command**: `docker compose ps`
- **Expected**: All containers marked as "healthy"
- **Checks**: Docker healthchecks pass

## Expected Output

```
════════════════════════════════════════
 Nursery System - Smoke Tests
════════════════════════════════════════

1. Backend health check... ✓ PASS (HTTP 200)
2. Frontend health check... ✓ PASS (HTTP 200)
3. API proxy (/api/health)... ✓ PASS (HTTP 200)
4. Governorates API... ✓ PASS (12 governorates)
5. UTF-8 encoding (Arabic)... ✓ PASS (Arabic: عمان)
6. Database connectivity... ✓ PASS
7. Redis connectivity... ✓ PASS
8. Admin user seeded... ✓ PASS (Token: eyJhbGciOiJIUzI1NiIs...)
9. CORS headers present... ✓ PASS
10. All containers healthy... ✓ PASS

════════════════════════════════════════
 All Smoke Tests Passed! ✓
════════════════════════════════════════

System is ready for development!

Access points:
  • Frontend: http://localhost:4173
  • Backend:  http://localhost:8000
  • Adminer:  http://localhost:8080

Admin credentials:
  • Email: admin@nursery.local
  • Password: Admin123!
```

## Troubleshooting

### Test 1-3 Fail: Service Not Responding
```bash
# Check if containers are running
docker compose ps

# Check logs
docker compose logs backend
docker compose logs frontend

# Restart services
make restart
```

### Test 4-5 Fail: Database/API Issues
```bash
# Check database logs
docker compose logs db

# Re-run migrations and seeds
make migrate
make seed

# Check database directly
make db-shell
# Then in psql:
SELECT * FROM governorates;
```

### Test 6 Fail: Database Not Ready
```bash
# Check database status
docker compose exec db pg_isready -U nursery_user -d nursery_db

# Restart database
docker compose restart db
sleep 10
make health
```

### Test 7 Fail: Redis Not Ready
```bash
# Check Redis
docker compose exec redis redis-cli -a redis_password123 ping

# Restart Redis
docker compose restart redis
```

### Test 8 Fail: Admin Login Failed
```bash
# Re-seed database
make seed

# Check if admin exists
make db-shell
# In psql:
SELECT email, role, is_active FROM users WHERE role = 'ADMIN';
```

### All Tests Fail
```bash
# Nuclear option: rebuild everything
make nuke
make build
make up
sleep 30
make smoke
```

## Manual Smoke Tests

If automated tests fail, you can manually verify:

```bash
# 1. Backend health
curl http://localhost:8000/health

# 2. Frontend
curl http://localhost:4173/

# 3. API proxy
curl http://localhost:4173/api/health

# 4. Governorates (with Arabic)
curl http://localhost:8000/admin/settings/governorates | jq '.governorates[0]'

# 5. Login
curl -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@nursery.local","password":"Admin123!"}'

# 6. Database
docker compose exec db psql -U nursery_user -d nursery_db -c "SELECT COUNT(*) FROM governorates;"

# 7. Redis
docker compose exec redis redis-cli -a redis_password123 ping
```

## Integration with CI/CD

In CI pipelines, smoke tests verify deployment:

```yaml
# .github/workflows/deploy.yml
- name: Run smoke tests
  run: |
    make smoke
  timeout-minutes: 5
```

Exit code:
- **0**: All tests passed ✅
- **1**: At least one test failed ❌

## Performance Benchmarks

Expected response times (local Docker):
- Backend health: < 50ms
- Frontend health: < 10ms
- API proxy: < 100ms
- Governorates API: < 200ms
- Login: < 500ms

If response times are significantly slower, check:
1. Docker resource allocation (CPU/Memory)
2. Database connection pool settings
3. Container logs for errors

## See Also
- [RUNBOOK.md](./RUNBOOK.md) - Troubleshooting guide
- [Makefile](./Makefile) - All available commands
- [README.md](./README.md) - Complete documentation
