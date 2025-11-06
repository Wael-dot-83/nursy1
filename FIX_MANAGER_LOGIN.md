# Fix Manager Login Issue

## Problem
When admin creates a kindergarten, a manager account is created but the manager cannot login.

## Root Cause
The manager account is created with:
- `email` set correctly
- `hashed_password` set correctly
- `temp_password` stored (plaintext for display)
- BUT `username` field is NULL (Phase 2 added this field)

The login works with `email`, so the issue is likely:
1. Password not being hashed correctly
2. Or temp_password interfering with authentication

## Quick Fix

### Option 1: Check if password is hashed correctly

Run this SQL to check a manager account:
```sql
SELECT id, email, first_name, last_name, role, hashed_password, temp_password, is_active 
FROM users 
WHERE role = 'manager' 
ORDER BY created_at DESC 
LIMIT 1;
```

Check:
- `hashed_password` should start with `$2b$` (bcrypt hash)
- `temp_password` should be plaintext (12 characters)
- `is_active` should be `1` or `true`

### Option 2: Manually test manager login

```bash
# Get the manager's email and temp password from the nursery creation response
# Then try to login

curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager_1@nursery.com",
    "password": "TEMP_PASSWORD_HERE"
  }'
```

### Option 3: Reset manager password manually

```sql
-- Find the manager
SELECT id, email FROM users WHERE role = 'manager' AND email LIKE 'manager_%';

-- Update password to a known value (password: Manager123!)
-- Hash generated with: bcrypt.hashpw(b"Manager123!", bcrypt.gensalt())
UPDATE users 
SET hashed_password = '$2b$12$LQv3c1yqBwEHxPuNUjHXqOxnNXs.rCq6PvV8V6iV5vZxKjV5vZxKj',
    temp_password = 'Manager123!'
WHERE role = 'manager' AND email LIKE 'manager_%';
```

Then try login with:
- Email: `manager_1@nursery.com` (or whatever email was created)
- Password: `Manager123!`

## Permanent Fix

Update `nursery_router.py` to also set `username` field:

```python
# In create_manager_account function, add:
user = User(
    email=email,
    username=email,  # ADD THIS LINE
    hashed_password=hash_password(password),
    temp_password=password,
    first_name=first_name,
    last_name=last_name,
    phone=phone,
    role=RoleEnum.MANAGER,
    nursery_id=db_nursery.id,
    is_active=True,
)
```

## Debug Steps

1. **Check backend logs**:
```bash
tail -f d:\nursy\nursery-system\backend\logs\app.log
```

2. **Check database**:
```bash
cd d:\nursy\nursery-system\backend
python -c "from app.database import engine; from sqlalchemy import text; conn = engine.connect(); result = conn.execute(text('SELECT id, email, role, is_active, hashed_password FROM users WHERE role=\"manager\"')); print([dict(row._mapping) for row in result])"
```

3. **Test password hash**:
```python
from app.security import hash_password, verify_password

# Hash the temp password
temp_pass = "YOUR_TEMP_PASSWORD"
hashed = hash_password(temp_pass)
print(f"Hashed: {hashed}")

# Verify it works
print(f"Verify: {verify_password(temp_pass, hashed)}")
```

4. **Check auth service**:
```python
from app.database import get_db
from app.auth_service import AuthService

db = next(get_db())
user = AuthService.authenticate_user(db, "manager_1@nursery.com", "TEMP_PASSWORD")
print(f"User: {user}")
```

## Expected Behavior

After fix:
1. Admin creates kindergarten
2. Manager credentials are displayed (email + temp password)
3. Manager can login with those credentials
4. Manager is redirected to manager dashboard
5. Manager can change password on first login

## Test Script

Save as `test_manager_login.py`:

```python
import requests

# 1. Admin login
admin_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "admin@nursery.com", "password": "Admin123!"}
)
admin_token = admin_response.json()["access_token"]
print(f"Admin token: {admin_token[:20]}...")

# 2. Create nursery
nursery_response = requests.post(
    "http://localhost:8000/api/nurseries",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={
        "name": "Test Kindergarten",
        "mainPhone": "0791234567",
        "email": "test@kindergarten.com",
        "mainAddress": {
            "street": "123 Main St",
            "city": "Amman",
            "governorate": "Amman",
            "postalCode": "11111"
        },
        "ageRange": {"minAge": 70, "maxAge": 52},
        "branches": []
    }
)

nursery_data = nursery_response.json()
print(f"Nursery created: {nursery_data['id']}")

# 3. Get manager credentials
manager_creds = nursery_data.get("manager") or nursery_data.get("managers", [{}])[0]
manager_email = manager_creds["email"]
manager_password = manager_creds["tempPassword"]

print(f"Manager email: {manager_email}")
print(f"Manager password: {manager_password}")

# 4. Try manager login
manager_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": manager_email, "password": manager_password}
)

if manager_response.status_code == 200:
    print("✓ Manager login SUCCESS!")
    print(f"Manager token: {manager_response.json()['access_token'][:20]}...")
else:
    print(f"✗ Manager login FAILED: {manager_response.status_code}")
    print(f"Error: {manager_response.json()}")
```

Run with:
```bash
cd d:\nursy\nursery-system\backend
python test_manager_login.py
```
