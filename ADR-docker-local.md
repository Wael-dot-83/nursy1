# ADR: Docker-Based Local Development Environment

**Status**: Accepted  
**Date**: 2025-01-05  
**Decision Makers**: Development Team  
**Context**: Nursery Management System Local Development

## Context and Problem Statement

The Nursery Management System requires a consistent, reproducible development environment that:
1. Works identically across all developer machines (Windows, macOS, Linux)
2. Matches production infrastructure as closely as possible
3. Requires minimal manual setup and configuration
4. Supports automated testing and CI/CD integration
5. Handles UTF-8/Arabic text correctly end-to-end
6. Provides good developer experience (fast iteration, easy debugging)

## Decision Drivers

* **Consistency**: Eliminate "works on my machine" problems
* **Onboarding**: New developers should be productive in < 30 minutes
* **Production Parity**: Local environment should mirror production
* **Testing**: Automated tests must be fast and reliable
* **Performance**: Build and startup times must be reasonable
* **Isolation**: Services should not conflict with host system
* **Maintainability**: Configuration should be centralized and documented

## Considered Options

### Option 1: Native Installation
Install Python, Node, PostgreSQL, Redis directly on host machine.

**Pros**:
- Fastest execution (no container overhead)
- Direct IDE integration
- Familiar to most developers

**Cons**:
- Different versions across machines
- OS-specific issues (especially Windows)
- Difficult to clean up
- No production parity
- Manual dependency management

### Option 2: Vagrant VM
Use Vagrant to create a full VM with all services.

**Pros**:
- Complete isolation
- Linux environment for Windows users
- Consistent across platforms

**Cons**:
- High resource usage (full VM)
- Slow startup times (minutes)
- Additional layer of complexity
- Outdated approach

### Option 3: Docker Compose (SELECTED)
Use Docker Compose to orchestrate containers for all services.

**Pros**:
- Lightweight compared to VMs
- Production parity (same images)
- Fast startup (seconds)
- Easy cleanup
- Excellent tooling and ecosystem
- CI/CD friendly
- Industry standard

**Cons**:
- Requires Docker installation
- Learning curve for Docker basics
- Networking complexity for beginners

### Option 4: Kubernetes (k3s/minikube)
Use local Kubernetes cluster.

**Pros**:
- Production parity for k8s deployments
- Advanced orchestration features

**Cons**:
- Overkill for local development
- High resource usage
- Complex configuration
- Slow iteration cycles

## Decision Outcome

**Chosen Option**: Docker Compose (Option 3)

### Rationale

Docker Compose provides the best balance of:
- **Developer Experience**: Simple commands (`make up`, `make down`)
- **Consistency**: Identical environment across machines
- **Production Parity**: Same containers used in production
- **Performance**: Acceptable overhead, fast rebuilds with caching
- **Ecosystem**: Excellent tooling, documentation, community support
- **CI/CD**: Native integration with all major CI platforms

## Implementation Details

### Architecture

```
┌─────────────────────────────────────────────┐
│  Developer Machine (Windows/Mac/Linux)      │
├─────────────────────────────────────────────┤
│  Docker Desktop                             │
│  ┌────────────────────────────────────────┐ │
│  │ Docker Compose Stack                   │ │
│  │  ┌──────────┐  ┌──────────┐           │ │
│  │  │PostgreSQL│  │  Redis   │           │ │
│  │  │  :5432   │  │  :6379   │           │ │
│  │  └──────────┘  └──────────┘           │ │
│  │  ┌─────────────────────────┐          │ │
│  │  │  Backend (FastAPI)      │          │ │
│  │  │  uvicorn :8000          │          │ │
│  │  └─────────────────────────┘          │ │
│  │  ┌─────────────────────────┐          │ │
│  │  │  Frontend (React+Nginx) │          │ │
│  │  │  nginx :4173            │          │ │
│  │  │  ├─ /api/ → backend     │          │ │
│  │  │  └─ /* → SPA            │          │ │
│  │  └─────────────────────────┘          │ │
│  │  ┌──────────┐                         │ │
│  │  │ Adminer  │ (dev profile)           │ │
│  │  │  :8080   │                         │ │
│  │  └──────────┘                         │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. Multi-Stage Dockerfiles
```dockerfile
# Builder stage: Install dependencies
FROM python:3.11-slim as builder
# ... build steps

# Runner stage: Copy only runtime artifacts
FROM python:3.11-slim as runner
COPY --from=builder /root/.local /home/nursery/.local
```

**Rationale**: Smaller final images, faster startup, better security.

#### 2. Compose Profiles
```yaml
services:
  test:
    profiles: ["test"]
  adminer:
    profiles: ["dev"]
