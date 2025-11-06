# 🏫 Nursery Management System

A comprehensive nursery/kindergarten management system with role-based access control, built with FastAPI (Python) backend and React (Vite) frontend.

## ⚡ Quick Start

### 🐳 Docker Setup (Recommended)

**Production-like environment with zero manual setup:**

```bash
# First time setup (copies .env, builds, starts, migrates, seeds)
make dev-setup

# Daily workflow
make up        # Start all services
make logs      # View logs
make test      # Run tests
make smoke     # Quick health check
make down      # Stop services
```

**Access the application:**
- 🌐 **Frontend**: http://localhost:4173
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 🗄️ **Database Admin**: http://localhost:8080 (Adminer)

**Default credentials:**
- 📧 Email: `admin@nursery.local`
- 🔑 Password: `Admin123!`

👉 **See [RUNBOOK.md](RUNBOOK.md) for complete Docker guide**

---

### 💻 Native Setup (Alternative)

**One command to run everything:**

#### Windows
```bash
cd d:\nursy
run-all.bat
```

#### Linux/Mac/Git Bash
```bash
cd /d/nursy
bash run-all.sh
```

**That's it!** The system will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Start backend & frontend
- ✅ Open in your browser

👉 **See [QUICK_START.md](QUICK_START.md) for native setup details**

## 🎯 Features

- **Multi-Role Authentication**: Separate login portals for Admin, Manager, Supervisor, Parent
- **Password Management**: Forgot password, reset password, change password flows
- **Accessibility**: WCAG 2.1 Level AA compliant, full keyboard & screen reader support
- **Child Management**: Track children, attendance, reports
- **Branch Management**: Multiple nursery locations
- **File Storage**: Document uploads and management
- **Notifications**: Real-time system notifications
- **Audit Logging**: Complete activity tracking
- **Security**: JWT tokens, rate limiting, brute force protection
- **API Documentation**: Interactive Swagger/OpenAPI docs

## 🛠️ Technology Stack

**Backend:**
- FastAPI (Python)
- SQLite Database
- JWT Authentication
- Uvicorn ASGI Server
- SQLAlchemy ORM

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios HTTP Client
- React Query

## 📚 Documentation

### Getting Started
- **[QUICK_START.md](QUICK_START.md)** - Get started in 30 seconds
- **[RUN_SYSTEM.md](RUN_SYSTEM.md)** - Complete execution guide
- **[RUN_ALL_GUIDE.md](RUN_ALL_GUIDE.md)** - Detailed runner documentation

### Authentication & Security
- **[MULTI_ROLE_AUTH_IMPLEMENTATION.md](MULTI_ROLE_AUTH_IMPLEMENTATION.md)** - 🆕 Complete auth system documentation
- **[MULTI_ROLE_AUTH_QUICK_START.md](MULTI_ROLE_AUTH_QUICK_START.md)** - 🆕 Auth quick start guide
- **[MULTI_ROLE_AUTH_SUMMARY.md](MULTI_ROLE_AUTH_SUMMARY.md)** - 🆕 Implementation summary
- **[MULTI_ROLE_AUTH_API.postman_collection.json](MULTI_ROLE_AUTH_API.postman_collection.json)** - 🆕 Postman API collection

### Accessibility (WCAG 2.1 Level AA)
- **[ACCESSIBILITY_INDEX.md](ACCESSIBILITY_INDEX.md)** - 🆕 **START HERE** - Complete accessibility guide
- **[ADMIN_AUDIT_REMEDIATION_PLAN.md](ADMIN_AUDIT_REMEDIATION_PLAN.md)** - 🆕 Full audit of 30 issues
- **[patches/QUICK_REFERENCE.md](patches/QUICK_REFERENCE.md)** - 🆕 Quick implementation guide
- **[patches/](patches/)** - 🆕 6 production-ready patches (100% coverage)

