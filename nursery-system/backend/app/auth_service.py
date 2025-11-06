from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
import string
from sqlalchemy.orm import Session
from .models import User, RefreshToken  # OTPRequest removed - OTP feature deprecated
from .security import hash_password, verify_password, create_access_token, create_refresh_token  # hash_otp_code, verify_otp_code removed
from .settings import settings

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    # DEPRECATED: OTP authentication feature removed
    # @staticmethod
    # def generate_otp() -> str:
    #     """Generate a 6-digit OTP"""
    #     return ''.join(secrets.choice(string.digits) for _ in range(6))
    #
    # @staticmethod
    # def create_otp_request(db: Session, email: str) -> OTPRequest:
    #     """Create OTP request for user"""
    #     user = db.query(User).filter(User.email == email).first()
    #     if not user:
    #         raise ValueError("User not found")
    #
    #     # Generate OTP
    #     otp_code = AuthService.generate_otp()
    #     hashed_otp = hash_otp_code(otp_code)
    #
    #     # Create OTP request
    #     otp_request = OTPRequest(
    #         user_id=user.id,
    #         otp_code_hash=hashed_otp,
    #         expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
    #     )
    #
    #     db.add(otp_request)
    #     db.commit()
    #     db.refresh(otp_request)
    #
    #     # In a real application, you would send the OTP via SMS/email
    #     # For demo purposes, we'll return it
    #     otp_request.plain_otp = otp_code  # This would not be stored in production
    #
    #     return otp_request
    #
    # @staticmethod
    # def verify_otp(db: Session, email: str, otp_code: str) -> Optional[User]:
    #     """Verify OTP and return user if valid"""
    #     user = db.query(User).filter(User.email == email).first()
    #     if not user:
    #         return None
    #
    #     # Find valid OTP request
    #     otp_request = db.query(OTPRequest).filter(
    #         OTPRequest.user_id == user.id,
    #         OTPRequest.used == False,
    #         OTPRequest.expires_at > datetime.now(timezone.utc)
    #     ).order_by(OTPRequest.created_at.desc()).first()
    #
    #     if not otp_request or not verify_otp_code(otp_code, otp_request.otp_code_hash):
    #         return None
    #
    #     # Mark OTP as used
    #     otp_request.used = True
    #     db.commit()
    #
    #     return user

    @staticmethod
    def create_tokens(db: Session, user: User) -> tuple[str, str]:
        """Create access and refresh tokens for user"""
        # NOTE: This method is deprecated. Use create_access_token and create_refresh_token directly
        # from security.py for better token management with JTI.
        # This is kept for backward compatibility only.

        # Create access token
        access_token_data = {
            "sub": str(user.id),
        }
        access_token, access_jti = create_access_token(access_token_data)

        # Create refresh token
        refresh_token_data = {
            "sub": str(user.id),
        }
        refresh_token, refresh_token_hash = create_refresh_token(refresh_token_data)

        # Store refresh token in database
        db_refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=refresh_token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        )
        db.add(db_refresh_token)
        db.commit()

        return access_token, refresh_token

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Optional[str]:
        """Create new access token using refresh token"""
        # Find valid refresh token
        stored_token = db.query(RefreshToken).filter(
            RefreshToken.expires_at > datetime.now(timezone.utc),
            RefreshToken.revoked == False
        ).all()

        # Verify refresh token against stored hashes
        for token_record in stored_token:
            if verify_password(refresh_token, token_record.token_hash):
                user = db.query(User).filter(User.id == token_record.user_id).first()
                if user and user.is_active:
                    # Create new access token
                    access_token_data = {
                        "sub": str(user.id),
                        "email": user.email,
                        "role": user.role.value,
                        "nursery_id": user.nursery_id
                    }
                    return create_access_token(access_token_data)

        return None

    @staticmethod
    def revoke_refresh_token(db: Session, user_id: int, refresh_token: str):
        """Revoke a refresh token"""
        stored_tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        ).all()

        for token_record in stored_tokens:
            if verify_password(refresh_token, token_record.token_hash):
                token_record.revoked = True
                db.commit()
                break

    @staticmethod
    def cleanup_expired_tokens(db: Session):
        """Clean up expired tokens (can be run as a background task)"""
        # OTP cleanup removed - OTP feature deprecated
        # expired_otp = db.query(OTPRequest).filter(
        #     OTPRequest.expires_at < datetime.now(timezone.utc)
        # ).delete()

        expired_refresh = db.query(RefreshToken).filter(
            RefreshToken.expires_at < datetime.now(timezone.utc)
        ).delete()

        db.commit()

        return expired_refresh  # Previously: expired_otp + expired_refresh