```

**Rationale**: Minimize resource usage, faster CI, flexible deployment.

#### 3. Healthchecks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 10s
  timeout: 5s
  retries: 10
```

**Rationale**: Reliable service readiness, proper dependency ordering.

#### 4. Volume Mounts
```yaml
volumes:
  - ./backend/app:/app/app:ro  # Code hot-reload
  - ./backend/logs:/app/logs    # Persistent logs
  - db_data:/var/lib/postgresql/data  # Database persistence
```

**Rationale**: Fast iteration (hot reload), data persistence, log access.

#### 5. Environment-Based Configuration
```bash
# .env.docker - single source of truth
DB_USER=nursery_user
DB_PASSWORD=nursery_password123
API_PORT=8000
```

**Rationale**: Centralized config, easy customization, no code changes.

#### 6. UTF-8 Everywhere
```dockerfile
ENV PYTHONIOENCODING=utf-8 LC_ALL=C.UTF-8 LANG=C.UTF-8
```
```sql
POSTGRES_INITDB_ARGS="--encoding=UTF8 --lc-collate=en_US.UTF-8"
```
```nginx
charset utf-8;
```

**Rationale**: Proper Arabic text handling across all layers.

### Technology Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Container Runtime | Docker | Industry standard, best tooling |
| Orchestration | Docker Compose | Simple, sufficient for local dev |
| Database | PostgreSQL 15 | Production-ready, UTF-8 support |
| Cache | Redis 7 | Fast, reliable, widely used |
| Backend Server | Uvicorn | ASGI, async support, fast |
| Frontend Server | Nginx | Production-grade, efficient |
| Process Manager | Docker | Native healthchecks, restart policies |

### Developer Workflow

```bash
# Day 1 (first time setup)
cp .env.docker .env
make dev-setup  # Build, start, migrate, seed

# Daily workflow
make up         # Start services
make logs       # View logs
# ... code changes (hot reload active)
make test       # Run tests
make smoke      # Quick validation
make down       # Stop services

# Troubleshooting
make health     # Check service health
make db-shell   # Access database
make backend-shell  # Debug backend
```

## Consequences

### Positive

✅ **Consistency**: All developers use identical environment  
✅ **Fast Onboarding**: New developers productive in < 30 min  
✅ **Production Parity**: Same Docker images in prod  
✅ **Easy Testing**: Automated tests run in isolated containers  
✅ **Clean System**: No pollution of host machine  
✅ **CI/CD Ready**: Same compose files work in CI  
✅ **Debugging**: Easy to access logs, shells, database  
✅ **Rollback**: Simple to reset entire environment  

### Negative

❌ **Docker Required**: All developers must install Docker  
❌ **Learning Curve**: Requires basic Docker knowledge  
❌ **Resource Usage**: ~2GB RAM, ~5GB disk minimum  
❌ **Networking**: Port conflicts require configuration  
❌ **Performance**: Slight overhead vs native (5-10%)  
❌ **File Watching**: OS-specific issues with volume mounts  

### Mitigation Strategies

**For Resource Usage**:
- Use multi-stage builds to minimize image size
- Implement compose profiles to run only needed services
- Configure Docker Desktop resource limits

**For Performance**:
- Enable BuildKit for faster builds
- Use Docker layer caching effectively
- Mount only necessary directories as volumes
- Use `:ro` (read-only) mounts where possible

**For File Watching**:
- Document OS-specific settings (Docker Desktop → File Sharing)
- Provide alternative workflow (rebuild on change)
- Use polling fallback in development tools

**For Port Conflicts**:
- Document all used ports clearly
- Provide .env variables to customize ports
- Include port conflict detection in setup

## Alternatives Considered But Rejected

### Podman
- **Pro**: Rootless, daemonless
- **Con**: Compose support still maturing, fewer Windows users

### DevContainers (VS Code)
- **Pro**: Excellent IDE integration
- **Con**: VS Code specific, less flexible than Compose

### Nix
- **Pro**: Reproducible builds
- **Con**: Steep learning curve, niche technology

### Tilt
- **Pro**: Advanced developer workflows
- **Con**: Overkill for this project size

## Compliance and Standards

This decision aligns with:
- ✅ 12-Factor App Methodology
- ✅ Cloud Native Computing Foundation (CNCF) practices
- ✅ Docker Best Practices
- ✅ OWASP Security Guidelines (non-root containers)

## Success Metrics

After 30 days, we expect:
- [ ] 100% of developers using Docker setup
- [ ] < 15 min average setup time for new developers
- [ ] < 5 min average startup time from cold start
- [ ] Zero "works on my machine" incidents
- [ ] > 95% CI test success rate

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [12-Factor App](https://12factor.net/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-05 | 1.0 | Initial decision |
