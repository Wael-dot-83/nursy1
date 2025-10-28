# Nursery Management System - Jordan

A comprehensive web-based childcare management system designed for Jordanian nurseries, built with modern technologies and Arabic language support.

## 🌟 Features

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
- **Secure Authentication**: JWT tokens with OTP verification
- **Arabic Language Support**: RTL interface and localization
- **Responsive Design**: Mobile-friendly web interface
- **Real-time Notifications**: SMS and in-app notifications
- **File Storage**: Local and cloud storage options
- **Database Migrations**: Automated schema management
- **API Documentation**: Auto-generated OpenAPI docs

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (npm included)
- Git

### Backend Setup
```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate  # On macOS/Linux use: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed_demo.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### Docker (Optional)
```bash
# Backend
docker build -t nursery-backend backend
docker run --rm -p 8000:8000 --env-file backend/.env nursery-backend

# Frontend
docker build -t nursery-frontend frontend
docker run --rm -p 5173:5173 --env-file frontend/.env nursery-frontend
```

### Demo Accounts
- **Admin** � admin@nursery.com / admin123
- **Manager** � manager@nursery.com / manager123
- **Supervisor** � supervisor@nursery.com / supervisor123
- **Parent** � parent@nursery.com / parent123

After the backend and frontend are running you can sign in with any of the
credentials above and start exploring the dashboards seeded with demo data.

## 🔐 Default Credentials

### Administrator Account
- **Phone**: 0790000000
- **Password**: admin123
- **Role**: System Administrator

### Testing Accounts
Create additional test accounts through the admin panel or API.

## 📱 User Roles & Permissions

### 👑 Administrator
- Full system access
- User and nursery management
- System configuration
- Audit logs and reports

### 👨‍💼 Manager
- Nursery-specific management
- Staff supervision
- Report approval
- Child enrollment oversight

### 👩‍🏫 Supervisor
- Daily operations
- Child activity logging
- Attendance management
- Parent communication

### 👨‍👩‍👧‍👦 Parent
- Child information access
- Daily reports viewing
- Appointment scheduling
- Staff communication

## 🛠 API Documentation

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
# Admin
GET  /admin/nurseries      # List nurseries
POST /admin/nurseries      # Create nursery
GET  /admin/users          # List users
POST /admin/users          # Create user

# Manager
GET  /manager/children     # List children
POST /manager/children     # Register child
GET  /manager/reports      # View reports
POST /manager/reports      # Approve reports

# Supervisor
POST /supervisor/attendance # Record attendance
POST /supervisor/reports    # Create daily report
GET  /supervisor/children   # Assigned children

# Parent
GET  /parent/children      # My children
GET  /parent/reports       # Daily reports
POST /parent/appointments  # Schedule appointment
```

### API Documentation Access
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## 🗄 Database Schema

### Core Tables
- **users**: System users with roles
- **nurseries**: Childcare facilities
- **branches**: Physical locations
- **classes**: Age groups/classrooms
- **children**: Registered children
- **daily_reports**: Activity logs
- **attendance**: Check-in/check-out records
- **appointments**: Scheduled meetings
- **documents**: File attachments

### Relationships
```
Nursery (1) ──── (M) Branch
    │                   │
    ├─── (M) Class      ├─── (M) Class
    │                   │
    └─── (M) User       └─── (M) User
                        │
                        ├─── (M) Child
                        │
                        └─── (M) DailyReport
```

## ⚙ Configuration

### Environment Variables

#### Database Configuration
```bash
# SQLite (Development)
DATABASE_URL="sqlite:///./nursery.db"

# MySQL (Production)
MYSQL_HOST="localhost"
MYSQL_DB="nurserydb"
MYSQL_USER="nursery_user"
MYSQL_PASSWORD="secure_password"
```

#### Security Configuration
```bash
SECRET_KEY="your-32-character-secret-key"
JWT_EXPIRE_MINUTES=1440
OTP_EXPIRE_MINUTES=5
```

#### External Services
```bash
# SMS Service (Twilio)
TWILIO_ACCOUNT_SID="your_sid"
TWILIO_AUTH_TOKEN="your_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email Service (SMTP)
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
AWS_S3_BUCKET="nursery-files"
```

### Application Settings
```bash
APP_NAME="Nursery Management System"
DEBUG=true
LOG_LEVEL="INFO"
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

## 🧪 Testing

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
├── __init__.py
├── conftest.py           # Test configuration
├── test_auth.py          # Authentication tests
├── test_models.py        # Database model tests
├── test_api.py           # API endpoint tests
└── test_integration.py   # Integration tests
```

## 🚀 Deployment

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

## 📊 Monitoring & Maintenance

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

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- OTP verification for enhanced security
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token expiration and refresh

### Data Protection
- Input validation with Pydantic
- SQL injection prevention
- XSS protection through sanitization
- CORS configuration
- Rate limiting on API endpoints

### Privacy & Compliance
- Data encryption at rest
- Secure file storage
- Audit logging for sensitive operations
- GDPR-compliant data handling

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1;"

# Check environment variables
cat .env | grep MYSQL
```

#### Application Won't Start
```bash
# Check Python version
python --version

# Check dependencies
pip list | grep fastapi

# Check port availability
netstat -tlnp | grep :8000
```

#### Frontend Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Check file size limits in nginx
grep client_max_body_size /etc/nginx/nginx.conf
```

### Debug Mode
Enable detailed logging:
```bash
export LOG_LEVEL=DEBUG
export DEBUG=true
python run.py
```

## 📚 Documentation

### User Guides
- **[Developer Guide](DEVELOPER_GUIDE.md)**: Technical documentation
- **[Admin Guide](ADMIN_GUIDE.md)**: Administrator manual
- **[Parent Guide](PARENT_GUIDE.md)**: Parent user guide

### API Documentation
- **Interactive API Docs**: `/docs`
- **Alternative Docs**: `/redoc`
- **OpenAPI Specification**: `/openapi.json`

## 🤝 Contributing

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

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

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

**Built with ❤️ for Jordanian childcare facilities**

*Ensuring the best care for our children through technology*

