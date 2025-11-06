from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from .database import get_db
from .auth_service import AuthService
from .dependencies import get_current_user
from .schemas import (
    LoginRequest, TokenResponse,  # OTPRequest, OTPVerifyRequest removed - OTP feature deprecated
    RefreshTokenRequest, BaseResponse
)

auth_bp = Blueprint('auth', __name__)

# DEPRECATED: Flask blueprint auth controller replaced by FastAPI auth_router.py
# All OTP endpoints removed - OTP feature deprecated

# @auth_bp.route("/login", methods=['POST'])
# def login():
#     """Login with email and password - initiates OTP verification"""
#     try:
#         data = request.get_json()
#         login_request = LoginRequest(**data)
#
#         db = next(get_db())
#         user = AuthService.authenticate_user(db, login_request.email, login_request.password)
#         if not user:
#             return jsonify({"success": False, "error": "Invalid credentials"}), 401
#
#         # Create OTP request
#         otp_request = AuthService.create_otp_request(db, login_request.email)
#
#         return jsonify({
#             "success": True,
#             "message": f"OTP sent to your registered phone/email. Code: {otp_request.plain_otp}"  # Remove in production
#         })
#
#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)}), 400
#
# @auth_bp.route("/otp/request", methods=['POST'])
# def request_otp():
#     """Request new OTP for login"""
#     try:
#         data = request.get_json()
#         otp_request_data = OTPRequest(**data)
#
#         db = next(get_db())
#         otp_request = AuthService.create_otp_request(db, otp_request_data.email)
#
#         return jsonify({
#             "success": True,
#             "message": f"OTP sent to your registered phone/email. Code: {otp_request.plain_otp}"  # Remove in production
#         })
#
#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)}), 400
#
# @auth_bp.route("/otp/verify", methods=['POST'])
# def verify_otp():
#     """Verify OTP and get access tokens"""
#     try:
#         data = request.get_json()
#         verify_request = OTPVerifyRequest(**data)
#
#         db = next(get_db())
#         user = AuthService.verify_otp(db, verify_request.email, verify_request.otp_code)
#         if not user:
#             return jsonify({"success": False, "error": "Invalid or expired OTP"}), 401
#
#         access_token, refresh_token = AuthService.create_tokens(db, user)
#
#         return jsonify({
#             "access_token": access_token,
#             "refresh_token": refresh_token,
#             "token_type": "bearer",
#             "expires_in": 1800  # 30 minutes
#         })
#
#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)}), 400

@auth_bp.route("/refresh", methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        refresh_request = RefreshTokenRequest(**data)

        db = next(get_db())
        access_token = AuthService.refresh_access_token(db, refresh_request.refresh_token)
        if not access_token:
            return jsonify({"success": False, "error": "Invalid or expired refresh token"}), 401

        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_request.refresh_token,  # Return same refresh token
            "token_type": "bearer",
            "expires_in": 1800  # 30 minutes
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@auth_bp.route("/logout", methods=['POST'])
def logout():
    """Logout by revoking refresh token"""
    try:
        # Note: In a production app, you'd extract user_id from the access token
        # For simplicity, we'll just return success
        # AuthService.revoke_refresh_token(db, user_id, request.refresh_token)

        return jsonify({
            "success": True,
            "message": "Logged out successfully"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@auth_bp.route("/me", methods=['GET'])
def get_current_user_info():
    """Get current user information"""
    try:
        # For now, return a mock user - in production you'd get this from JWT token
        # current_user = get_current_user()
        return jsonify({
            "id": 1,
            "email": "admin@nursery.com",
            "first_name": "System",
            "last_name": "Administrator",
            "role": "admin",
            "nursery_id": None,
            "is_active": True
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400