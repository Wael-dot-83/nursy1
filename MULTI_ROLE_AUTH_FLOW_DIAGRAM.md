# Multi-Role Authentication System - Flow Diagrams

## 🔐 Authentication Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Access Layer                            │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Admin   │  │ Manager  │  │Supervisor│  │  Parent  │           │
│  │  Portal  │  │  Portal  │  │  Portal  │  │  Portal  │           │
│  │  /login  │  │/manager- │  │/supervisor│  │/parent-  │           │
│  │          │  │  login   │  │  -login  │  │  login   │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
└───────┼─────────────┼─────────────┼─────────────┼───────────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │   Authentication Middleware       │
        │   - Rate Limiter                  │
        │   - CSRF Protection               │
        │   - Role Validator                │
        └─────────────┬─────────────────────┘
                      │
        ┌─────────────▼─────────────────┐
        │   Auth Service Layer          │
        │   - Login Handler             │
        │   - Token Manager             │
        │   - Password Manager          │
        └─────────────┬─────────────────┘
                      │
        ┌─────────────▼─────────────────┐
        │   Database Layer              │
        │   - Users                     │
        │   - Login Attempts            │
        │   - Refresh Tokens            │
        │   - Password Reset Tokens     │
        │   - Audit Logs                │
        └───────────────────────────────┘
```

## 🔄 Login Flow

### Standard Login Process

```
┌─────────┐                                                    ┌─────────┐
│  User   │                                                    │ Backend │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Navigate to role-specific login page                    │
     │     (e.g., /manager-login)                                  │
     │                                                              │
     │  2. Enter email + password                                  │
     │────────────────────────────────────────────────────────────>│
     │     POST /auth/login                                        │
     │     { email, password, role }                               │
     │                                                              │
     │                                    3. Validate credentials  │
     │                                       - Check email exists  │
     │                                       - Verify password     │
     │                                       - Validate role match │
     │                                       - Check account active│
     │                                       - Check not locked    │
     │                                                              │
     │                                    4. Check brute force     │
     │                                       - Count failed attempts│
     │                                       - Check lockout status│
     │                                                              │
     │                                    5. Generate tokens       │
     │                                       - Access token (JWT)  │
     │                                       - Refresh token (JWT) │
     │                                                              │
     │                                    6. Store refresh token   │
     │                                       - Hash token          │
     │                                       - Save to DB          │
     │                                                              │
     │                                    7. Log login attempt     │
     │                                       - Audit log           │
     │                                       - Login attempts table│
     │                                                              │
     │  8. Receive tokens + user data                              │
     │<────────────────────────────────────────────────────────────│
     │     {                                                       │
     │       access_token: "...",                                  │
     │       token_type: "bearer",                                 │
     │       expires_in: 1800,                                     │
     │       user: { id, email, role, ... }                        │
     │     }                                                       │
     │     Set-Cookie: refresh_token=...; HttpOnly                 │
     │                                                              │
     │  9. Store access token in memory                            │
     │     Refresh token stored in httpOnly cookie                 │
     │                                                              │
     │  10. Redirect to role-specific dashboard                    │
     │      - Admin → /admin/dashboard                             │
     │      - Manager → /manager/dashboard                         │
     │      - Supervisor → /supervisor/dashboard                   │
     │      - Parent → /parent/dashboard                           │
     │                                                              │
```

### Failed Login with Brute Force Protection

```
┌─────────┐                                                    ┌─────────┐
│  User   │                                                    │ Backend │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Enter wrong password (Attempt 1-4)                      │
     │────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                    2. Validate credentials  │
     │                                       ❌ Password incorrect │
     │                                                              │
     │                                    3. Increment failed count│
     │                                       failed_attempts++     │
     │                                                              │
     │                                    4. Log failed attempt    │
     │                                       - Audit log           │
     │                                       - Login attempts table│
     │                                                              │
     │  5. Receive error                                           │
     │<────────────────────────────────────────────────────────────│
     │     401 Unauthorized                                        │
     │     "Invalid credentials"                                   │
     │                                                              │
     │  6. Enter wrong password (Attempt 5)                        │
     │────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                    7. Check failed attempts │
     │                                       Count = 5 ❌          │
     │                                                              │
     │                                    8. Lock account          │
     │                                       account_locked_until  │
     │                                       = now + 15 minutes    │
     │                                                              │
     │  9. Receive lockout error                                   │
     │<────────────────────────────────────────────────────────────│
     │     423 Locked                                              │
     │     "Account locked for 15 minutes"                         │
     │                                                              │
     │  10. Wait 15 minutes or contact admin                       │
     │                                                              │
