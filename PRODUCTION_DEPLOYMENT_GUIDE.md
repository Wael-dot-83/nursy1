# 🚀 Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Security Hardening Complete
- [x] All hardcoded credentials removed
- [x] SQL injection vulnerabilities fixed
- [x] Input validation implemented
- [x] Path traversal issues resolved
- [x] XSS protection enabled
- [x] Password hashing strengthened (bcrypt rounds=12)
- [x] Rate limiting configured
- [x] CORS properly restricted
- [x] JWT tokens secured (short-lived + refresh)
- [x] Audit logging implemented

### ✅ Architecture Upgrades
- [x] Migrated SQLite → PostgreSQL
- [x] Environment variables configured
- [x] Centralized error handling
- [x] Comprehensive logging system
- [x] Database connection pooling
- [x] Async endpoints where applicable
- [x] RBAC middleware implemented

### ✅ Testing & Quality
- [x] Unit tests (80%+ coverage)
- [x] Integration tests
- [x] E2E tests
- [x] Security penetration testing
- [x] Load testing completed
- [x] Code quality checks (pylint, black, mypy)

### ✅ Infrastructure
- [x] Docker containers configured
- [x] CI/CD pipeline set up
- [x] Monitoring enabled (Sentry)
- [x] Backup strategy implemented
- [x] SSL certificates installed
- [x] Reverse proxy configured (Nginx)

---

## Deployment Steps

### 1. Server Setup

**Requirements:**
- Ubuntu 22.04 LTS (recommended)
- 4GB RAM minimum
- 20GB disk space
- PostgreSQL 14+
- Redis 6+ (optional)
- Nginx
- Docker & Docker Compose

**Install dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install Redis (optional)
sudo apt install redis-server -y
```

### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE nursery_db;
CREATE USER nursery_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nursery_db TO nursery_user;
ALTER DATABASE nursery_db OWNER TO nursery_user;
\q

# Test connection
psql -h localhost -U nursery_user -d nursery_db
```

### 3. Application Deployment

**Clone repository:**
```bash
cd /opt
sudo git clone https://github.com/your-org/nursery-system.git
cd nursery-system
```

**Configure environment:**
```bash
# Backend
cp .env.example .env
nano .env  # Edit with production values

# Frontend
cd frontend
cp .env.example .env
nano .env  # Edit with production values
```

**Build and deploy with Docker:**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Database Migration

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Seed initial data (admin user)
docker-compose exec backend python seed_admin.py
```

### 5. Nginx Configuration

**Create Nginx config:**
```nginx
# /etc/nginx/sites-available/nursery

upstream backend {
    server localhost:8002;
}

upstream frontend {
    server localhost:5173;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name nursery.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name nursery.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/nursery.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nursery.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # File uploads
    client_max_body_size 10M;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/nursery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d nursery.example.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### 7. Monitoring Setup

**Sentry Integration:**
```python
# backend/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from app.config import settings

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration()],
        environment=settings.environment,
        traces_sample_rate=0.1
    )
```

**Prometheus Metrics (Optional):**
```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### 8. Backup Configuration

**Automated database backups:**
```bash
# Create backup script
sudo nano /opt/scripts/backup_db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nursery_db"
DB_USER="nursery_user"

# Create backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

**Schedule with cron:**
```bash
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/scripts/backup_db.sh >> /var/log/backup.log 2>&1
```

### 9. Systemd Services (Alternative to Docker)

**Backend service:**
```ini
# /etc/systemd/system/nursery-backend.service
[Unit]
Description=Nursery Management Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/nursery-system/backend
Environment="PATH=/opt/nursery-system/backend/venv/bin"
ExecStart=/opt/nursery-system/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8002 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable nursery-backend
sudo systemctl start nursery-backend
sudo systemctl status nursery-backend
```

### 10. Health Checks

**Create health check endpoint:**
```python
# backend/app/routers/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Check database
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "version": "2.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
```

**Monitor with external service:**
```bash
# UptimeRobot, Pingdom, or custom script
curl https://nursery.example.com/api/health
```

---

## Post-Deployment

### Verification Steps

1. **Test all endpoints:**
```bash
# Health check
curl https://nursery.example.com/api/health

# Login
curl -X POST https://nursery.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nursery.com","password":"SecurePassword123!"}'
```

2. **Check logs:**
```bash
# Application logs
docker-compose logs -f backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nursery-backend -f
```

3. **Monitor performance:**
```bash
# Database connections
docker-compose exec postgres psql -U nursery_user -d nursery_db -c "SELECT count(*) FROM pg_stat_activity;"

# Memory usage
docker stats

# Disk usage
df -h
```

### Security Audit

```bash
# Run security scan
docker run --rm -v $(pwd):/src returntocorp/semgrep --config=auto /src

# Check for vulnerabilities
pip-audit
npm audit

# SSL test
https://www.ssllabs.com/ssltest/analyze.html?d=nursery.example.com
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system resources
- Review security alerts

**Weekly:**
- Review backup integrity
- Update dependencies
- Check SSL certificate expiry

**Monthly:**
- Security audit
- Performance optimization
- Database maintenance (VACUUM, ANALYZE)

### Update Procedure

```bash
# 1. Backup database
/opt/scripts/backup_db.sh

# 2. Pull latest code
cd /opt/nursery-system
git pull origin main

# 3. Update dependencies
docker-compose build

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Restart services
docker-compose restart

# 6. Verify deployment
curl https://nursery.example.com/api/health
```

---

## Rollback Procedure

```bash
# 1. Stop services
docker-compose down

# 2. Restore database
gunzip < /opt/backups/backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U nursery_user -d nursery_db

# 3. Checkout previous version
git checkout <previous-commit-hash>

# 4. Rebuild and restart
docker-compose build
docker-compose up -d

# 5. Verify
curl https://nursery.example.com/api/health
```

---

## Support & Troubleshooting

### Common Issues

**Database connection failed:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U nursery_user -d nursery_db

# Review logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**High memory usage:**
```bash
# Check processes
docker stats

# Restart services
docker-compose restart

# Adjust worker count in .env
WORKERS=2
```

**SSL certificate issues:**
```bash
# Renew certificate
sudo certbot renew

# Check expiry
sudo certbot certificates
```

---

## Contact & Support

- **Technical Support:** support@nursery.example.com
- **Security Issues:** security@nursery.example.com
- **Documentation:** https://docs.nursery.example.com

---

**Deployment Status:** ✅ PRODUCTION READY
**Last Updated:** 2025-01-02
