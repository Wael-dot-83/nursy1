from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .middleware import auth_limiter
from datetime import datetime, timedelta
import hashlib

from .database import get_db
from .auth_service import AuthService
from .dependencies import get_current_user
from .models import User, LoginAttempt, RefreshToken, PasswordResetToken
from .schemas import (
    LoginRequest, TokenResponse,  # OTPRequest, OTPVerifyRequest removed - OTP feature deprecated
    RefreshTokenRequest, UserResponse, BaseResponse, PasswordChangeRequest,
    ForgotPasswordRequest, ResetPasswordRequest
)
from .settings import settings
from .audit_helper import log_login, log_logout
from .security import create_access_token, create_refresh_token, verify_token, hash_password, verify_password

router = APIRouter()
security = HTTPBearer()

# Rate limiter for authentication endpoints
# limiter = Limiter(key_func=get_remote_address)  # Now imported from middleware


def check_brute_force(db: Session, user: User, ip_address: str) -> None:
    """
    Check for brute-force login attempts and account lockouts.
    Raises HTTPException if account is locked or too many failed attempts.
    """
    # Check if account is currently locked
    if user.account_locked_until and user.account_locked_until > datetime.utcnow():
        remaining_time = int((user.account_locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is locked due to too many failed login attempts. Try again in {remaining_time} minutes."
        )

    # Check failed attempts in last 15 minutes
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)

    failed_attempts = db.query(LoginAttempt).filter(
        LoginAttempt.email == user.email,
        LoginAttempt.success == False,
        LoginAttempt.attempted_at >= fifteen_mins_ago
    ).count()

    if failed_attempts >= 5:
        # Lock account for 15 minutes
        lock_until = datetime.utcnow() + timedelta(minutes=15)
        user.account_locked_until = lock_until
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account locked due to too many failed login attempts. Try again in 15 minutes."
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
@auth_limiter.limit(f"{settings.auth_rate_limit_per_minute}/minute")
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

        # Find user first for brute force checking
        user = db.query(User).filter(User.email == email).first()

        # Check for brute-force attempts if user exists
        if user:
            check_brute_force(db, user, ip_address)

        # Authenticate user
        user = AuthService.authenticate_user(db, email, login_request.password)

        if not user:
            # Find user by email for lockout tracking
            user = db.query(User).filter(User.email == email).first()

            if user:
                # Increment failed attempts
                user.failed_login_attempts += 1

                # Check for brute force (this will lock account if needed)
                try:
                    check_brute_force(db, user, ip_address)
                except HTTPException as e:
                    # Log failed attempt
                    log_login_attempt(db, email, ip_address, False, "Account locked")
                    log_login(
                        db, user,
                        details={
                            "email": email,
                            "success": False,
                            "reason": "Account locked",
                            "failed_attempts": user.failed_login_attempts
                        },
                        request=request
                    )
                    db.commit()
                    raise e

                # Log failed attempt
                log_login_attempt(db, email, ip_address, False, "Invalid credentials")
                log_login(
                    db, user,
                    details={
                        "email": email,
                        "success": False,
                        "reason": "Invalid credentials",
                        "failed_attempts": user.failed_login_attempts
                    },
                    request=request
                )
            else:
                # User doesn't exist, still log the attempt
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

        # Check for account lockout
        check_brute_force(db, user, ip_address)

        # Validate role if provided
        if login_request.role:
            if user.role.value != login_request.role:
                # Log failed attempt with role mismatch
                log_login_attempt(db, email, ip_address, False, f"Role mismatch: expected {login_request.role}, got {user.role.value}")
                log_login(
                    db, user,
                    details={
                        "email": email,
                        "success": False,
                        "reason": f"Role mismatch: expected {login_request.role}, got {user.role.value}",
                        "requested_role": login_request.role,
                        "actual_role": user.role.value
                    },
                    request=request
                )
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. This login is for {login_request.role}s only."
                )

        # Reset failed attempts on successful login
        user.failed_login_attempts = 0
        user.account_locked_until = None

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


@router.post("/forgot-password", response_model=BaseResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset for a user.
    Generates a reset token and sends it via email (placeholder for now).
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()

        if not user or not user.is_active:
            # Don't reveal if email exists or not for security
            return BaseResponse(message="If the email exists, a password reset link has been sent.")

        # Check if user already has an active reset token
        existing_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).first()

        if existing_token:
            # Don't create duplicate tokens
            return BaseResponse(message="If the email exists, a password reset link has been sent.")

        # Generate reset token
        import secrets
        reset_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(reset_token.encode()).hexdigest()

        # Store token in database
        expires_at = datetime.utcnow() + timedelta(hours=24)  # 24 hour expiry
        reset_token_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token_record)
        db.commit()

        # TODO: Send email with reset link
        # For now, just log the token (in production, send via email)
        print(f"PASSWORD RESET TOKEN for {user.email}: {reset_token}")

        # Log the password reset request
        log_login(
            db, user,
            details={
                "action": "password_reset_requested",
                "email": user.email
            },
            request=request
        )
        db.commit()

        return BaseResponse(message="If the email exists, a password reset link has been sent.")

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset request failed: {str(e)}"
        )


@router.post("/reset-password", response_model=BaseResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using reset token.
    """
    try:
        # Hash the provided token
        token_hash = hashlib.sha256(request.token.encode()).hexdigest()

        # Find valid reset token
        reset_token_record = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).first()

        if not reset_token_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        # Get user
        user = db.query(User).filter(User.id == reset_token_record.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )

        # Update password
        user.hashed_password = hash_password(request.new_password)
        user.last_password_reset = datetime.utcnow()

        # Mark token as used
        reset_token_record.used = True

        # Revoke all existing refresh tokens for security
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked == False
        ).update({"revoked": True})

        # Log the password reset
        log_login(
            db, user,
            details={
                "action": "password_reset_completed",
                "email": user.email
            },
            request=request
        )
        db.commit()

        return BaseResponse(message="Password has been reset successfully. Please login with your new password.")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
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

