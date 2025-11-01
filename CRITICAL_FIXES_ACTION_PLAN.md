# Critical Fixes Action Plan
**Generated**: 2025-11-01
**Priority**: BLOCKING - Must complete before production deployment

---

## Executive Summary

This document outlines the **critical fixes** required to make the Nursery Management System production-ready. All items are **blocking** issues that pose security risks or deployment failures.

**Estimated Total Effort**: 80-100 hours
**Timeline**: 2-3 weeks
**Team Size**: 2-3 developers

---

## Phase 1: Backend Cleanup & Database Migrations (Days 1-3)

### 1.1 Remove Duplicate Express Backend ✅
**Priority**: CRITICAL
**Effort**: 2 hours
**Risk**: Low (code already migrated to FastAPI)

**Actions**:
```bash
# Delete entire Express/Node.js implementation
rm -rf nursery-system/backend/src/
rm -f nursery-system/backend/package.json
rm -f nursery-system/backend/package-lock.json
rm -f nursery-system/backend/tsconfig.json
rm -f nursery-system/backend/prisma.config.ts
rm -rf nursery-system/backend/prisma/

# Clean up any remaining Node artifacts
find nursery-system/backend -name "node_modules" -type d -exec rm -rf {} +
```

**Verification**:
- [ ] No TypeScript files remain in backend/
- [ ] No package.json in backend/
- [ ] Backend starts with `uvicorn app.main:app` without errors
- [ ] All API endpoints respond correctly

---

### 1.2 Initialize Alembic Database Migrations ✅
**Priority**: CRITICAL
**Effort**: 8 hours
**Risk**: Medium (requires careful schema capture)

**Step 1: Initialize Alembic**
```bash
cd nursery-system/backend
alembic init alembic
```

**Step 2: Configure Alembic** (`alembic.ini`)
```ini
sqlalchemy.url = driver://user:pass@localhost/dbname
# Will be overridden by env.py using settings.DATABASE_URL
```

**Step 3: Update `alembic/env.py`**
- Import models from `app.models`
- Use `settings.DATABASE_URL` for connection
- Set `target_metadata = Base.metadata`

**Step 4: Create Initial Migration**
```bash
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

**Step 5: Add Unique Constraints Migration**
```bash
alembic revision -m "Add unique constraints for daily reports and attendance"
```

**Constraints to Add**:
- `UNIQUE(child_id, date)` on `daily_reports`
- `UNIQUE(child_id, date)` on `attendance`

**Verification**:
- [ ] `alembic/versions/` contains initial migration
- [ ] Migration runs successfully on clean database
- [ ] Downgrade/upgrade works bidirectionally
- [ ] All indexes and constraints created

---

## Phase 2: Security Hardening (Days 4-8)

### 2.1 Fix Token Storage (Move to HttpOnly Cookies) ✅
**Priority**: CRITICAL
**Effort**: 12 hours
**Risk**: High (breaks existing frontend)

**Backend Changes** (`auth_router.py`):

**A. Update Login Response**
```python
from fastapi import Response
from fastapi.responses import JSONResponse

@router.post("/login")
async def login(
    response: Response,
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    # ... authentication logic ...

    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # HTTPS only in production
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/auth/refresh"
    )

    # Return only access token in response body
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 900,  # 15 minutes
        "user": user_response
    }
```

**B. Add Refresh Token Endpoint**
```python
@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    # Read refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(401, "No refresh token")

    # Verify and generate new tokens
    # ... verification logic ...

    # Set new refresh token (rotation)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/auth/refresh"
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": 900
    }
```

**C. Add Logout Endpoint**
```python
@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Clear refresh token cookie
    response.delete_cookie(key="refresh_token", path="/auth/refresh")

    # Revoke tokens in database
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id
    ).update({"revoked": True})
    db.commit()

    return {"message": "Logged out successfully"}
```

**Frontend Changes** (`AuthContext.jsx`):

**A. Remove localStorage Usage**
```jsx
// OLD - DELETE THIS
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);