```

## 🔑 Password Reset Flow

### Forgot Password Process

```
┌─────────┐                                                    ┌─────────┐
│  User   │                                                    │ Backend │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Click "Forgot Password" on login page                   │
     │                                                              │
     │  2. Enter email address                                     │
     │────────────────────────────────────────────────────────────>│
     │     POST /auth/forgot-password                              │
     │     { email: "user@example.com" }                           │
     │                                                              │
     │                                    3. Find user by email    │
     │                                       - Check user exists   │
     │                                       - Check user active   │
     │                                                              │
     │                                    4. Generate reset token  │
     │                                       - Random 32-byte token│
     │                                       - Hash token (SHA256) │
     │                                       - 24-hour expiry      │
     │                                                              │
     │                                    5. Store token in DB     │
     │                                       password_reset_tokens │
     │                                                              │
     │                                    6. Send email (or log)   │
     │                                       Reset link:           │
     │                                       /reset-password?      │
     │                                       token=...&email=...   │
     │                                                              │
     │                                    7. Log reset request     │
     │                                       - Audit log           │
     │                                                              │
     │  8. Receive success message                                 │
     │<────────────────────────────────────────────────────────────│
     │     200 OK                                                  │
     │     "Reset link sent to email"                              │
     │     (Generic message for security)                          │
     │                                                              │
     │  9. Check email for reset link                              │
     │     (In dev: check backend logs)                            │
     │                                                              │
```

### Reset Password Process

```
┌─────────┐                                                    ┌─────────┐
│  User   │                                                    │ Backend │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Click reset link from email                             │
     │     /reset-password?token=...&email=...                     │
     │                                                              │
     │  2. Enter new password + confirm                            │
     │────────────────────────────────────────────────────────────>│
     │     POST /auth/reset-password                               │
     │     {                                                       │
     │       token: "...",                                         │
     │       email: "user@example.com",                            │
     │       new_password: "NewPass123!"                           │
     │     }                                                       │
     │                                                              │
     │                                    3. Validate token        │
     │                                       - Hash provided token │
     │                                       - Find in DB          │
     │                                       - Check not expired   │
     │                                       - Check not used      │
     │                                                              │
     │                                    4. Validate password     │
     │                                       - Min 8 characters    │
     │                                       - Upper + lower case  │
     │                                       - Number + special    │
     │                                                              │
     │                                    5. Update password       │
     │                                       - Hash new password   │
     │                                       - Update user record  │
     │                                       - Mark token as used  │
     │                                                              │
     │                                    6. Revoke all tokens     │
     │                                       - Invalidate refresh  │
     │                                       - Force re-login      │
     │                                                              │
     │                                    7. Log password reset    │
     │                                       - Audit log           │
     │                                       - Update user stats   │
     │                                                              │
     │  8. Receive success message                                 │
     │<────────────────────────────────────────────────────────────│
     │     200 OK                                                  │
     │     "Password reset successfully"                           │
     │                                                              │
     │  9. Redirect to login page                                  │
     │     Login with new password                                 │
     │                                                              │
```

## 🔄 Token Refresh Flow

### Access Token Refresh Process

```
┌─────────┐                                                    ┌─────────┐
│ Client  │                                                    │ Backend │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Access token expires (30 minutes)                       │
     │                                                              │
     │  2. API request fails with 401                              │
     │<────────────────────────────────────────────────────────────│
     │     401 Unauthorized                                        │
     │     "Token expired"                                         │
     │                                                              │
     │  3. Request new access token                                │
     │────────────────────────────────────────────────────────────>│
     │     POST /auth/refresh                                      │
     │     Cookie: refresh_token=...                               │
     │                                                              │
     │                                    4. Validate refresh token│
     │                                       - Verify JWT signature│
     │                                       - Check not expired   │
     │                                       - Find in DB          │
     │                                       - Check not revoked   │
     │                                                              │
     │                                    5. Revoke old token      │
     │                                       (Token rotation)      │
     │                                                              │
     │                                    6. Generate new tokens   │
     │                                       - New access token    │
     │                                       - New refresh token   │
     │                                                              │
     │                                    7. Store new refresh     │
     │                                       - Hash token          │
     │                                       - Save to DB          │
     │                                                              │
     │  8. Receive new tokens                                      │
     │<────────────────────────────────────────────────────────────│
     │     {                                                       │
     │       access_token: "...",                                  │
     │       token_type: "bearer",                                 │
     │       expires_in: 1800                                      │
     │     }                                                       │
     │     Set-Cookie: refresh_token=...; HttpOnly                 │
     │                                                              │
     │  9. Retry original API request                              │
     │     with new access token                                   │
     │                                                              │
```

## 🔐 Change Password Flow

### Authenticated Password Change

```
┌─────────┐                                                    ┌─────────┐
│  User   │                                                    │ Backend │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Navigate to Change Password page                        │
     │     (Requires authentication)                               │
     │                                                              │
     │  2. Enter current + new password                            │
     │────────────────────────────────────────────────────────────>│
     │     POST /auth/password/change                              │
     │     Authorization: Bearer <access_token>                    │
     │     {                                                       │
     │       current_password: "OldPass123!",                      │
     │       new_password: "NewPass123!"                           │
     │     }                                                       │
     │                                                              │
     │                                    3. Verify access token   │
     │                                       - Validate JWT        │
     │                                       - Get user from token │
     │                                                              │
     │                                    4. Verify current password│
     │                                       - Compare with hash   │
     │                                       ✅ Must match         │
     │                                                              │
     │                                    5. Validate new password │
     │                                       - Min 8 characters    │
     │                                       - Complexity rules    │
     │                                       - Not same as current │
     │                                                              │
     │                                    6. Update password       │
     │                                       - Hash new password   │
     │                                       - Update user record  │
     │                                                              │
     │                                    7. Revoke all tokens     │
     │                                       - Security measure    │
     │                                       - Force re-login      │
     │                                                              │
     │                                    8. Log password change   │
     │                                       - Audit log           │
     │                                       - Update user stats   │
     │                                                              │
     │  9. Receive success message                                 │
     │<────────────────────────────────────────────────────────────│
     │     200 OK                                                  │
     │     "Password changed. Please login again"                  │
     │                                                              │
     │  10. Redirect to login page                                 │
     │      Login with new password                                │
     │                                                              │
