# 🐳 Docker Local Development - Complete Setup

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [File Structure](#file-structure)
4. [Services](#services)
5. [Developer Commands](#developer-commands)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Documentation Index](#documentation-index)

---

## Overview

This Docker setup provides a **production-like local development environment** with:

- ✅ **Zero Manual Setup**: One command to start everything
- ✅ **Production Parity**: Same containers in dev and prod
- ✅ **Consistent Environment**: Works identically on Windows/Mac/Linux
- ✅ **Automated Testing**: Unit, integration, E2E tests
- ✅ **Fast Iteration**: Hot reload for code changes
- ✅ **UTF-8 Support**: Proper Arabic text handling
- ✅ **Developer Tools**: Makefile, smoke tests, health checks

---

## Quick Start

### Prerequisites

- **Docker Desktop** (20.10+): [Download](https://www.docker.com/products/docker-desktop/)
- **Make** (optional but recommended):
  - Windows: `choco install make` or use Git Bash
  - Mac: Pre-installed
  - Linux: `sudo apt install make`

### First Time Setup

```bash
# 1. Navigate to project root
cd d:\nursy

# 2. Copy environment template
cp .env.docker .env

# 3. Run complete setup (builds, starts, migrates, seeds)
make dev-setup
```

**That's it!** In ~2 minutes you'll have:
- ✅ PostgreSQL database with seeded data (12 governorates, admin user)
- ✅ Redis cache ready
- ✅ Backend API running at http://localhost:8000
- ✅ Frontend app at http://localhost:4173
- ✅ Database admin at http://localhost:8080

### Daily Workflow

```bash
# Start services (fast - uses existing builds)
make up

# View logs (all services)
make logs

# View specific service logs
make logs-backend
make logs-frontend

# Access database shell
make db-shell

# Access backend Python shell
make backend-shell

# Run tests
make test          # All tests
make test-unit     # Unit tests only
make test-int      # Integration tests
make e2e           # End-to-end tests

# Quick health check
make smoke         # Runs 10 automated checks

# Stop services
make down

# Stop and remove volumes (clean slate)
make down-volumes
```

---

## File Structure

```
d:\nursy\
├── docker-compose.yml                 # Service orchestration
├── .env.docker                        # Environment template
├── Makefile                           # Developer commands (30+ targets)
│
├── nursery-system/
│   ├── backend/
│   │   ├── Dockerfile.local           # Backend multi-stage build
│   │   ├── Dockerfile.test            # Test container
│   │   ├── docker-entrypoint.sh       # Startup script (migrate + seed)
│   │   ├── docker-test-entrypoint.sh  # Test initialization
│   │   ├── pytest.ini                 # Test configuration
│   │   ├── app/
│   │   │   ├── main.py                # FastAPI app
│   │   │   ├── database.py            # DB connection + migrations
│   │   │   └── seed.py                # Idempotent data seeding
│   │   └── tests/
│   │       ├── conftest.py            # Test fixtures
│   │       ├── test_health.py         # Health endpoint tests
│   │       ├── test_governorates.py   # Governorate API tests
│   │       ├── test_auth.py           # Authentication tests
│   │       └── test_nursery_creation.py
│   │
│   └── frontend/
│       ├── Dockerfile.local           # Frontend multi-stage build
│       ├── nginx.conf                 # Nginx + API proxy config
│       ├── vite.config.js             # Vite + vitest config
│       └── src/
│           ├── __tests__/             # Component tests (vitest)
│           └── setupTests.js          # Test setup
│
├── e2e/
│   ├── playwright.config.js           # Playwright configuration
│   ├── package.json                   # E2E dependencies
│   └── tests/
│       ├── nursery-creation.spec.js   # Full workflow tests
│       └── arabic-rendering.spec.js   # UTF-8/Arabic tests
│
├── scripts/
│   ├── smoke.sh                       # 10 automated health checks
│   └── wait-for-db.sh                 # Database readiness utility
│
└── docs/
    ├── ADR-docker-local.md            # Architecture Decision Record
    ├── SMOKE.md                       # Smoke testing guide
    ├── RUNBOOK.md                     # Operations guide
    └── CI.md                          # CI/CD integration guide
```

---

## Services

| Service   | Port | Description | Healthcheck |
|-----------|------|-------------|-------------|
| **Frontend** | 4173 | React + Vite + nginx | `curl http://localhost:4173/health` |
| **Backend**  | 8000 | FastAPI + uvicorn (2 workers) | `curl http://localhost:8000/health` |
| **Database** | 5432 | PostgreSQL 15 (UTF-8) | `pg_isready` |
| **Redis**    | 6379 | Redis 7 (cache/sessions) | `redis-cli ping` |
| **Adminer**  | 8080 | Database GUI (dev profile) | `curl http://localhost:8080` |

### Service Dependencies

```
┌─────────────────────────────────────────┐
│  Frontend (nginx :4173)                 │
│  ├─ /api/* → Backend :8000              │
│  └─ /* → React SPA                      │
└─────────────────────────────────────────┘
               ↓ depends_on (healthy)
┌─────────────────────────────────────────┐
│  Backend (FastAPI :8000)                │
│  ├─ Database connection                 │
│  └─ Redis connection                    │
└─────────────────────────────────────────┘
               ↓ depends_on (healthy)
┌──────────────────┐    ┌──────────────┐
│ PostgreSQL :5432 │    │ Redis :6379  │
│ (db_data volume) │    │ (redis_data) │
└──────────────────┘    └──────────────┘
```

---

## Developer Commands

### Essential Commands

```bash
make help          # Show all available commands
make dev-setup     # Complete first-time setup
make up            # Start services
make down          # Stop services
make logs          # View all logs
make health        # Check service health
make smoke         # Run smoke tests (10 checks)
```

### Database Commands

```bash
make migrate       # Run database migrations
make seed          # Seed data (idempotent)
make db-shell      # Open psql shell
make db-reset      # ⚠️ Drop & recreate database
```

### Testing Commands

```bash
make test          # Run backend tests (pytest)
make test-unit     # Unit tests only
make test-int      # Integration tests
make web-test      # Frontend tests (vitest)
make e2e           # End-to-end tests (Playwright)
make coverage      # Generate coverage report
```

### Debugging Commands

```bash
make backend-shell   # Open bash in backend container
make frontend-shell  # Open sh in frontend container
make logs-backend    # Backend logs only
make logs-frontend   # Frontend logs only
make logs-db         # Database logs only
```

### Cleanup Commands

```bash
make clean           # Remove stopped containers
make clean-volumes   # ⚠️ Remove volumes (deletes data)
make nuke            # ⚠️ Nuclear option (full reset)
make prune           # Clean Docker system
```

---

## Testing

### 1. Backend Tests (pytest)

```bash
# Run all backend tests
make test

# Run specific test file
docker compose exec backend pytest tests/test_health.py -v

# Run with coverage
docker compose exec backend pytest --cov=app --cov-report=html

# Run specific test
docker compose exec backend pytest tests/test_governorates.py::test_list_governorates_count
```

**Test Files:**
- `test_health.py` - Health endpoint tests
- `test_governorates.py` - Governorate API tests (UTF-8, idempotency)
- `test_auth.py` - Authentication tests
- `test_nursery_creation.py` - Nursery creation with branches

### 2. Frontend Tests (vitest)

```bash
# Run all frontend tests
make web-test

# Run in watch mode
docker compose exec frontend npm test

# Run specific test
docker compose exec frontend npm test -- UserManagement.test.jsx
```

**Test Files:**
- `Login.test.jsx` - Login component tests
- `AuthContext.test.jsx` - Auth context tests
- `UserManagement.test.jsx` - User management tests
- `TempPasswordModal.test.jsx` - Modal tests

### 3. E2E Tests (Playwright)

```bash
# Run all E2E tests
make e2e

# Run in headed mode (see browser)
cd e2e && npm run test:headed

# Run specific test
cd e2e && npm run test -- nursery-creation.spec.js

# Debug mode
cd e2e && npm run test:debug
```

**Test Files:**
- `nursery-creation.spec.js` - Full nursery creation workflow
- `arabic-rendering.spec.js` - UTF-8/Arabic rendering tests

### 4. Smoke Tests (Automated)

```bash
# Run smoke tests
make smoke

# Or directly
bash ./scripts/smoke.sh
```

**10 Checks:**
1. ✅ Backend health endpoint (HTTP 200)
2. ✅ Frontend health endpoint (HTTP 200)
3. ✅ API proxy working (/api/* → backend)
4. ✅ Governorates count (≥12 Jordan governorates)
5. ✅ UTF-8 encoding (Arabic text in response)
6. ✅ Database connectivity (pg_isready)
7. ✅ Redis connectivity (redis-cli ping)
8. ✅ Admin login (valid JWT token)
9. ✅ CORS headers present
10. ✅ Container health (all services healthy)

---

## Troubleshooting

### Common Issues

#### Port Conflicts

**Problem**: Port 4173/8000/5432 already in use

**Solution**:
```bash
# Find process using port (Windows)
netstat -ano | findstr :8000

# Find process using port (Linux/Mac)
lsof -i :8000

# Kill process or stop conflicting service
# Then restart Docker services
make down && make up
```

#### Services Won't Start

**Problem**: Container exits immediately

**Solution**:
```bash
# Check logs for errors
make logs

# View specific service logs
docker compose logs backend --tail=100

# Check service health
make health

# Try clean rebuild
make clean && make build && make up
```

#### Database Connection Failed

**Problem**: Backend can't connect to database

**Solution**:
```bash
# Check database is running
docker compose ps db

# Check database logs
make logs-db

# Wait for database to be ready
docker compose exec backend bash -c "until pg_isready -h db -U nursery_user; do sleep 1; done"

# Restart backend
docker compose restart backend
```

#### Migration Errors

**Problem**: Database schema issues

**Solution**:
```bash
# Reset database (⚠️ deletes data)
make db-reset

# Manual migration
docker compose exec backend python -c "from app.database import init_db; init_db()"

# Check migration status
make db-shell
# In psql: \dt to list tables
```

#### UTF-8/Arabic Issues

**Problem**: Arabic text shows as ??? or mojibake

**Solution**:
```bash
# Check database encoding
make db-shell
# In psql: SHOW SERVER_ENCODING;
# Should be: UTF8

# Check environment variables
docker compose exec backend env | grep LC_ALL
# Should be: C.UTF-8

# Check nginx charset
curl -I http://localhost:4173 | grep -i "content-type"
# Should include: charset=utf-8
```

#### Slow Performance

**Problem**: Services are slow or unresponsive

**Solution**:
```bash
# Check resource usage
docker stats

# Increase Docker Desktop resources:
# Settings → Resources → increase CPU/Memory

# Check disk space
docker system df

# Prune unused data
make prune
```

### Get Help

- 📖 **[RUNBOOK.md](RUNBOOK.md)** - Complete operations guide
- 🧪 **[SMOKE.md](SMOKE.md)** - Smoke testing guide
- 🔧 **[CI.md](CI.md)** - CI/CD integration
- 📐 **[ADR-docker-local.md](ADR-docker-local.md)** - Architecture decisions

---

## Documentation Index

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **README.md** | Overview and quick start | First read |
| **ADR-docker-local.md** | Architecture decisions | Understanding design choices |
| **RUNBOOK.md** | Complete operations guide | Troubleshooting, DB ops, monitoring |
| **SMOKE.md** | Smoke testing guide | Quick validation, CI integration |
| **CI.md** | CI/CD integration | Setting up pipelines |
| **QUICK_START.md** | Native setup guide | Non-Docker setup |
| **.env.docker** | Environment config template | Customizing configuration |

---

## Next Steps

1. ✅ **Complete setup**: `make dev-setup`
2. ✅ **Run smoke tests**: `make smoke`
3. ✅ **Login**: http://localhost:4173 (admin@nursery.local / Admin123!)
4. ✅ **Create nursery**: Test the complete workflow
5. ✅ **Run tests**: `make test && make e2e`
6. ✅ **Read documentation**: Start with [RUNBOOK.md](RUNBOOK.md)

---

## Support

**Issues?**
1. Check logs: `make logs`
2. Run health check: `make health`
3. Run smoke tests: `make smoke`
4. Consult [RUNBOOK.md](RUNBOOK.md) troubleshooting section
5. Try clean rebuild: `make nuke && make dev-setup`

**Still stuck?**
- Review [ADR-docker-local.md](ADR-docker-local.md) for design rationale
- Check [CI.md](CI.md) for example configurations
- Ensure Docker Desktop is running and healthy

---

**🎉 Happy Coding!**
