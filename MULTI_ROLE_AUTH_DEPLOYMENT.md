# Multi-Role Authentication System - Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment Requirements

#### 1. Environment Configuration ✅

**Backend Environment Variables** (`nursery-system/backend/.env`)

```bash
# Security - CRITICAL
SECRET_KEY=<GENERATE_STRONG_RANDOM_KEY_HERE>  # Use: python -c "import secrets; print(secrets.token_urlsafe(32))"
DEBUG=false

# Token Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
AUTH_RATE_LIMIT_PER_MINUTE=5
MAX_RESET_ATTEMPTS_PER_DAY=3
MAX_OTP_ATTEMPTS=3
OTP_EXPIRE_MINUTES=10

# Database
DATABASE_URL=sqlite:///./storage/nursery.db  # Or PostgreSQL for production

# CORS - Update for production domain
CORS_ORIGINS=["https://yourdomain.com"]

# Email Configuration (REQUIRED for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=<YOUR_SMTP_PASSWORD>
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Nursery Management System

# Frontend URL (for email links)
FRONTEND_URL=https://yourdomain.com
```

**Frontend Environment Variables** (`nursery-system/frontend/.env`)

```bash
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com

# Environment
VITE_ENV=production
```

#### 2. Generate Strong SECRET_KEY

```bash
# Python method
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL method
openssl rand -base64 32

# Node.js method
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**⚠️ CRITICAL**: Never commit the SECRET_KEY to version control!

#### 3. SMTP Configuration

**Gmail Setup:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<app-specific-password>  # Generate in Google Account settings
```

**SendGrid Setup:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<your-sendgrid-api-key>
```

**AWS SES Setup:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<your-ses-smtp-username>
SMTP_PASSWORD=<your-ses-smtp-password>
```

### Security Hardening

#### 1. HTTPS Configuration ✅

