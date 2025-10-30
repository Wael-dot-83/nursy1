# Nursery Management System - Complete Setup Guide

## Quick Start

For the fastest setup, use Docker Compose:

```bash
# Clone the repository
git clone <your-repo-url>
cd nursery-system

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Detailed Setup Instructions

### 1. Prerequisites Installation

#### Windows

1. **Install Python 3.11+**
   - Download from https://python.org
   - During installation, check "Add Python to PATH"
   - Verify: `python --version`

2. **Install Node.js 18+**
   - Download from https://nodejs.org
   - Choose LTS version
   - Verify: `node --version` and `npm --version`

3. **Install Git**
   - Download from https://git-scm.com
   - Use default settings
   - Verify: `git --version`

4. **Install Docker Desktop** (Optional, for containerized deployment)
   - Download from https://docker.com
   - Enable WSL 2 if prompted
   - Verify: `docker --version`

#### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python@3.11

# Install Node.js
brew install node@18

# Install Git
brew install git

# Install Docker (optional)
brew install --cask docker
```

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Python
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install Docker (optional)
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER  # Add current user to docker group
```

### 2. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/nursery-system.git

# Navigate to the project
cd nursery-system
```

### 3. Backend Setup

#### Create Virtual Environment

```bash
# Navigate to backend directory
cd nursery-system/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Install Dependencies

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

#### Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your preferred editor
# Windows:
notepad .env
# macOS/Linux:
nano .env
```

**Required environment variables**:
```env
# Application
APP_NAME=Nursery Management System
DEBUG=True  # Set to False in production

# Database (SQLite for development)
DATABASE_URL=sqlite:///./nursery.db

# Security - IMPORTANT: Change this!
SECRET_KEY=your-very-secret-key-change-this-in-production-make-it-long-and-random

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Token expiry
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Generate a secure SECRET_KEY**:
```bash
# Python method
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or use this online (for development only)
# For production, generate locally and keep secure
```

#### Initialize Database

```bash
# Run database setup and seed script
python seed_db.py
```

This creates:
- Admin user: `admin@nursery.com` / `Admin123!`
- Sample nursery with test data
- Test users for each role

#### Run Backend Server

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# The API will be available at:
# - API: http://localhost:8000
# - Swagger docs: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
```

### 4. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd nursery-system/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Configure frontend environment** (`.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Nursery Management System
VITE_ENABLE_NOTIFICATIONS=true
```

#### Run Development Server

```bash
# Start development server
npm run dev

# The application will be available at:
# http://localhost:5173
```

#### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

### 5. Verify Installation

#### Check Backend

```bash
# Test API endpoint
curl http://localhost:8000/

# Should return:
# {"message":"Nursery Management System API","version":"1.0.0"}
```

#### Check Frontend

1. Open browser to http://localhost:5173
2. You should see the login page
3. Login with default admin credentials:
   - Email: `admin@nursery.com`
   - Password: `Admin123!`

### 6. Optional: Docker Setup

If you prefer to run everything in Docker:

```bash
# Navigate to project root
cd nursery-system

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Build and start all services
docker-compose up --build

# Run in background (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

Services will be available at:
- Frontend: http://localhost
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432

### 7. Database Configuration

#### Development (SQLite - Default)

SQLite is used by default and requires no additional setup.

```env
DATABASE_URL=sqlite:///./nursery.db
```

#### Production (PostgreSQL - Recommended)

1. **Install PostgreSQL**:

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

2. **Create Database**:

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE nursery_db;
CREATE USER nursery_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nursery_db TO nursery_user;
\q
```

3. **Update .env**:

```env
DATABASE_URL=postgresql://nursery_user:your_secure_password@localhost:5432/nursery_db
```

4. **Run Migrations**:

```bash
cd backend
python seed_db.py
```

### 8. Troubleshooting

#### Backend Issues

**Port 8000 already in use**:
```bash
# Find process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :8000
kill -9 <PID>

# Or use a different port:
uvicorn app.main:app --port 8001
```

**Module not found errors**:
```bash
# Ensure virtual environment is activated
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Database errors**:
```bash
# Delete and recreate database
rm nursery.db
python seed_db.py
```

#### Frontend Issues

**Port 5173 already in use**:
```bash
# Find and kill process
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5173
kill -9 <PID>
```

**npm install fails**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Build errors**:
```bash
# Clear vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

#### Docker Issues

**Containers won't start**:
```bash
# View detailed logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
docker-compose up
```

**Permission denied**:
```bash
# On Linux, add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 9. Development Tools

#### Recommended VSCode Extensions

- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Docker
- GitLens

#### Backend Development

```bash
# Run tests
pytest

# Code formatting
black app/

# Linting
flake8 app/

# Type checking
mypy app/
```

#### Frontend Development

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### 10. Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment instructions including:
- Server setup
- SSL/HTTPS configuration
- Nginx configuration
- Systemd services
- Database backup
- Monitoring

### 11. Default Credentials

**After running seed_db.py**, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nursery.com | Admin123! |

**IMPORTANT**: Change these passwords immediately after first login!

### 12. Next Steps

1. **Change default passwords**
2. **Configure email/SMS notifications** (optional)
3. **Set up backups**
4. **Review security settings**
5. **Add your nurseries and users**
6. **Customize settings to your needs**

### 13. Getting Help

- **Documentation**: See README.md and other guides
- **API Documentation**: http://localhost:8000/docs
- **User Guide**: See USER_GUIDE.md
- **Issues**: Create an issue on GitHub
- **Support**: contact@nurserysystem.com

### 14. Configuration Checklist

Before going to production, verify:

- [ ] SECRET_KEY changed from default
- [ ] DEBUG set to False
- [ ] ALLOWED_ORIGINS configured correctly
- [ ] Database using PostgreSQL (not SQLite)
- [ ] Strong database password set
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] Default passwords changed
- [ ] Email/SMS configured (if using)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Logs configured and rotating

### 15. Performance Tuning

For production deployments:

```bash
# Use Gunicorn with multiple workers
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120

# Add Redis for caching
docker-compose up -d redis

# Enable gzip in Nginx
# See deployment guide for nginx configuration
```

---

**Last Updated**: October 2025
**Version**: 1.0.0

For more information, see:
- [README.md](./README.md) - Project overview
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
- [USER_GUIDE.md](./USER_GUIDE.md) - End-user documentation
