from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timedelta
import hashlib

from .database import get_db
from .auth_service import AuthService
from .dependencies import get_current_user
from .models import User, LoginAttempt, RefreshToken
from .schemas import (
    LoginRequest, OTPRequest, OTPVerifyRequest, TokenResponse,
    RefreshTokenRequest, UserResponse, BaseResponse, PasswordChangeRequest
)
from .settings import settings
from .audit_helper import log_login, log_logout
from .security import create_access_token, create_refresh_token, verify_token, hash_password, verify_password

router = APIRouter()
security = HTTPBearer()

# Rate limiter for authentication endpoints
limiter = Limiter(key_func=get_remote_address)


def check_brute_force(db: Session, email: str, ip_address: str) -> None:
    """
    Check for brute-force login attempts.
    Raises HTTPException if too many failed attempts.
    """
    # Check failed attempts in last 15 minutes
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)

    failed_attempts = db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == False,
        LoginAttempt.attempted_at >= fifteen_mins_ago
    ).count()

    if failed_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again in 15 minutes."
        )


def log_login_attempt(db: Session, email: str, ip_address: str, success: bool, failure_reason: str = None):
    """Log a login attempt for brute-force protection"""
    attempt = LoginAttempt(
        email=email,
        ip_address=ip_address,
        success=success,
        failure_reason=failure_reason,
        attempted_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()


def store_refresh_token(db: Session, user_id: int, token_hash: str, expires_at: datetime) -> RefreshToken:
    """Store refresh token in database"""
    refresh_token_record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        revoked=False
    )
    db.add(refresh_token_record)
    db.commit()
    db.refresh(refresh_token_record)
    return refresh_token_record


@router.post("/login")
@limiter.limit(f"{settings.auth_rate_limit_per_minute}/minute")
async def login(
    request: Request,
    response: Response,
    login_request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    Sets refresh token in httpOnly cookie.
    Returns access token in response body.
    """
    try:
        ip_address = request.client.host
        email = login_request.email

        # Check for brute-force attempts
        check_brute_force(db, email, ip_address)

        # Authenticate user
        user = AuthService.authenticate_user(db, email, login_request.password)

        if not user:
            # Log failed attempt
            log_login_attempt(db, email, ip_address, False, "Invalid credentials")
            log_login(
                db, None,
                details={
                    "email": email,
                    "success": False,
                    "reason": "Invalid credentials"
                },
                request=request
            )
            db.commit()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Check if user is active
        if not user.is_active:
            log_login_attempt(db, email, ip_address, False, "Account inactive")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact administrator."
            )

        # Create tokens with JTI
        access_token, access_jti = create_access_token({"sub": str(user.id)})
        refresh_token, refresh_token_hash = create_refresh_token({"sub": str(user.id)})

        # Store refresh token in database
        expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
        store_refresh_token(db, user.id, refresh_token_hash, expires_at)

        # Set refresh token as httpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.debug,  # HTTPS only in production
            samesite="lax",
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60,  # Convert days to seconds
            path="/auth"  # Cookie only sent to auth endpoints
        )

        # Log successful login
        log_login_attempt(db, email, ip_address, True)
        log_login(
            db, user,
            details={
                "email": email,
                "success": True,
                "role": user.role
            },
            request=request
        )
        db.commit()

        # Return access token in response body
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,  # In seconds
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "nursery_id": user.nursery_id
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh")
async def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token from cookie.
    Implements token rotation for enhanced security.
    """
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No refresh token provided"
            )

        # Verify refresh token
        payload = verify_token(refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        user_id = int(payload.get("sub"))

        # Check if refresh token is revoked
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        stored_token = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False
        ).first()

        if not stored_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked"
            )

        # Check if token is expired
        if stored_token.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired"
            )

        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        # Rotate refresh token (revoke old, create new)
        stored_token.revoked = True
        db.commit()

        # Create new tokens
        new_access_token, access_jti = create_access_token({"sub": str(user.id)})
        new_refresh_token, new_refresh_token_hash = create_refresh_token({"sub": str(user.id)})

        # Store new refresh token
        expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
        store_refresh_token(db, user.id, new_refresh_token_hash, expires_at)

        # Set new refresh token as httpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=not settings.debug,
            samesite="lax",
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
            path="/auth"
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.post("/logout", response_model=BaseResponse)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user by revoking all refresh tokens and clearing cookie.
    """
    try:
        # Revoke all refresh tokens for this user
        db.query(RefreshToken).filter(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False
        ).update({"revoked": True})

        # Clear refresh token cookie
        response.delete_cookie(key="refresh_token", path="/auth")

        # Log logout
        log_logout(
            db, current_user,
            details={"reason": "User initiated logout"},
            request=request
        )
        db.commit()

        return BaseResponse(message="Logged out successfully")

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)


@router.post("/password/change", response_model=BaseResponse)
async def change_password(
    password_request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password and revoke all existing tokens"""
    try:
        # Verify current password
        if not verify_password(password_request.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )

        # Update password
        current_user.hashed_password = hash_password(password_request.new_password)

        # Revoke all existing refresh tokens for security
        db.query(RefreshToken).filter(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False
        ).update({"revoked": True})

        db.commit()

        return BaseResponse(message="Password changed successfully. Please login again.")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )


# Admin endpoint to revoke user tokens (for compromised accounts)
@router.post("/admin/revoke-tokens/{user_id}", response_model=BaseResponse)
async def revoke_user_tokens(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to revoke all tokens for a user (e.g., compromised account).
    Requires admin role.
    """
    from .models import RoleEnum

    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can revoke user tokens"
        )

    try:
        # Revoke all refresh tokens for the specified user
        count = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        ).update({"revoked": True})

        db.commit()

        return BaseResponse(
            message=f"Successfully revoked {count} active token(s) for user {user_id}"
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token revocation failed: {str(e)}"
        )