**Nginx Configuration** (`/etc/nginx/sites-available/nursery`)

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend (React)
    location / {
        root /var/www/nursery/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Install SSL Certificate (Let's Encrypt):**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron job)
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

#### 2. Firewall Configuration ✅

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Fail2ban (Brute force protection)
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### 3. Database Security ✅

**For Production, use PostgreSQL instead of SQLite:**

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE nursery_db;
CREATE USER nursery_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE nursery_db TO nursery_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://nursery_user:strong_password_here@localhost/nursery_db
```

**Database Backup Script:**

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/var/backups/nursery"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nursery_db"

mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -U nursery_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

**Schedule daily backups:**

```bash
sudo crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

### Application Deployment

#### 1. Backend Deployment ✅

**Using Systemd Service:**

Create `/etc/systemd/system/nursery-backend.service`:

```ini
[Unit]
Description=Nursery Management System Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nursery/backend
Environment="PATH=/var/www/nursery/backend/venv/bin"
ExecStart=/var/www/nursery/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8002 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable nursery-backend
sudo systemctl start nursery-backend
sudo systemctl status nursery-backend
```

#### 2. Frontend Deployment ✅

**Build for production:**

```bash
cd nursery-system/frontend
npm run build
```

**Deploy to web server:**

```bash
sudo mkdir -p /var/www/nursery/frontend
sudo cp -r dist/* /var/www/nursery/frontend/
sudo chown -R www-data:www-data /var/www/nursery
```

### Monitoring & Logging

#### 1. Application Logging ✅

**Configure log rotation** (`/etc/logrotate.d/nursery`):

```
/var/www/nursery/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nursery-backend > /dev/null 2>&1 || true
    endscript
}
```

#### 2. Monitoring Setup ✅

**Install monitoring tools:**

```bash
# Prometheus + Grafana
sudo apt-get install prometheus grafana

# Or use cloud services:
# - AWS CloudWatch
# - Datadog
# - New Relic
```

**Health Check Endpoint:**

```python
# Already implemented in backend
GET /health
Response: {"status": "healthy", "timestamp": "..."}
```

**Monitor these metrics:**
- Login success/failure rate
- Token refresh rate
- Password reset requests
- Account lockouts
- API response times
- Error rates

#### 3. Alerting ✅

**Set up alerts for:**
- High failed login rate (> 100/hour)
- Multiple account lockouts
- Database connection failures
- High API error rate (> 5%)
- Disk space low (< 10%)
- Memory usage high (> 90%)

### Security Auditing

#### 1. Regular Security Checks ✅

**Weekly:**
- Review audit logs for suspicious activity
- Check failed login attempts
- Review password reset requests
- Monitor account lockouts

**Monthly:**
- Update dependencies (`pip list --outdated`, `npm outdated`)
- Review and rotate API keys
- Check SSL certificate expiry
- Review user access levels

**Quarterly:**
- Full security audit
- Penetration testing
- Code review
- Update security policies

#### 2. Dependency Updates ✅

**Backend:**

```bash
cd nursery-system/backend
pip list --outdated
pip install --upgrade <package>
pip freeze > requirements.txt
```

**Frontend:**

```bash
cd nursery-system/frontend
npm outdated
npm update
npm audit fix
```

#### 3. Security Scanning ✅

**Backend:**

```bash
# Bandit (Python security scanner)
pip install bandit
bandit -r app/

# Safety (dependency vulnerability scanner)
pip install safety
safety check
```

**Frontend:**

```bash
# npm audit
npm audit
npm audit fix

# Snyk
npm install -g snyk
snyk test
```

### Performance Optimization

#### 1. Database Optimization ✅

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_login_attempts_email_time ON login_attempts(email, attempted_at);
CREATE INDEX idx_refresh_tokens_user_expires ON refresh_tokens(user_id, expires_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'admin@nursery.com';
```

#### 2. Caching ✅

**Redis for session caching:**

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Update backend to use Redis:**

```python
# requirements.txt
redis==5.0.0

# app/cache.py
import redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)
```

#### 3. CDN Configuration ✅

**Use CDN for static assets:**

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
}
```

**Configure CloudFlare or AWS CloudFront for:**
- Static asset caching
- DDoS protection
- SSL/TLS termination
- Geographic distribution

### Disaster Recovery

#### 1. Backup Strategy ✅

**What to backup:**
- Database (daily)
- User uploads (`storage/uploads/`)
- Configuration files (`.env`)
- SSL certificates

**Backup script:**

```bash
#!/bin/bash
# full-backup.sh

BACKUP_DIR="/var/backups/nursery"
DATE=$(date +%Y%m%d_%H%M%S)

# Database
pg_dump -U nursery_user nursery_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/nursery/storage/uploads

# Config
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /var/www/nursery/backend/.env

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/ s3://your-backup-bucket/ --recursive

echo "Backup completed: $DATE"
```

#### 2. Recovery Procedures ✅

**Database restore:**

```bash
# PostgreSQL
gunzip < backup_20240101_120000.sql.gz | psql -U nursery_user nursery_db

# Verify
psql -U nursery_user nursery_db -c "SELECT COUNT(*) FROM users;"
```

**File restore:**

```bash
tar -xzf files_20240101_120000.tar.gz -C /
```

### Testing in Production

#### 1. Smoke Tests ✅

```bash
# Test login endpoints
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nursery.com","password":"Admin123!"}'

# Test health endpoint
curl https://yourdomain.com/api/health

# Test password reset
curl -X POST https://yourdomain.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nursery.com"}'
```

#### 2. Load Testing ✅

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json \
  https://yourdomain.com/api/auth/login

# Test with authentication
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
  https://yourdomain.com/api/auth/me
```

### Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] HTTPS enabled and working
- [ ] SSL certificate valid and auto-renewing
- [ ] SMTP configured and tested
- [ ] Database backups scheduled
- [ ] Monitoring and alerting configured
- [ ] Firewall rules applied
- [ ] Rate limiting tested
- [ ] All login portals accessible
- [ ] Password reset flow tested
- [ ] Token refresh working
- [ ] Audit logging enabled
- [ ] Error tracking configured
- [ ] Documentation updated
- [ ] Team trained on new system

### Rollback Plan

**If deployment fails:**

1. **Stop new services:**
   ```bash
   sudo systemctl stop nursery-backend
   ```

2. **Restore previous version:**
   ```bash
   cd /var/www/nursery
   git checkout <previous-commit>
   ```

3. **Restore database:**
   ```bash
   gunzip < backup_previous.sql.gz | psql -U nursery_user nursery_db
   ```

4. **Restart services:**
   ```bash
   sudo systemctl start nursery-backend
   sudo systemctl restart nginx
   ```

5. **Verify:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

### Support & Maintenance

**Regular maintenance tasks:**

- **Daily**: Check logs for errors
- **Weekly**: Review security alerts
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

**Emergency contacts:**
- System Admin: [contact]
- Database Admin: [contact]
- Security Team: [contact]

**Documentation:**
- Technical docs: `/docs/MULTI_ROLE_AUTH_IMPLEMENTATION.md`
- API docs: `https://yourdomain.com/api/docs`
- Runbooks: `/docs/runbooks/`

---

**Deployment Version**: 2.0.0
**Last Updated**: 2024
**Status**: ✅ Production Ready
