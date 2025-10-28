# Nursery Management System - Developer Guide

## Overview

The Nursery Management System is a comprehensive web application built with FastAPI (backend) and React (frontend) for managing childcare facilities in Jordan. The system supports role-based access control with four user types: Admin, Manager, Supervisor, and Parent.

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **Database**: SQLAlchemy ORM with SQLite (dev) / MySQL (prod)
- **Authentication**: JWT tokens with OTP verification
- **File Storage**: Local storage with AWS S3 support
- **Documentation**: Auto-generated OpenAPI docs at `/docs`

### Frontend (React)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React Query for server state
- **Routing**: React Router with protected routes

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0 (production)

### Development Setup

1. **Clone and setup backend:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   copy .env.example .env  # Configure environment variables
   python seed.py  # Seed initial admin user
   ```

2. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Run backend:**
   ```bash
   cd backend
   python run.py
   ```

### Default Admin Credentials
- **Phone**: 0790000000
- **Password**: admin123
- **Role**: Admin

## API Documentation

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "phone": "0790000000",
  "password": "admin123"
}
```

#### OTP Request
```http
POST /auth/otp/request
Content-Type: application/json

{
  "phone": "0790000000"
}
```

#### OTP Verification
```http
POST /auth/otp/verify
Content-Type: application/json

{
  "phone": "0790000000",
  "otp": "123456"
}
```

### Admin Endpoints

#### Create Nursery
```http
POST /admin/nurseries
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Happy Kids Nursery",
  "mainPhone": "0791234567",
  "email": "info@happykids.com",
  "mainAddress": {
    "street": "Main Street",
    "city": "Amman",
    "governorate": "Amman",
    "postalCode": "11183"
  },
  "ageRange": {
    "minAge": 70,
    "maxAge": 52
  },
  "notes": "A wonderful place for children"
}
```

#### List Nurseries
```http
GET /admin/nurseries
Authorization: Bearer <token>
```

## Database Schema

### Core Entities

- **Users**: System users with role-based permissions
- **Nurseries**: Childcare facilities
- **Branches**: Physical locations within nurseries
- **Classes**: Educational groups within branches
- **Children**: Registered children with profiles
- **Daily Reports**: Daily activity logs for children
- **Attendance**: Check-in/check-out records

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

## User Roles & Permissions

### Admin
- Full system access
- User management
- Nursery and branch management
- System configuration
- Audit logs access

### Manager
- Nursery-specific access
- Supervisor management
- Report approval
- Child enrollment management

### Supervisor
- Daily report creation
- Child activity logging
- Attendance tracking
- Limited report viewing

### Parent
- Own children's information
- Daily reports viewing
- Communication with staff
- Appointment scheduling

## Environment Configuration

### Development (.env)
```bash
APP_NAME="Nursery Management System"
DEBUG=true
SECRET_KEY="dev-secret-key-32-chars-minimum..."
DATABASE_URL="sqlite:///./nursery.db"
```

### Production (.env.production)
```bash
APP_NAME="Nursery Management System"
DEBUG=false
SECRET_KEY="prod-secret-key-32-chars-minimum..."
MYSQL_HOST="localhost"
MYSQL_DB="nursery_prod"
MYSQL_USER="nursery_user"
MYSQL_PASSWORD="secure_password"
TWILIO_ACCOUNT_SID="your_sid"
TWILIO_AUTH_TOKEN="your_token"
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
```

## Deployment

### Backend Deployment
```bash
# Using Gunicorn for production
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment
```bash
npm run build
# Serve dist/ folder with nginx or similar
```

### Docker Deployment
```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## Security Features

### Authentication
- JWT token-based authentication
- OTP verification for enhanced security
- Password hashing with bcrypt
- Token expiration and refresh mechanisms

### Authorization
- Role-based access control (RBAC)
- Route-level permission checking
- Database-level constraints

### Data Protection
- Input validation with Pydantic
- SQL injection prevention
- XSS protection
- CORS configuration

## Monitoring & Logging

### Health Checks
- `/healthz` endpoint for service health
- Database connectivity checks
- External service availability

### Logging
- Structured logging with configurable levels
- Request/response logging
- Error tracking and reporting

## Testing

### Running Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Test Coverage
- Unit tests for models and utilities
- Integration tests for API endpoints
- Authentication flow testing
- Database operation testing

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in .env
   - Ensure database server is running
   - Verify network connectivity

2. **Authentication Errors**
   - Verify JWT secret key configuration
   - Check token expiration settings
   - Ensure user account is active

3. **File Upload Issues**
   - Check file permissions on storage directory
   - Verify AWS S3 credentials (if using cloud storage)
   - Check file size limits

4. **CORS Errors**
   - Verify CORS_ORIGINS in environment config
   - Check request origin headers
   - Ensure proper preflight handling

### Debug Mode
Enable debug logging:
```bash
LOG_LEVEL=DEBUG python run.py
```

## Contributing

### Code Style
- Backend: Black formatter, Ruff linter
- Frontend: ESLint, Prettier
- Commit messages: Conventional commits

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Support

For technical support or questions:
- Check the API documentation at `/docs`
- Review the logs in `server.log`
- Test with the provided admin credentials
- Check the troubleshooting section above

## License

This project is proprietary software. All rights reserved.