// NEW - Store only access token in memory
const [accessToken, setAccessToken] = useState(null);
```

**B. Implement Token Refresh**
```jsx
const refreshAccessToken = async () => {
  try {
    const response = await axios.post('/auth/refresh', {}, {
      withCredentials: true  // Send cookies
    });

    setAccessToken(response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    // Refresh failed, logout user
    logout();
    return null;
  }
};
```

**C. Update API Client** (`apiClient.js`):
```jsx
// Add response interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
```

**Verification**:
- [ ] Refresh tokens stored in httpOnly cookies
- [ ] Access tokens kept in memory only
- [ ] Token refresh works automatically on 401
- [ ] Logout clears cookies and revokes tokens
- [ ] XSS attacks cannot steal refresh tokens

---

### 2.2 Implement Token Revocation ✅
**Priority**: HIGH
**Effort**: 6 hours
**Risk**: Low

**A. Add Revocation Check to Dependencies**
```python
# dependencies.py
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_token(token, "access")

    if not payload:
        raise HTTPException(401, "Invalid token")

    # Check if token is revoked (jti = JWT ID)
    jti = payload.get("jti")
    if jti:
        revoked = db.query(RefreshToken).filter(
            RefreshToken.token_hash == jti,
            RefreshToken.revoked == True
        ).first()

        if revoked:
            raise HTTPException(401, "Token has been revoked")

    # ... rest of verification ...
```

**B. Add JTI to JWT Tokens**
```python
# security.py
import uuid

def create_access_token(user_id: int) -> str:
    jti = str(uuid.uuid4())  # Unique token ID
    payload = {
        "sub": str(user_id),
        "jti": jti,
        "exp": datetime.utcnow() + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, settings.JWT_ACCESS_SECRET, algorithm="HS256")
```

**C. Add Admin Endpoint to Revoke User Tokens**
```python
@router.post("/admin/users/{user_id}/revoke-tokens")
async def revoke_user_tokens(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Revoke all tokens for a user (e.g., compromised account)"""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id
    ).update({"revoked": True})
    db.commit()

    return {"message": f"All tokens revoked for user {user_id}"}
```

**Verification**:
- [ ] Revoked tokens rejected by API
- [ ] Admin can revoke user tokens
- [ ] Logout revokes tokens properly

---

### 2.3 Add CSRF Protection ✅
**Priority**: HIGH
**Effort**: 8 hours
**Risk**: Medium

**A. Install CSRF Middleware**
```bash
pip install fastapi-csrf-protect
```

**B. Configure CSRF in main.py**
```python
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel

class CsrfSettings(BaseModel):
    secret_key: str = settings.SECRET_KEY
    cookie_samesite: str = "lax"
    cookie_secure: bool = not settings.debug
    cookie_httponly: bool = True

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()
```

**C. Protect State-Changing Endpoints**
```python
from fastapi_csrf_protect import CsrfProtect

@router.post("/users")
async def create_user(
    user_data: dict,
    csrf_protect: CsrfProtect = Depends(),
    db: Session = Depends(get_db)
):
    csrf_protect.validate_csrf(request)  # Validate CSRF token
    # ... rest of logic ...
```

**D. Update Frontend to Send CSRF Token**
```jsx
// Get CSRF token from cookie
const getCsrfToken = () => {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
};

// Add to API client
axios.defaults.headers.common['X-CSRF-Token'] = getCsrfToken();
```

**Verification**:
- [ ] CSRF tokens generated on login
- [ ] POST/PUT/DELETE requests require CSRF token
- [ ] Requests without token rejected
- [ ] GET requests not affected

---

### 2.4 Add Brute-Force Protection ✅
**Priority**: MEDIUM
**Effort**: 6 hours
**Risk**: Low

**A. Create Login Attempt Tracking**
```python
# New model in models.py
class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True)
    email = Column(String(150), nullable=False, index=True)
    ip_address = Column(String(50), nullable=False)
    success = Column(Boolean, default=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)
```

**B. Add Rate Limiting to Login**
```python
from datetime import timedelta

@router.post("/login")
async def login(
    request: Request,
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host
    email = credentials.email

    # Check failed attempts in last 15 minutes
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
    failed_attempts = db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == False,
        LoginAttempt.attempted_at >= fifteen_mins_ago
    ).count()

    if failed_attempts >= 5:
        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Try again in 15 minutes."
        )

    # ... authentication logic ...

    # Log attempt
    attempt = LoginAttempt(
        email=email,
        ip_address=ip_address,
        success=user_authenticated
    )
    db.add(attempt)
    db.commit()
```

**Verification**:
- [ ] 5 failed attempts locks account for 15 minutes
- [ ] Successful login resets counter
- [ ] Different IPs tracked separately

---

## Phase 3: Database Constraints (Days 9-10)

### 3.1 Add Unique Constraints ✅
**Priority**: HIGH
**Effort**: 4 hours
**Risk**: Low

**Create Migration File**:
```bash
alembic revision -m "Add unique constraints"
```

**Migration Content**:
```python
def upgrade():
    # Add unique constraint to daily_reports
    op.create_unique_constraint(
        'uq_daily_reports_child_date',
        'daily_reports',
        ['child_id', 'date']
    )

    # Add unique constraint to attendance
    op.create_unique_constraint(
        'uq_attendance_child_date',
        'attendance',
        ['child_id', 'date']
    )

def downgrade():
    op.drop_constraint('uq_daily_reports_child_date', 'daily_reports')
    op.drop_constraint('uq_attendance_child_date', 'attendance')
```

**Update API Error Handling**:
```python
from sqlalchemy.exc import IntegrityError

@router.post("/reports")
async def create_report(report_data: dict, db: Session = Depends(get_db)):
    try:
        # ... create report ...
        db.commit()
    except IntegrityError as e:
        if 'uq_daily_reports_child_date' in str(e):
            raise HTTPException(
                status_code=409,
                detail="A report already exists for this child on this date"
            )
        raise
```

**Verification**:
- [ ] Cannot create duplicate reports for same child/date
- [ ] Cannot create duplicate attendance for same child/date
- [ ] API returns 409 Conflict with clear message

---

## Phase 4: Frontend Security Updates (Days 11-12)

### 4.1 Update Authentication Context ✅
**Priority**: HIGH
**Effort**: 8 hours
**Risk**: High (breaks existing auth)

**See Section 2.1 for detailed implementation**

**Additional Frontend Changes**:

**A. Add Token Expiry Tracking**
```jsx
const [tokenExpiry, setTokenExpiry] = useState(null);

useEffect(() => {
  if (!accessToken) return;

  // Decode token to get expiry
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  const expiryTime = payload.exp * 1000;

  setTokenExpiry(expiryTime);

  // Refresh token 1 minute before expiry
  const refreshTime = expiryTime - Date.now() - 60000;
  const timer = setTimeout(() => {
    refreshAccessToken();
  }, refreshTime);

  return () => clearTimeout(timer);
}, [accessToken]);
```

**B. Add CSRF Token Management**
```jsx
// Extract CSRF token from meta tag or cookie
const getCsrfToken = () => {
  // Check meta tag first
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.getAttribute('content');

  // Fallback to cookie
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
};

// Update axios defaults
axios.defaults.headers.common['X-CSRF-Token'] = getCsrfToken();
```

**Verification**:
- [ ] Login flow works with new cookie-based tokens
- [ ] Token refresh happens automatically
- [ ] Logout clears all tokens
- [ ] CSRF tokens sent with mutations
- [ ] No tokens in localStorage

---

## Phase 5: Testing & Verification (Days 13-15)

### 5.1 Security Testing Checklist ✅

**Authentication Tests**:
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails
- [ ] 5 failed login attempts blocks account
- [ ] Account unblocks after 15 minutes
- [ ] Refresh token rotation works
- [ ] Expired tokens rejected
- [ ] Revoked tokens rejected
- [ ] Logout clears all tokens

**Authorization Tests**:
- [ ] Parents cannot access other parents' data
- [ ] Supervisors cannot access admin endpoints
- [ ] Managers can only access their nursery
- [ ] Admins can access all resources

**CSRF Tests**:
- [ ] POST without CSRF token rejected
- [ ] PUT without CSRF token rejected
- [ ] DELETE without CSRF token rejected
- [ ] GET requests work without CSRF token
- [ ] CSRF token refresh on rotation

**Database Tests**:
- [ ] Cannot create duplicate daily reports
- [ ] Cannot create duplicate attendance records
- [ ] Migrations run cleanly on fresh database
- [ ] Downgrade/upgrade migrations work

**Token Storage Tests**:
- [ ] Refresh tokens in httpOnly cookies
- [ ] Access tokens not in localStorage
- [ ] XSS cannot access refresh tokens
- [ ] Token refresh works across browser tabs

---

## Rollback Plan

If any critical issue arises during implementation:

### Rollback Step 1: Backend
```bash
git revert <commit-hash>
git push origin main
```

### Rollback Step 2: Database
```bash
alembic downgrade -1  # Downgrade one migration
```

### Rollback Step 3: Frontend
```bash
git revert <commit-hash>
npm run build
```

### Emergency Hotfix
If production is affected:
1. Immediately rollback to last known good commit
2. Restore database from backup
3. Clear Redis cache
4. Restart all services
5. Verify health checks

---

## Success Criteria

All items must be checked before considering phase complete:

### Backend ✅
- [ ] Express backend completely removed
- [ ] Alembic migrations initialized and working
- [ ] Initial migration captures all tables
- [ ] Unique constraints added via migration
- [ ] Token revocation implemented
- [ ] CSRF protection active
- [ ] Brute-force protection active
- [ ] All endpoints still functional

### Frontend ✅
- [ ] Tokens moved to httpOnly cookies
- [ ] Token refresh automatic
- [ ] CSRF tokens sent with requests
- [ ] Login flow updated
- [ ] Logout flow updated
- [ ] No localStorage token usage
- [ ] All pages still functional

### Security ✅
- [ ] No XSS token theft possible
- [ ] CSRF attacks prevented
- [ ] Brute-force attacks mitigated
- [ ] Token revocation working
- [ ] Audit logs capture security events

### Database ✅
- [ ] Migrations versioned
- [ ] Unique constraints enforced
- [ ] No duplicate data possible
- [ ] Rollback capability verified

---

## Post-Implementation Tasks

After all critical fixes complete:

1. **Update Documentation**
   - Update API_DOCUMENTATION.md with new auth flow
   - Update SETUP_GUIDE.md with migration steps
   - Update SECURITY.md with new security features
   - Update CHANGELOG.md with all changes

2. **Security Audit**
   - Run OWASP ZAP security scan
   - Perform penetration testing
   - Review all TODO comments
   - Update security policy

3. **Performance Testing**
   - Load test auth endpoints
   - Verify token refresh under load
   - Check database migration performance

4. **Deployment**
   - Update deployment checklist
   - Update environment variables
   - Update Docker configurations
   - Update CI/CD pipeline

---

## Contact & Support

**Project Lead**: [Your Name]
**Security Lead**: [Name]
**Database Lead**: [Name]

**Emergency Contact**: [Email/Phone]

---

**Document Version**: 1.0
**Last Updated**: 2025-11-01
**Next Review**: After Phase 5 completion
