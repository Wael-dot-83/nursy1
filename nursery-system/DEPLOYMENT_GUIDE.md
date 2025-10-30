# Nursery Management System - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB available space
- **OS**: Linux (Ubuntu 20.04+ recommended), Windows 10+, or macOS

### Software Requirements
- Python 3.9 or higher
- Node.js 16.x or higher
- npm 8.x or higher
- SQLite (development) or PostgreSQL/MySQL (production)
- Docker and Docker Compose (for containerized deployment)

## Local Development Setup

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd nursery-system/backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   # On Linux/macOS
   python3 -m venv venv
   source venv/bin/activate

   # On Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**:
   ```bash
   python seed_db.py
   ```

6. **Run the backend server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The API will be available at: `http://localhost:8000`
   API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd nursery-system/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at: `http://localhost:5173`

5. **Build for production**:
   ```bash
   npm run build
   ```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Ensure Docker and Docker Compose are installed**:
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

   Or run in detached mode:
   ```bash
   docker-compose up -d --build
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop services**:
   ```bash
   docker-compose down
   ```

5. **Stop services and remove volumes**:
   ```bash
   docker-compose down -v
   ```

### Individual Docker Containers

#### Backend Container

1. **Build backend image**:
   ```bash
   cd nursery-system/backend
   docker build -t nursery-backend .
   ```

2. **Run backend container**:
   ```bash
   docker run -d \
     --name nursery-backend \
     -p 8000:8000 \
     -e DATABASE_URL=sqlite:///./nursery.db \
     -e SECRET_KEY=your-secret-key \
     -v $(pwd)/database:/app/database \
     nursery-backend
   ```

#### Frontend Container

1. **Build frontend image**:
   ```bash
   cd nursery-system/frontend
   docker build -t nursery-frontend .
   ```

2. **Run frontend container**:
   ```bash
   docker run -d \
     --name nursery-frontend \
     -p 80:80 \
     -e VITE_API_URL=http://your-backend-url \
     nursery-frontend
   ```

## Production Deployment

### On Ubuntu/Debian Server

#### 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nginx postgresql

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. Setup PostgreSQL Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE nursery_db;
CREATE USER nursery_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nursery_db TO nursery_user;
\q
```

#### 3. Deploy Backend

```bash
# Create application directory
sudo mkdir -p /opt/nursery-system
cd /opt/nursery-system

# Clone or copy your application
git clone <your-repo-url> .

# Setup virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit with production settings
```

#### 4. Setup Systemd Service

Create `/etc/systemd/system/nursery-backend.service`:

```ini
[Unit]
Description=Nursery Management Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/nursery-system/backend
Environment="PATH=/opt/nursery-system/backend/venv/bin"
ExecStart=/opt/nursery-system/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nursery-backend
sudo systemctl start nursery-backend
sudo systemctl status nursery-backend
```

#### 5. Deploy Frontend

```bash
cd /opt/nursery-system/frontend

# Install dependencies and build
npm install
npm run build

# Copy build to nginx directory
sudo cp -r dist/* /var/www/nursery-frontend/
```

#### 6. Configure Nginx

Create `/etc/nginx/sites-available/nursery`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend Application
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/nursery-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nursery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### Using AWS/Cloud Deployment

#### AWS Elastic Beanstalk

1. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB application**:
   ```bash
   cd nursery-system/backend
   eb init -p python-3.9 nursery-backend
   ```

3. **Create environment and deploy**:
   ```bash
   eb create nursery-production
   eb deploy
   ```

#### AWS EC2

1. Launch an EC2 instance (t3.medium or larger recommended)
2. Follow the Ubuntu/Debian server deployment steps above
3. Configure security groups to allow HTTP (80), HTTPS (443), and SSH (22)

#### Heroku Deployment

1. **Install Heroku CLI**:
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Create Heroku app**:
   ```bash
   heroku create nursery-backend
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

## Environment Variables

### Backend (.env)

```env
# Application
APP_NAME=Nursery Management System
APP_VERSION=1.0.0
DEBUG=False

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nursery_db

# Security
SECRET_KEY=your-very-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
AUTH_RATE_LIMIT_PER_MINUTE=5
API_RATE_LIMIT_PER_MINUTE=60

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./storage/uploads

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# SMS (Optional)
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=your-account-sid
SMS_AUTH_TOKEN=your-auth-token
SMS_FROM_NUMBER=+1234567890
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com

# Application
VITE_APP_NAME=Nursery Management System
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DARK_MODE=true
```

## Database Setup

### Development (SQLite)

SQLite is used by default for development:
```bash
python seed_db.py
```

### Production (PostgreSQL)

1. **Install PostgreSQL**:
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create database**:
   ```sql
   CREATE DATABASE nursery_db;
   CREATE USER nursery_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE nursery_db TO nursery_user;
   ```

3. **Update .env**:
   ```env
   DATABASE_URL=postgresql://nursery_user:secure_password@localhost:5432/nursery_db
   ```

4. **Run migrations**:
   ```bash
   alembic upgrade head
   python seed_db.py
   ```

### Backup and Restore

#### PostgreSQL Backup

```bash
# Create backup
pg_dump nursery_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql nursery_db < backup_20251030.sql
```

#### SQLite Backup

```bash
# Create backup
cp nursery.db nursery_backup_$(date +%Y%m%d).db

# Restore backup
cp nursery_backup_20251030.db nursery.db
```

## Monitoring and Maintenance

### Application Logs

```bash
# Backend logs
sudo journalctl -u nursery-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Check backend health
curl http://localhost:8000/

# Check frontend
curl http://localhost/
```

### Automated Backups

Create cron job (`sudo crontab -e`):
```cron
# Daily database backup at 2 AM
0 2 * * * /usr/bin/pg_dump nursery_db > /opt/backups/nursery_$(date +\%Y\%m\%d).sql

# Weekly cleanup of old backups (keep last 30 days)
0 3 * * 0 find /opt/backups -name "nursery_*.sql" -mtime +30 -delete
```

## Troubleshooting

### Backend Issues

1. **Database connection errors**:
   ```bash
   # Check database is running
   sudo systemctl status postgresql

   # Test connection
   psql -U nursery_user -d nursery_db -h localhost
   ```

2. **Permission errors**:
   ```bash
   # Fix file permissions
   sudo chown -R www-data:www-data /opt/nursery-system
   ```

3. **Module import errors**:
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt --force-reinstall
   ```

### Frontend Issues

1. **API connection errors**:
   - Verify VITE_API_URL in .env
   - Check CORS settings in backend
   - Verify nginx proxy configuration

2. **Build errors**:
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Docker Issues

1. **Container won't start**:
   ```bash
   # Check logs
   docker logs nursery-backend
   docker logs nursery-frontend
   ```

2. **Port already in use**:
   ```bash
   # Find process using port
   sudo lsof -i :8000
   sudo lsof -i :80

   # Kill process or use different port
   ```

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Configure firewall (ufw/iptables)
- [ ] Set up regular backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable database encryption
- [ ] Set up monitoring and alerts
- [ ] Regular security audits

## Performance Optimization

### Backend

1. **Use Gunicorn with workers**:
   ```bash
   gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

2. **Enable database connection pooling**:
   Update database configuration in settings.py

3. **Add Redis for caching**:
   ```bash
   sudo apt install redis-server
   ```

### Frontend

1. **Enable gzip compression in Nginx**
2. **Use CDN for static assets**
3. **Implement lazy loading for routes**
4. **Optimize images**

## Support

For deployment support:
- Documentation: See README.md
- Issues: GitHub Issues
- Email: support@nurserysystem.com
