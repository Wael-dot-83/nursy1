from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import uuid
import hashlib
from jose import jwt, JWTError
from passlib.context import CryptContext
from .settings import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> Tuple[str, str]:
    """
    Create access token with JTI for revocation tracking.
    Returns: (token, jti)
    """
    to_encode = data.copy()
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({
        "exp": expire,
        "type": "access",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    })
    token = jwt.encode(to_encode, settings.jwt_access_secret, algorithm="HS256")
    return token, jti

def create_refresh_token(data: dict) -> Tuple[str, str]:
    """
    Create refresh token with JTI for revocation tracking.
    Returns: (token, token_hash)
    """
    to_encode = data.copy()
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    })
    token = jwt.encode(to_encode, settings.jwt_refresh_secret, algorithm="HS256")
    # Hash the token for storage (for revocation checking)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash

def verify_token(token: str, token_type: str = "access"):
    try:
        secret = settings.jwt_access_secret if token_type == "access" else settings.jwt_refresh_secret
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def hash_otp_code(code: str) -> str:
    """Hash OTP codes for storage"""
    return pwd_context.hash(code)

def verify_otp_code(plain: str, hashed: str) -> bool:
    """Verify OTP code against hash"""
    return pwd_context.verify(plain, hashed)
