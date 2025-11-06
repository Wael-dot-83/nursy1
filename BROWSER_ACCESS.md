# 🌐 Browser Access Points

## Main Application
**Frontend Application**
- URL: http://localhost:4173
- Status: ✅ RUNNING
- What: Main user interface for the nursery system
- Who: Admin, Director, Manager users

## API Documentation
**Swagger/OpenAPI Docs**
- URL: http://localhost:8000/docs
- Status: ✅ AVAILABLE
- What: Interactive API documentation
- Use: Test API endpoints directly, see request/response schemas

## Backend Health
**Health Check Endpoint**
- URL: http://localhost:8000/health
- Status: ✅ HEALTHY
- What: Backend service health status
- Response: `{"status":"healthy","timestamp":"..."}`

## Database Admin (Optional)
**Adminer Web Interface**
- URL: http://localhost:8080
- Status: ✅ AVAILABLE (if started with `--profile admin`)
- What: Database management interface
- Credentials:
  - System: PostgreSQL
  - Server: db
  - Username: nursery_user
  - Password: nursery_password
  - Database: nursery_db

---

## Quick Links

Click to open:
- [Frontend Application](http://localhost:4173)
- [API Documentation](http://localhost:8000/docs)
- [Backend Health](http://localhost:8000/health)

---

## Login Credentials

### System Administrator
```
Email: admin@example.com
Password: Admin123!
```

After creating a nursery, you'll get:
- 1 Director account
- 2+ Manager accounts (one per branch)

All will have temporary passwords shown in the credentials modal.

---

## Testing Flow

1. **Open Frontend** → http://localhost:4173
2. **Login as Admin** → Use credentials above
3. **Create Nursery** → Add 2 branches
4. **Copy Credentials** → From the modal
5. **Test Director** → Login with director credentials
6. **Test Manager** → Login with manager credentials

---

## Status Check Commands

```powershell
# Check all services
.\nursy.bat ps

# Check health
.\nursy.bat health

# View logs
.\nursy.bat logs
```

---

**Ready!** Open http://localhost:4173 in your browser and start testing! 🚀