### Deployment & Release
- **[DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)** - 🆕 **START HERE** - Copy-paste deployment guide
- **[patches/APPLY_VERIFY_MERGE.md](patches/APPLY_VERIFY_MERGE.md)** - 🆕 Complete deployment workflow
- **[RELEASE_NOTES_A11Y.md](RELEASE_NOTES_A11Y.md)** - 🆕 Production release notes
- **[GO_NO_GO_CHECKLIST.md](GO_NO_GO_CHECKLIST.md)** - 🆕 Deployment decision checklist
- **[POST_DEPLOY_SMOKE.md](POST_DEPLOY_SMOKE.md)** - 🆕 Post-deployment verification
- **[.github/pull_request_template.md](.github/pull_request_template.md)** - 🆕 PR template
- **[.github/workflows/a11y.yml](.github/workflows/a11y.yml)** - 🆕 CI/CD workflow

### System Architecture
- **[SYSTEM_FLOW_DIAGRAM.md](SYSTEM_FLOW_DIAGRAM.md)** - Architecture diagrams
- **[MVP_FIXES_COMPLETE.md](MVP_FIXES_COMPLETE.md)** - Production fixes & testing guide

## 👥 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nursery.com | Admin123! |
| Manager | manager@nursery.com | Manager123! |
| Supervisor | supervisor@nursery.com | Supervisor123! |
| Parent | parent@nursery.com | Parent123! |

## 🌐 Access Points

### Login Portals
- **Admin Login**: http://localhost:5174/login
- **Manager Login**: http://localhost:5174/manager-login
- **Supervisor Login**: http://localhost:5174/supervisor-login
- **Parent Login**: http://localhost:5174/parent-login

### API & Documentation
- **Backend API**: http://localhost:8002
- **API Docs (Swagger)**: http://localhost:8002/docs
- **API Docs (ReDoc)**: http://localhost:8002/redoc

## 📦 Requirements

- **Python 3.8+**
- **Node.js 16+**
- **npm**

## 🚀 Manual Setup (Alternative)

If you prefer manual setup instead of the all-in-one runner:

### Backend
```bash
cd nursery-system/backend
python -m venv venv
# Note: If you see a warning that the environment already exists, 
# you can keep using nursery-system/backend/venv or delete that folder 
# first if you ever want to recreate it cleanly.
venv\Scripts\activate    # Windows
pip install -r requirements.txt
python seed_db.py
python run.py
```

### Frontend
```bash
cd nursery-system/frontend
npm install
npm run dev
```

## 🔒 Security

### Authentication & Authorization
- JWT token authentication with rotation
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Multi-role login portals
- Forgot/reset password flows
- Strong password validation

### Protection Mechanisms
- Rate limiting (5 login attempts/minute)
- Brute force protection (account lockout)
- CSRF protection (SameSite cookies)
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection (DOMPurify + bleach)
- Input sanitization on all inputs

### Monitoring & Compliance
- Complete audit logging
- Login attempt tracking
- Token revocation support
- Error boundaries for graceful recovery

## 📊 System Status

- ✅ Backend API: Production-ready
- ✅ Frontend UI: Production-ready
- ✅ **Multi-Role Authentication**: Complete with 4 login portals
- ✅ **Password Management**: Forgot/reset/change flows implemented
- ✅ **Security**: Rate limiting, brute force protection, token rotation
- ✅ **Accessibility**: WCAG 2.1 Level AA compliant (30/30 issues fixed)
- ✅ Database: Seeded with test data
- ✅ Proxy Configuration: Optimized
- ✅ All-in-One Runner: Complete
- ✅ **Testing**: 27+ tests with 40%+ coverage
- ✅ **Audit Logging**: Complete activity tracking
- ✅ **CI/CD**: GitHub Actions workflows
- ✅ **Production Ready**: 9/10 security score

## 🆘 Support

Check logs for debugging:
- Backend: `logs/backend.log`
- Frontend: `logs/frontend.log`

## 📝 License

This project is for Kindergaten_Jo.

## 🎉 Ready to Go!

Everything is set up and ready to use. Just run:
```bash
run-all.bat    # Windows
bash run-all.sh # Linux/Mac
```

**Happy Managing! 🚀**
