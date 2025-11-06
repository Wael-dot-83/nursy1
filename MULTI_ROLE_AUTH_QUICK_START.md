# Multi-Role Authentication System - Quick Start Guide

## 🚀 Getting Started

### 1. Start the System

```bash
# Windows
cd d:\nursy
run-all.bat

# Linux/Mac
cd /d/nursy
bash run-all.sh
```

### 2. Access Login Pages

The system now has **4 separate login portals** for different user roles:

| Role | URL | Test Account |
|------|-----|--------------|
| **Admin** | http://localhost:5174/login | admin@nursery.com / Admin123! |
| **Manager** | http://localhost:5174/manager-login | manager@nursery.com / Manager123! |
| **Supervisor** | http://localhost:5174/supervisor-login | supervisor@nursery.com / Supervisor123! |
| **Parent** | http://localhost:5174/parent-login | parent@nursery.com / Parent123! |

## 🔐 Password Management Features

### Forgot Password Flow

1. **Go to any login page** and click "Forgot Password"
2. **Enter your email address**
3. **Check console/logs** for reset token (in development mode)
4. **Use the reset link** to set a new password

**API Endpoint**: `POST /api/auth/forgot-password`

```bash
curl -X POST http://localhost:8002/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@nursery.com"}'
```

### Reset Password Flow

1. **Click the reset link** from email (or use token from logs)
2. **Enter new password** (must meet strength requirements)
3. **Confirm password**
4. **Submit** - you'll be redirected to login

**API Endpoint**: `POST /api/auth/reset-password`

```bash
curl -X POST http://localhost:8002/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN",
    "email": "admin@nursery.com",
    "new_password": "NewPassword123!"
  }'
```

### Change Password (After Login)

1. **Login to your account**
2. **Navigate to Profile** or **Settings**
3. **Click "Change Password"**
4. **Enter current password**
5. **Enter new password** and confirm
6. **Submit** - you'll be logged out and need to login again

**API Endpoint**: `POST /api/auth/password/change`

```bash
curl -X POST http://localhost:8002/auth/password/change \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword123!"
  }'
```

## 🔒 Password Requirements

All passwords must meet these criteria:

