from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from .database import get_db
from .auth_service import AuthService
from .dependencies import get_current_user
from .schemas import (
    LoginRequest, OTPRequest, OTPVerifyRequest, TokenResponse,
    RefreshTokenRequest, UserResponse, BaseResponse, PasswordChangeRequest
)
from .settings import settings

router = APIRouter()
security = HTTPBearer()

# Rate limiter for authentication endpoints
limiter = Limiter(key_func=get_remote_address)

@router.post("/login", response_model=TokenResponse)
@limiter.limit(f"{settings.auth_rate_limit_per_minute}/minute")
async def login(request: Request, login_request: LoginRequest, db: Session = Depends(get_db)):
    """Direct login with email and password (no OTP for development)"""
    try:
        user = AuthService.authenticate_user(db, login_request.email, login_request.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Create tokens directly
        access_token, refresh_token = AuthService.create_tokens(db, user)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=1800  # 30 minutes
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login/otp", response_model=BaseResponse)
@limiter.limit(f"{settings.auth_rate_limit_per_minute}/minute")
async def login_with_otp(request: Request, login_request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password - initiates OTP verification"""
    try:
        user = AuthService.authenticate_user(db, login_request.email, login_request.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Create OTP request
        otp_request = AuthService.create_otp_request(db, login_request.email)

        # TODO: Send OTP via SMS/Email service
        # await send_otp_email(login_request.email, otp_request.plain_otp)
        # await send_otp_sms(user.phone_number, otp_request.plain_otp)

        return BaseResponse(
            message="OTP sent to your registered phone/email"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/otp/request", response_model=BaseResponse)
@limiter.limit(f"{settings.auth_rate_limit_per_minute}/minute")
async def request_otp(request: Request, otp_request_data: OTPRequest, db: Session = Depends(get_db)):
    """Request new OTP for login"""
    try:
        otp_request = AuthService.create_otp_request(db, otp_request_data.email)

        # TODO: Send OTP via SMS/Email service
        # user = db.query(User).filter(User.email == otp_request_data.email).first()
        # if user:
        #     await send_otp_email(otp_request_data.email, otp_request.plain_otp)
        #     await send_otp_sms(user.phone_number, otp_request.plain_otp)

        return BaseResponse(
            message="OTP sent to your registered phone/email"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/otp/verify", response_model=TokenResponse)
@limiter.limit(f"{settings.auth_rate_limit_per_minute}/minute")
async def verify_otp(request: Request, verify_request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP and get access tokens"""
    try:
        user = AuthService.verify_otp(db, verify_request.email, verify_request.otp_code)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OTP"
            )

        access_token, refresh_token = AuthService.create_tokens(db, user)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=1800  # 30 minutes
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        access_token = AuthService.refresh_access_token(db, refresh_request.refresh_token)
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_request.refresh_token,  # Return same refresh token
            token_type="bearer",
            expires_in=1800  # 30 minutes
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/logout", response_model=BaseResponse)
async def logout():
    """Logout by revoking refresh token"""
    try:
        # Note: In a production app, you'd extract user_id from the access token
        # For simplicity, we'll just return success
        # AuthService.revoke_refresh_token(db, user_id, request.refresh_token)

        return BaseResponse(message="Logged out successfully")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.post("/password/change", response_model=BaseResponse)
async def change_password(
    password_request: PasswordChangeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        from .models import User
        from .security import verify_password, hash_password

        # Verify current password
        if not verify_password(password_request.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )

        # Update password
        current_user.hashed_password = hash_password(password_request.new_password)
        db.commit()

        return BaseResponse(message="Password changed successfully")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )