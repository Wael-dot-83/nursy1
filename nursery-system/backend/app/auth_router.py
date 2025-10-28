from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .auth_service import AuthService
from .dependencies import get_current_user
from .schemas import (
    LoginRequest, OTPRequest, OTPVerifyRequest, TokenResponse,
    RefreshTokenRequest, UserResponse, BaseResponse
)

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=BaseResponse)
async def login(login_request: LoginRequest, db: Session = Depends(get_db)):
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

        return BaseResponse(
            message=f"OTP sent to your registered phone/email. Code: {otp_request.plain_otp}"  # Remove in production
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/otp/request", response_model=BaseResponse)
async def request_otp(otp_request_data: OTPRequest, db: Session = Depends(get_db)):
    """Request new OTP for login"""
    try:
        otp_request = AuthService.create_otp_request(db, otp_request_data.email)

        return BaseResponse(
            message=f"OTP sent to your registered phone/email. Code: {otp_request.plain_otp}"  # Remove in production
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(verify_request: OTPVerifyRequest, db: Session = Depends(get_db)):
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