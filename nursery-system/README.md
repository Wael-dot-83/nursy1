# Nursery Management System - Jordan

A comprehensive web-based childcare management system designed for Jordanian nurseries, built with modern technologies and Arabic language support.

## ðŸ“– Documentation

**Complete documentation is now available:**

- **[Setup Guide](SETUP_GUIDE.md)** - Complete installation and configuration guide for all platforms
- **[API Documentation](API_DOCUMENTATION.md)** - Comprehensive API reference with examples
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment for AWS, Heroku, Docker, and bare metal
- **[User Guide](USER_GUIDE.md)** - Complete user manual for all roles (Admin, Manager, Parent, Supervisor)
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Technical documentation for developers
- **[Admin Guide](ADMIN_GUIDE.md)** - Administrator manual
- **[Parent Guide](PARENT_GUIDE.md)** - Parent user guide

**Quick Links:**
- ðŸš€ [Quick Start](#quick-start) - Get started in 5 minutes
- ðŸŒ [**Deploy for End Users**](DEPLOYMENT_INSTRUCTIONS.md) - **Make your app accessible online (Free options!)**
- ðŸ³ [Docker Setup](DEPLOYMENT_GUIDE.md#docker-deployment) - One-command deployment
- ðŸ“š [API Docs](http://localhost:8000/docs) - Interactive API documentation (when running)
- ðŸ”§ [Troubleshooting](#-troubleshooting) - Common issues and solutions

## ðŸŒŸ Features

### Core Functionality
- **Multi-Role User Management**: Admin, Manager, Supervisor, and Parent roles
- **Multi-Nursery Support**: Manage multiple childcare facilities
- **Real-time Attendance Tracking**: QR code check-in/check-out system
- **Daily Activity Reports**: Comprehensive child progress tracking
- **Parent Communication**: Direct messaging and notifications
- **Document Management**: Secure file upload and storage
- **Appointment Scheduling**: Parent-teacher meetings
- **Comprehensive Reporting**: Analytics and insights

### Technical Features
- **Secure Authentication**: JWT tokens with OTP verification and refresh tokens
- **Arabic Language Support**: RTL interface and localization
- **Responsive Design**: Mobile-friendly web interface
- **Real-time Notifications**: SMS (Twilio) and email (SMTP) notifications
- **File Storage**: Local and cloud storage options with size/type validation
- **Database Migrations**: Automated schema management with Alembic
- **API Documentation**: Auto-generated OpenAPI docs with Swagger/ReDoc
- **Rate Limiting**: DDoS protection with configurable limits
- **Audit Logging**: Comprehensive activity tracking for compliance
- **File Upload**: Secure document management with validation
- **Notification System**: In-app notifications with SMS/email integration

## ðŸ†• Recent Updates

### Version 1.0.0 - Production Ready Release

**New Documentation** ðŸ“š
- Complete API documentation with examples for all endpoints
- Comprehensive deployment guide for AWS, Heroku, and Docker
- Step-by-step setup guide for Windows, macOS, and Linux
- User guides for all roles (Admin, Manager, Parent, Supervisor)

**DevOps & Deployment** ðŸš€
- Production-ready Docker containers with multi-stage builds
- Docker Compose orchestration with PostgreSQL and Redis
- GitHub Actions CI/CD pipeline with automated testing and deployment
- Nginx configuration with security headers and caching
- Automated security scanning with Trivy

**Enhanced Features** âœ¨
- Enhanced Security: JWT refresh tokens, improved OTP system
- Rate Limiting: Configurable API rate limits with SlowAPI
- Audit Logging: Complete activity tracking for compliance
- File Management: Secure upload/download with validation
- Notification System: In-app notifications with SMS/email integration
- Database Optimization: Improved indexes and relationships
- Pydantic v2 Migration: Modern validation and better performance
- Test Infrastructure: Comprehensive test suite for backend and frontend

## Quick Start

### Prerequisites
- Python 3.11+ (3.13 recommended for latest features)
- Node.js 18+ (npm included)
- Git
- MySQL 8.0+ (optional, SQLite for development)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On macOS/Linux use: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure your environment variables
python seed_db.py     # Initialize database with demo data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Configuration
Create a `.env` file in the backend directory with the following required variables:

```bash
# Security (Generate strong random keys)
SECRET_KEY="your-32-character-secret-key-here"
JWT_ACCESS_SECRET="your-32-character-jwt-access-secret"
JWT_REFRESH_SECRET="your-32-character-jwt-refresh-secret"

# Database
DATABASE_URL="sqlite:///./nursery.db"  # or mysql://user:pass@host/db

# Optional Services
SMS_TWILIO_SID="your-twilio-sid"
SMS_TWILIO_TOKEN="your-twilio-token"
SMS_TWILIO_PHONE="+1234567890"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### Docker Compose (Recommended)

The fastest way to get started is using Docker Compose:

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env

# Start all services (backend, frontend, PostgreSQL, Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

For detailed Docker deployment instructions, see the [Deployment Guide](DEPLOYMENT_GUIDE.md#docker-deployment).

### Manual Docker (Optional)
```bash
# Backend
docker build -t nursery-backend backend
docker run --rm -p 8000:8000 --env-file backend/.env nursery-backend

# Frontend
docker build -t nursery-frontend frontend
docker run --rm -p 80:80 nursery-frontend
```

### Demo Accounts
- **Admin** ï¿½ admin@nursery.com / admin123
- **Manager** ï¿½ manager@nursery.com / manager123
- **Supervisor** ï¿½ supervisor@nursery.com / supervisor123
- **Parent** ï¿½ parent@nursery.com / parent123

After the backend and frontend are running you can sign in with any of the
credentials above and start exploring the dashboards seeded with demo data.

## ðŸ” Default Credentials

### Administrator Account
- **Phone**: 0790000000
- **Password**: admin123
- **Role**: System Administrator

### Testing Accounts
Create additional test accounts through the admin panel or API.

## ðŸ“± User Roles & Permissions

### ðŸ‘‘ Administrator
- Full system access
- User and nursery management
- System configuration
- Audit logs and reports

### ðŸ‘¨â€ðŸ’¼ Manager
- Nursery-specific management
- Staff supervision
- Report approval
- Child enrollment oversight

### ðŸ‘©â€ðŸ« Supervisor
- Daily operations
- Child activity logging
- Attendance management
- Parent communication

### ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦ Parent
- Child information access
- Daily reports viewing
- Appointment scheduling
- Staff communication

## ðŸ›  API Documentation

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

### Authentication Endpoints
```http
POST /auth/login           # User login
POST /auth/otp/request     # Request OTP
POST /auth/otp/verify      # Verify OTP
POST /auth/refresh         # Refresh token
```

### Key API Endpoints
```http
# Authentication
POST /auth/login           # User login
POST /auth/otp/request     # Request OTP
POST /auth/otp/verify      # Verify OTP
POST /auth/refresh         # Refresh token

# Admin
GET  /admin/nurseries      # List nurseries
POST /admin/nurseries      # Create nursery
GET  /admin/users          # List users
POST /admin/users          # Create user

# Users
GET  /users                # List users
POST /users                # Create user
GET  /users/{id}           # Get user details
PUT  /users/{id}           # Update user

# Children
GET  /children             # List children
POST /children             # Register child
GET  /children/{id}        # Get child details
PUT  /children/{id}        # Update child

# Attendance
POST /attendance/checkin    # Check-in child
POST /attendance/checkout   # Check-out child
GET  /attendance/{child_id} # Get attendance history

# Reports
GET  /reports              # List daily reports
POST /reports              # Create daily report
GET  /reports/{id}         # Get report details

# Files
POST /files/upload         # Upload file
GET  /files/{id}           # Download file
DELETE /files/{id}         # Delete file

# Notifications
GET  /notifications        # List notifications
POST /notifications        # Send notification

# Audit Logs
GET  /audit-logs           # List audit logs
```

### API Documentation Access
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## ðŸ—„ Database Schema

### Core Tables
- **users**: System users with roles (admin, manager, supervisor, parent)
- **nurseries**: Childcare facilities with address and age range info
- **branches**: Physical locations within nurseries
- **classrooms**: Age groups/classrooms within branches
- **children**: Registered children with parent and classroom relationships
- **attendance**: Check-in/check-out records with timestamps
- **daily_reports**: Activity logs and progress tracking
- **file_assets**: Secure document and media storage
- **otp_requests**: One-time password verification system
- **refresh_tokens**: JWT refresh token management
- **notifications**: In-app notification system
- **audit_logs**: Comprehensive activity tracking for compliance

### Relationships
```
Nursery (1) â”€â”€â”€â”€ (M) Branch
    â”‚                   â”‚
    â”œâ”€â”€â”€ (M) User       â”œâ”€â”€â”€ (M) Classroom
    â”‚                   â”‚
    â””â”€â”€â”€ (M) Child      â””â”€â”€â”€ (M) Child
                        â”‚
                        â”œâ”€â”€â”€ (M) Attendance
                        â”‚
                        â””â”€â”€â”€ (M) DailyReport
```

### Key Indexes
- User roles and nursery associations
- Child-parent and classroom relationships
- Attendance records by child and date
- Audit logs by user, action, and resource
- OTP and refresh token expiration tracking

## âš™ Configuration

### Environment Variables

#### Required Settings
```bash
# Security (32+ characters each)
SECRET_KEY="your-32-character-secret-key-here"
JWT_ACCESS_SECRET="your-32-character-jwt-access-secret"
JWT_REFRESH_SECRET="your-32-character-jwt-refresh-secret"

# Database
DATABASE_URL="sqlite:///./nursery.db"
# Or for MySQL: DATABASE_URL="mysql://user:password@host:port/database"
```

#### Optional Services
```bash
# SMS Service (Twilio)
SMS_TWILIO_SID="your-twilio-account-sid"
SMS_TWILIO_TOKEN="your-twilio-auth-token"
SMS_TWILIO_PHONE="+1234567890"

# Email Service (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="noreply@nursery.com"
```

#### File Storage & Limits
```bash
FILES_BASE_DIR="./storage"
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES="image/jpeg,image/png,image/gif,image/webp,application/pdf"
```

#### Application Settings
```bash
APP_NAME="Nursery Management System"
VERSION="1.0.0"
DEBUG=true
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
LOG_LEVEL="INFO"
LOG_FILE="./logs/app.log"

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
AUTH_RATE_LIMIT_PER_MINUTE=5
```

## ðŸ§ª Testing

### Running Tests
```bash
cd backend

# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run specific test file
python -m pytest tests/test_auth.py -v
```

### Test Structure
```
tests/
â”œâ”€â”€ __init__.py
â”œâ”€â”€ conftest.py           # Test configuration
â”œâ”€â”€ test_auth.py          # Authentication tests
â”œâ”€â”€ test_models.py        # Database model tests
â”œâ”€â”€ test_api.py           # API endpoint tests
â””â”€â”€ test_integration.py   # Integration tests
```

## ðŸš€ Deployment

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 80
CMD ["npm", "run", "preview"]
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database backup strategy in place
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Monitoring tools setup
- [ ] Backup automation configured
- [ ] Security headers enabled

## ðŸ“Š Monitoring & Maintenance

### Health Checks
- **Application Health**: `GET /healthz`
- **Database Health**: `GET /healthz/db`
- **System Metrics**: Prometheus compatible

### Logging
- **Application Logs**: `logs/app.log`
- **Error Logs**: `logs/error.log`
- **Access Logs**: `logs/access.log`

### Backup Strategy
```bash
# Database backup
mysqldump nurserydb > backup_$(date +%Y%m%d).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## ðŸ”’ Security Features

### Authentication & Authorization
- JWT token-based authentication with access and refresh tokens
- OTP verification for enhanced security
- Role-based access control (RBAC) with granular permissions
- Password hashing with bcrypt
- Token expiration and secure refresh mechanisms

### Data Protection
- Input validation with Pydantic schemas
- SQL injection prevention with SQLAlchemy ORM
- XSS protection through input sanitization
- CORS configuration with origin validation
- Rate limiting on API endpoints (configurable per endpoint)
- File upload validation with size and type restrictions

### Privacy & Compliance
- Data encryption at rest
- Secure file storage with access controls
- Comprehensive audit logging for all sensitive operations
- GDPR-compliant data handling practices
- Secure OTP and token management with expiration

## ðŸ› Troubleshooting

### Common Issues

#### Python Version Compatibility
```bash
# Check Python version (recommended: 3.11-3.12)
python --version

# If using Python 3.13, you may experience server startup issues
# Downgrade to Python 3.11 or 3.12 for stable operation
```

#### Database Connection Failed
```bash
# Check database service status
# For SQLite: Check file permissions
ls -la nursery.db

# For MySQL: Check service status
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1;"

# Check environment variables
cat .env | grep DATABASE_URL
```

#### Application Won't Start
```bash
# Check Python dependencies
pip list | grep fastapi

# Check port availability
netstat -tlnp | grep :8000

# Check log files
tail -f logs/app.log

# Verify environment variables
python -c "from app.settings import settings; print('Settings loaded successfully')"
```

#### Rate Limiting Issues
```bash
# Check rate limit settings in .env
cat .env | grep RATE_LIMIT

# Monitor rate limit headers in API responses
curl -I http://localhost:8000/

# Adjust limits if needed
RATE_LIMIT_PER_MINUTE=100
AUTH_RATE_LIMIT_PER_MINUTE=10
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la storage/uploads/

# Check file size limits
cat .env | grep MAX_FILE_SIZE

# Verify allowed file types
cat .env | grep ALLOWED_MIME_TYPES
```

### Debug Mode
Enable detailed logging:
```bash
export LOG_LEVEL=DEBUG
export DEBUG=true
python run.py
```

## ðŸ“š Documentation

### User Guides
- **[Developer Guide](DEVELOPER_GUIDE.md)**: Technical documentation
- **[Admin Guide](ADMIN_GUIDE.md)**: Administrator manual
- **[Parent Guide](PARENT_GUIDE.md)**: Parent user guide

### API Documentation
- **Interactive API Docs**: `/docs`
- **Alternative Docs**: `/redoc`
- **OpenAPI Specification**: `/openapi.json`

## ðŸ¤ Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- **Backend**: Black formatter, Ruff linter
- **Frontend**: ESLint, Prettier
- **Commits**: Conventional commit format
- **Documentation**: Update docs for API changes

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Add new feature"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## ðŸ“„ License

This project is proprietary software. All rights reserved.

## ðŸ†˜ Support

### Getting Help
- **Documentation**: Check the guides in `/docs`
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact development team

### Support Hours
- **Technical Support**: 24/7 for critical issues
- **General Support**: Monday-Friday, 9 AM - 6 PM AST
- **Emergency Support**: Available for production systems

---

**Built with â¤ï¸ for Jordanian childcare facilities**

*Ensuring the best care for our children through technology*



### Manager Email Convention

When admins create nurseries, the system automatically provisions a director account:

- Main nurseries use `manager_4@<slug(nursery-name)>.com`.
- Branch nurseries use `manager_4@<slug(nursery-name)>-<slug(branch-name)>.com`.
- If the generated email already exists, a numeric suffix (e.g., `-2`, `-3`) is appended before `.com`.
- Slugs are normalised with Arabic-to-Latin transliteration, lowercase letters, and hyphen separators.


