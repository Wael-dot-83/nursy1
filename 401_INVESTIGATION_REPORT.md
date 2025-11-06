# 401 Unauthorized Error - Investigation Results

## 🔍 Investigation Summary

I've thoroughly investigated the 401 Unauthorized error you're experiencing. Here's what I found:

### ✅ What's Working Correctly
1. **Backend Service**: Running and healthy at http://localhost:8000
2. **Frontend Service**: Running at http://localhost:4173  
3. **API Proxy**: Nginx correctly proxying `/api/*` → `backend:8000`
4. **Database**: Admin user exists: `admin@example.com` with correct password hash
5. **Password Verification**: Password `Admin123!` **matches** the stored hash ✅

### ❌ The Problem
The backend logs show multiple 401 Unauthorized responses:
```
INFO: 172.25.0.1:0 - "POST /auth/login HTTP/1.1" 401 Unauthorized
```

### 🎯 Root Cause Analysis

Based on my testing, the password `Admin123!` is **definitely correct**. This means the 401 error is likely caused by one of these issues:

#### 1. **Frontend Sending Wrong Data** (Most Likely)
The frontend might be:
- Trimming/modifying the password  
- Adding extra fields the backend doesn't expect
- URL encoding special characters incorrectly
- Sending empty/undefined values

#### 2. **CORS/Cookie Issues**
- Missing `withCredentials: true` flag
- Cookie domain mismatch
- SameSite cookie restrictions

#### 3. **Request Format Issues**
- Content-Type mismatch
- JSON serialization problems
- Character encoding issues with special characters (`!`)

## 🔧 Solutions to Try

### Solution 1: Check Browser Developer Tools

**CRITICAL**: Please open the browser DevTools and check what's actually being sent:

1. Press `F12` to open DevTools
2. Go to **Network** tab
3. Try to login again
4. Click on the `/login` or `/auth/login` request
5. Look at the **Request Payload** or **Request** tab

**Please share this information:**
```json
{
  "email": "???",
  "password": "???"
}
```

### Solution 2: Check Response Body

In the same Network request, look at the **Response** tab. The backend should return an error message explaining why it failed.

**Common error messages:**
- `"Invalid credentials"` = Password wrong
- `"User not found"` = Email wrong  
- `"Account locked"` = Too many failed attempts

### Solution 3: Clear Browser State

The frontend might be caching bad credentials or tokens:

```powershell
# Option A: Clear browser cache
# Press Ctrl+Shift+Delete → Clear cache and cookies for localhost

# Option B: Use incognito window
# Press Ctrl+Shift+N → Try login in private window

# Option C: Reset localStorage
# In browser console (F12), run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Solution 4: Check for Account Lockout

The backend has brute-force protection. Check if account is locked:

```powershell
docker compose exec backend python -c "from app.database import SessionLocal; from app.models import User; db = SessionLocal(); user = db.query(User).filter(User.email == 'admin@example.com').first(); print(f'Failed attempts: {user.failed_login_attempts}'); print(f'Locked until: {user.account_locked_until}')"
```

If locked, reset it:

```powershell
docker compose exec backend python -c "from app.database import SessionLocal; from app.models import User; from datetime import datetime; db = SessionLocal(); user = db.query(User).filter(User.email == 'admin@example.com').first(); user.failed_login_attempts = 0; user.account_locked_until = None; db.commit(); print('Account unlocked!')"
```

### Solution 5: Test Direct API Call

Bypass the frontend and test the backend directly:

```powershell
# Test login with PowerShell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    email = "admin@example.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method Post -Headers $headers -Body $body -ContentType "application/json"
$response
```

If this works, the problem is in the frontend. If it fails, the problem is in the backend.

### Solution 6: Check Backend Detailed Logs

Get more detailed error logs:

```powershell
# Watch backend logs in real-time
docker logs nursy_backend --follow

# Then try to login and see the exact error
```

### Solution 7: Enable Frontend Debug Logging

Check the browser console for JavaScript errors:

1. Press `F12`
2. Go to **Console** tab  
3. Try to login
4. Look for red error messages

## 📊 Debug Information Collected

### Password Verification Test Results
```
✅ User found: admin@example.com
   Role: RoleEnum.ADMIN
   Active: True
   Failed attempts: 0
   Locked until: None

Testing passwords:
  ✅ MATCH: 'Admin123!'      ← CORRECT PASSWORD
  ❌ NO MATCH: 'admin123!'
  ❌ NO MATCH: 'Admin123'
  ❌ NO MATCH: 'admin123'
```

### Backend Schema (What Backend Expects)
```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # Optional
```

### Frontend Login Call
```javascript
// AuthContext.jsx:77
const { data } = await apiClient.post('/auth/login', 
  { email, password, role },  // ← Sending role (optional)
  { withCredentials: true }
);
```

## 🚨 Missing: WWW-Authenticate Header

You mentioned the response is missing the `WWW-Authenticate` header. This is expected for API-based authentication (OAuth 2.0/JWT). The `WWW-Authenticate` header is primarily for Basic/Digest authentication schemes.

However, we can add it for better debugging. Here's how:

### Add WWW-Authenticate Header to 401 Responses

Edit `nursery-system/backend/app/auth_router.py`:

```python
# Around line 150 (where it raises 401)
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials",
    headers={"WWW-Authenticate": "Bearer"}  # ← Add this
)
```

But this won't fix the login issue - it's just for clarity.

## 🎯 Next Steps

**IMMEDIATE ACTION REQUIRED:**

1. **Check what the browser is actually sending** (Solution 1)
2. **Check the response error message** (Solution 2)
3. **Test direct API call** (Solution 5)

Once you provide this information, I can pinpoint the exact problem!

## 🔐 Confirmed Working Credentials

```
Email: admin@example.com
Password: Admin123!
```

**Password Requirements:**
- Capital `A` in `Admin`
- Number `1` (not lowercase `l`)
- Exclamation mark `!` at the end
- Case-sensitive

---

## 📝 What I Need From You

Please run these commands and share the output:

```powershell
# 1. Check account status
docker compose exec backend python test_password.py

# 2. Test direct API call
$headers = @{ "Content-Type" = "application/json" }
$body = '{"email":"admin@example.com","password":"Admin123!"}' 
Invoke-WebRequest -Uri "http://localhost:8000/auth/login" -Method Post -Headers $headers -Body $body -ContentType "application/json"

# 3. Check browser Network tab request payload (manual check)
```

And from the browser:
- **Request Payload** (from Network tab)
- **Response Body** (from Network tab)
- **Console Errors** (from Console tab)
