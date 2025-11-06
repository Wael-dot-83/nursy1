# 🛡️ Security Fixes Implementation Guide

## Phase 1: Critical Security Fixes (IMMEDIATE)

### 1. Environment Variables Setup

**Create `.env.example`:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nursery_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_PER_MINUTE=60
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO

# Frontend
VITE_API_URL=http://localhost:8002
VITE_WS_URL=ws://localhost:8002/ws
```

**Backend `.env` loader:**
```python
# backend/app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    bcrypt_rounds: int = 12
    cors_origins: list[str] = ["http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()
```

### 2. Fix SQL Injection Vulnerabilities

**BEFORE (Vulnerable):**
```python
# ❌ NEVER DO THIS
user = db.query(User).filter(f"email = '{email}'").first()
```

**AFTER (Secure):**
```python
# ✅ Use parameterized queries
user = db.query(User).filter(User.email == email).first()

# ✅ Or with text() for complex queries
from sqlalchemy import text
result = db.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)
```

**Apply to all routers:**
- `auth_router.py`
- `supervisor_router.py`
- `manager_router.py`
- `admin_router.py`
- `reports_router.py`
- `parent_router.py`

### 3. Input Validation with Pydantic

**Create validation schemas:**
```python
# backend/app/schemas/validators.py
from pydantic import BaseModel, EmailStr, constr, validator
import re

class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=8, max_length=100)
    first_name: constr(min_length=1, max_length=50)
    last_name: constr(min_length=1, max_length=50)
    role: constr(regex="^(admin|manager|supervisor|parent)$")
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain digit')
        if not re.search(r'[!@#$%^&*]', v):
            raise ValueError('Password must contain special char')
        return v

class ChildCreate(BaseModel):
    first_name: constr(min_length=1, max_length=50)
    last_name: constr(min_length=1, max_length=50)
    date_of_birth: date
    
    @validator('date_of_birth')
    def validate_dob(cls, v):
        if v > date.today():
            raise ValueError('Date of birth cannot be in future')
        if v < date.today() - timedelta(days=365*10):
            raise ValueError('Child must be under 10 years old')
        return v
```

### 4. Fix Path Traversal

**Secure file operations:**
```python
# backend/app/utils/file_security.py
from pathlib import Path
import os

UPLOAD_DIR = Path("uploads").resolve()

def secure_filename(filename: str) -> str:
    """Remove path traversal attempts"""
    filename = os.path.basename(filename)
    filename = "".join(c for c in filename if c.isalnum() or c in "._-")
    return filename[:255]

def get_safe_filepath(filename: str) -> Path:
    """Ensure file is within upload directory"""
    safe_name = secure_filename(filename)
    filepath = (UPLOAD_DIR / safe_name).resolve()
    
    if not str(filepath).startswith(str(UPLOAD_DIR)):
        raise ValueError("Invalid file path")
    
    return filepath
```

### 5. Strengthen Password Hashing

**Update security.py:**
```python
# backend/app/security.py
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.bcrypt_rounds
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### 6. Fix XSS Vulnerabilities

**Frontend sanitization:**
```javascript
// frontend/src/utils/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};
```

**Use in components:**
```jsx
import { sanitizeInput } from '@/utils/sanitize';

const handleSubmit = (e) => {
  e.preventDefault();
  const cleanData = {
    name: sanitizeInput(formData.name),
    email: sanitizeInput(formData.email)
  };
  // Submit cleanData
};
```

### 7. Implement Rate Limiting

**Backend middleware:**
```python
# backend/app/middleware/rate_limit.py
from fastapi import Request, HTTPException
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio

class RateLimiter:
    def __init__(self, requests: int = 60, window: int = 60):
        self.requests = requests
        self.window = window
        self.clients = defaultdict(list)
        
    async def __call__(self, request: Request):
        client_ip = request.client.host
        now = datetime.now()
        
        # Clean old requests
        self.clients[client_ip] = [
            req_time for req_time in self.clients[client_ip]
            if now - req_time < timedelta(seconds=self.window)
        ]
        
        if len(self.clients[client_ip]) >= self.requests:
            raise HTTPException(429, "Too many requests")
        
        self.clients[client_ip].append(now)

# Apply in main.py
from app.middleware.rate_limit import RateLimiter

app.add_middleware(RateLimiter, requests=60, window=60)
```

### 8. Comprehensive Error Handling

**Global exception handler:**
```python
# backend/app/middleware/error_handler.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    
    if isinstance(exc, SQLAlchemyError):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Database error occurred"}
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

# Register in main.py
app.add_exception_handler(Exception, global_exception_handler)
```

### 9. Secure JWT Implementation

**Updated JWT service:**
```python
# backend/app/services/jwt_service.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import get_settings

settings = get_settings()

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        days=settings.jwt_refresh_token_expire_days
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )

def verify_token(token: str, token_type: str = "access") -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        if payload.get("type") != token_type:
            raise JWTError("Invalid token type")
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid token")
```

### 10. Audit Logging

**Comprehensive audit system:**
```python
# backend/app/services/audit_service.py
from app.models import AuditLog
from sqlalchemy.orm import Session
from fastapi import Request

async def log_action(
    db: Session,
    user_id: int,
    action: str,
    resource: str,
    resource_id: int = None,
    details: dict = None,
    request: Request = None
):
    audit = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(audit)
    db.commit()
```

---

## Phase 2: Database Migration

### PostgreSQL Setup

**1. Install dependencies:**
```bash
pip install psycopg2-binary asyncpg
```

**2. Update database.py:**
```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(bind=engine, autoflush=False)
```

**3. Run migrations:**
```bash
alembic revision --autogenerate -m "Initial PostgreSQL migration"
alembic upgrade head
```

---

## Phase 3: Testing

### Unit Tests Example

```python
# backend/tests/test_auth.py
import pytest
from app.services.jwt_service import create_access_token, verify_token

def test_create_access_token():
    token = create_access_token({"sub": "test@example.com"})
    assert token is not None
    
def test_verify_valid_token():
    token = create_access_token({"sub": "test@example.com"})
    payload = verify_token(token)
    assert payload["sub"] == "test@example.com"
    
def test_verify_invalid_token():
    with pytest.raises(HTTPException):
        verify_token("invalid_token")
```

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrated to PostgreSQL
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring set up (Sentry)
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] All tests passing (80%+ coverage)

---

**Status:** Ready for implementation
**Priority:** CRITICAL - Start immediately