- ✅ Minimum **8 characters**
- ✅ At least **1 uppercase** letter (A-Z)
- ✅ At least **1 lowercase** letter (a-z)
- ✅ At least **1 number** (0-9)
- ✅ At least **1 special character** (!@#$%^&*)

**Examples of valid passwords:**
- `Admin123!`
- `Manager@2024`
- `Supervisor#Pass1`
- `Parent$ecure9`

## 🎯 Testing the System

### Test Scenario 1: Role-Based Login

```bash
# Test Admin Login
curl -X POST http://localhost:8002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nursery.com",
    "password": "Admin123!",
    "role": "admin"
  }'

# Test Manager Login
curl -X POST http://localhost:8002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@nursery.com",
    "password": "Manager123!",
    "role": "manager"
  }'
```

### Test Scenario 2: Wrong Role Access

```bash
# Try to login as Manager with Admin credentials (should fail)
curl -X POST http://localhost:8002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nursery.com",
    "password": "Admin123!",
    "role": "manager"
  }'

# Expected: 403 Forbidden - "Access denied. This login is for managers only."
```

### Test Scenario 3: Password Reset

```bash
# Step 1: Request password reset
curl -X POST http://localhost:8002/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@nursery.com"}'

# Step 2: Check backend logs for reset token
# Look for: "PASSWORD RESET TOKEN for admin@nursery.com: <TOKEN>"

# Step 3: Reset password with token
curl -X POST http://localhost:8002/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<TOKEN_FROM_LOGS>",
    "email": "admin@nursery.com",
    "new_password": "NewAdmin123!"
  }'

# Step 4: Login with new password
curl -X POST http://localhost:8002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nursery.com",
    "password": "NewAdmin123!"
  }'
```

### Test Scenario 4: Brute Force Protection

```bash
# Try 6 failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:8002/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@nursery.com",
      "password": "WrongPassword"
    }'
  echo "\nAttempt $i"
done

# Expected: After 5 attempts, account locked for 15 minutes
# Response: 423 Locked - "Account locked due to too many failed login attempts"
```

## 📊 API Endpoints Reference

### Authentication Endpoints

```
POST   /api/auth/login                    # Login with email/password
POST   /api/auth/refresh                  # Refresh access token
POST   /api/auth/logout                   # Logout and revoke tokens
GET    /api/auth/me                       # Get current user info
```

### Password Management Endpoints

```
POST   /api/auth/password/change          # Change password (requires auth)
POST   /api/auth/forgot-password          # Request password reset
POST   /api/auth/reset-password           # Reset password with token
```

### Admin Endpoints

```
POST   /api/auth/admin/revoke-tokens/{id} # Revoke user tokens (admin only)
```

## 🔍 Monitoring & Debugging

### Check Backend Logs

```bash
# View backend logs
tail -f d:\nursy\nursery-system\backend\logs\app.log

# View frontend logs
tail -f d:\nursy\logs\frontend.log
```

### Check Database

```bash
# Connect to SQLite database
cd d:\nursy\nursery-system\backend
sqlite3 storage/nursery.db

# View users
SELECT id, email, role, is_active, failed_login_attempts, account_locked_until FROM users;

# View login attempts
SELECT * FROM login_attempts ORDER BY attempted_at DESC LIMIT 10;

# View password reset tokens
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 10;

# View refresh tokens
SELECT * FROM refresh_tokens WHERE revoked = 0 ORDER BY created_at DESC LIMIT 10;
```

### Check Audit Logs

```bash
# View audit logs in database
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;

# Or use the Admin Dashboard
# Navigate to: http://localhost:5174/admin/audit-logs
```

## 🛡️ Security Features

### Rate Limiting

```
Login attempts:        5 per minute per IP
Password reset:        3 per hour per email
Token refresh:         10 per minute per user
```

### Account Lockout

```
Failed attempts:       5 attempts
Lockout duration:      15 minutes
Automatic unlock:      After lockout period expires
```

### Token Expiry

```
Access Token:          30 minutes
Refresh Token:         7 days
Reset Token:           24 hours
```

## 🚨 Common Issues & Solutions

### Issue 1: "Account locked" message

**Solution**: Wait 15 minutes or use admin panel to unlock:

```bash
# Admin can unlock via database
sqlite3 storage/nursery.db
UPDATE users SET account_locked_until = NULL, failed_login_attempts = 0 WHERE email = 'user@example.com';
```

### Issue 2: "Invalid or expired reset token"

**Solution**: Request a new password reset link. Tokens expire after 24 hours.

### Issue 3: "Password does not meet requirements"

**Solution**: Ensure password has:
- At least 8 characters
- 1 uppercase, 1 lowercase, 1 number, 1 special character

### Issue 4: "Role mismatch" error

**Solution**: Use the correct login page for your role:
- Admin → `/login`
- Manager → `/manager-login`
- Supervisor → `/supervisor-login`
- Parent → `/parent-login`

## 📱 Mobile/Responsive Support

All login pages are fully responsive and work on:
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768x1024+)
- ✅ Mobile (375x667+)

## 🌐 Multi-Language Support

The system supports:
- 🇬🇧 English
- 🇸🇦 Arabic (RTL)

Switch language using the button in the top-right corner of any login page.

## 📞 Support

For technical support:
1. Check logs: `logs/backend.log`, `logs/frontend.log`
2. Review API docs: http://localhost:8002/docs
3. Check audit logs: Admin Dashboard → Audit Logs

## ✅ Production Checklist

Before deploying to production:

- [ ] Set strong `SECRET_KEY` in environment variables
- [ ] Configure SMTP for email notifications
- [ ] Enable HTTPS and secure cookies
- [ ] Set up proper CORS configuration
- [ ] Configure rate limiting for production load
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Backup database regularly
- [ ] Test all authentication flows
- [ ] Review and update password policies

---

**System Status**: ✅ Production Ready
**Version**: 2.0.0
**Documentation**: Complete