```

## 🛡️ Security Layers

### Multi-Layer Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Network                          │
│  - HTTPS (Production)                                        │
│  - CORS Configuration                                        │
│  - Secure Headers                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Layer 2: Rate Limiting                    │
│  - Login: 5 attempts/minute per IP                           │
│  - Password Reset: 3 requests/hour per email                 │
│  - Token Refresh: 10 requests/minute per user                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Layer 3: CSRF Protection                  │
│  - SameSite Cookies                                          │
│  - CSRF Tokens                                               │
│  - Origin Validation                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Layer 4: Authentication                   │
│  - JWT Token Validation                                      │
│  - Token Expiry Check                                        │
│  - Token Revocation Check                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Layer 5: Authorization                    │
│  - Role-Based Access Control                                 │
│  - Resource Ownership Check                                  │
│  - Permission Validation                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Layer 6: Input Validation                 │
│  - Schema Validation (Pydantic)                              │
│  - Input Sanitization                                        │
│  - SQL Injection Prevention (ORM)                            │
│  - XSS Prevention (DOMPurify)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Layer 7: Audit Logging                    │
│  - All Authentication Events                                 │
│  - Failed Login Attempts                                     │
│  - Password Changes                                          │
│  - Token Operations                                          │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema Relationships

### Authentication Tables

```
┌─────────────────────────────────────────────────────────────┐
│                         users                                │
├─────────────────────────────────────────────────────────────┤
│ PK  id                                                       │
│     email (unique, indexed)                                  │
│     email_normalized (unique, indexed)                       │
│     hashed_password                                          │
│     role (indexed)                                           │
│     is_active                                                │
│     failed_login_attempts                                    │
│     account_locked_until                                     │
│     last_password_reset                                      │
│     password_reset_count                                     │
│     nursery_id (FK, indexed)                                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────────────────────────────────┐
             │                                          │
┌────────────▼────────────────┐    ┌──────────────────▼──────┐
│   password_reset_tokens     │    │    refresh_tokens       │
├─────────────────────────────┤    ├─────────────────────────┤
│ PK  id                      │    │ PK  id                  │
│ FK  user_id (indexed)       │    │ FK  user_id (indexed)   │
│     token_hash (unique)     │    │     token_hash          │
│     expires_at (indexed)    │    │     revoked             │
│     used                    │    │     expires_at (indexed)│
│     created_at              │    │     created_at          │
└─────────────────────────────┘    └─────────────────────────┘
             │
             │
┌────────────▼────────────────┐    ┌─────────────────────────┐
│      login_attempts         │    │      audit_logs         │
├─────────────────────────────┤    ├─────────────────────────┤
│ PK  id                      │    │ PK  id                  │
│     email (indexed)         │    │ FK  user_id (indexed)   │
│     ip_address (indexed)    │    │     action (indexed)    │
│     success                 │    │     resource_type       │
│     failure_reason          │    │     resource_id         │
│     attempted_at (indexed)  │    │     details (JSON)      │
└─────────────────────────────┘    │     ip_address          │
                                   │     user_agent          │
                                   │     created_at (indexed)│
                                   └─────────────────────────┘
```

## 🎯 Role-Based Access Matrix

```
┌──────────────┬───────┬─────────┬────────────┬────────┐
│   Resource   │ Admin │ Manager │ Supervisor │ Parent │
├──────────────┼───────┼─────────┼────────────┼────────┤
│ Users        │  CRUD │   R     │     -      │   -    │
│ Nurseries    │  CRUD │   R     │     -      │   -    │
│ Branches     │  CRUD │  CRUD   │     R      │   -    │
│ Children     │  CRUD │  CRUD   │    CRUD    │   R    │
│ Attendance   │  CRUD │  CRUD   │    CRUD    │   R    │
│ Reports      │  CRUD │  CRUD   │    CRUD    │   R    │
│ Audit Logs   │   R   │   R     │     -      │   -    │
│ Settings     │  CRUD │   R     │     -      │   -    │
│ Notifications│  CRUD │  CRUD   │    CRUD    │   R    │
└──────────────┴───────┴─────────┴────────────┴────────┘

Legend:
C = Create
R = Read
U = Update
D = Delete
- = No Access
```

---

**Documentation Version**: 2.0.0
**Last Updated**: 2024
**Status**: ✅ Complete
