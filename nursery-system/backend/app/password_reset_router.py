"""Password reset router with phone OTP verification"""
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import get_db
from .models import User, PasswordResetOTP, PasswordResetAttempt, RefreshToken
from .schemas import PasswordResetRequest, PasswordResetVerify, PasswordResetConfirm
from .security import hash_password, verify_otp_code, hash_otp_code
from .sms_service import send_otp_sms, normalize_jordan_phone, SMS_DEV_MODE
from .settings import settings
from .middleware import password_reset_limiter

router = APIRouter()

def get_client_info(request: Request) -> tuple:
    """Extract client IP and user agent"""
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")[:500]
    return ip, ua

def log_security_event(db: Session, event: str, phone: str, ip: str, ua: str, meta: dict = None):
    """Log security event"""
    phone_hash = hashlib.sha256(phone.encode()).hexdigest()[:16]
    print(f"[SECURITY] {event} | phone_hash={phone_hash} | ip={ip} | meta={meta}")

def check_rate_limit(db: Session, phone: str, hours: int, max_attempts: int) -> bool:
    """Check if phone exceeded rate limit"""
    since = datetime.utcnow() - timedelta(hours=hours)
    count = db.query(PasswordResetAttempt).filter(
        PasswordResetAttempt.phone == phone,
        PasswordResetAttempt.attempted_at >= since
    ).count()
    return count < max_attempts

def check_daily_resets(db: Session, phone: str) -> bool:
    """Check if phone exceeded daily reset limit"""
    since = datetime.utcnow() - timedelta(days=1)
    count = db.query(PasswordResetAttempt).filter(
        PasswordResetAttempt.phone == phone,
        PasswordResetAttempt.success == True,
        PasswordResetAttempt.attempted_at >= since
    ).count()
    return count < settings.max_reset_attempts_per_day

@router.post("/request")
@password_reset_limiter.limit("3/minute")
async def request_password_reset(data: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    """Request OTP for password reset"""
    phone = normalize_jordan_phone(data.phone)
    ip, ua = get_client_info(request)
    
    # Check rate limit
    if not check_rate_limit(db, phone, 1, 3):
        log_security_event(db, "OTP_RATE_LIMITED", phone, ip, ua)
        raise HTTPException(status_code=429, detail={
            "message_ar": "تم تجاوز الحد. حاول لاحقًا.",
            "message_en": "Rate limit exceeded. Try again later."
        })
    
    # Check if user exists
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        # Don't reveal if user exists
        log_security_event(db, "OTP_USER_NOT_FOUND", phone, ip, ua)
        raise HTTPException(status_code=404, detail={
            "message_ar": "رقم الهاتف غير مسجل.",
            "message_en": "Phone number not registered."
        })
    
    # Generate OTP
    otp = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_hash = hash_otp_code(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expire_minutes)
    
    # Save OTP
    otp_record = PasswordResetOTP(
        phone=phone,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=False
    )
    db.add(otp_record)
    
    # Log attempt
    attempt = PasswordResetAttempt(
        phone=phone,
        ip_address=ip,
        user_agent=ua,
        success=True,
        failure_reason=None
    )
    db.add(attempt)
    db.commit()
    
    # Send SMS
    sms_sent = await send_otp_sms(phone, otp)
    if not sms_sent and not SMS_DEV_MODE:
        log_security_event(db, "OTP_SMS_FAILED", phone, ip, ua)
        raise HTTPException(status_code=500, detail={
            "message_ar": "فشل إرسال رمز التحقق. حاول لاحقًا.",
            "message_en": "Failed to send verification code. Try again later."
        })
    
    log_security_event(db, "OTP_REQUESTED", phone, ip, ua)
    
    response = {
        "message_ar": "تم إرسال رمز التحقق عبر الرسائل القصيرة.",
        "message_en": "Verification code sent via SMS."
    }
    
    if SMS_DEV_MODE:
        response["dev_otp"] = otp
    
    return response

@router.post("/verify")
@password_reset_limiter.limit("5/minute")
async def verify_otp(data: PasswordResetVerify, request: Request, db: Session = Depends(get_db)):
    """Verify OTP code"""
    phone = normalize_jordan_phone(data.phone)
    ip, ua = get_client_info(request)
    
    # Find latest unused OTP
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.phone == phone,
        PasswordResetOTP.used == False,
        PasswordResetOTP.expires_at > datetime.utcnow()
    ).order_by(PasswordResetOTP.created_at.desc()).first()
    
    if not otp_record:
        attempt = PasswordResetAttempt(
            phone=phone,
            ip_address=ip,
            user_agent=ua,
            success=False,
            failure_reason="expired"
        )
        db.add(attempt)
        db.commit()
        log_security_event(db, "OTP_EXPIRED", phone, ip, ua)
        raise HTTPException(status_code=400, detail={
            "message_ar": "انتهت صلاحية رمز التحقق.",
            "message_en": "Verification code has expired."
        })
    
    # Check attempts
    if otp_record.attempts >= settings.max_otp_attempts:
        attempt = PasswordResetAttempt(
            phone=phone,
            ip_address=ip,
            user_agent=ua,
            success=False,
            failure_reason="max_attempts"
        )
        db.add(attempt)
        db.commit()
        log_security_event(db, "OTP_MAX_ATTEMPTS", phone, ip, ua)
        raise HTTPException(status_code=400, detail={
            "message_ar": "تم تجاوز عدد المحاولات المسموحة.",
            "message_en": "Maximum attempts exceeded."
        })
    
    # Verify OTP
    if not verify_otp_code(data.otp, otp_record.otp_hash):
        otp_record.attempts += 1
        attempt = PasswordResetAttempt(
            phone=phone,
            ip_address=ip,
            user_agent=ua,
            success=False,
            failure_reason="invalid_otp"
        )
        db.add(attempt)
        db.commit()
        log_security_event(db, "OTP_INVALID", phone, ip, ua)
        raise HTTPException(status_code=400, detail={
            "message_ar": "رمز التحقق غير صحيح.",
            "message_en": "Invalid verification code."
        })
    
    # Mark OTP as used
    otp_record.used = True
    attempt = PasswordResetAttempt(
        phone=phone,
        ip_address=ip,
        user_agent=ua,
        success=True,
        failure_reason=None
    )
    db.add(attempt)
    db.commit()
    
    log_security_event(db, "OTP_VERIFIED", phone, ip, ua)
    
    return {
        "message_ar": "تم التحقق من الرمز بنجاح.",
        "message_en": "Verification successful.",
        "verified": True
    }

@router.post("/confirm")
@password_reset_limiter.limit("2/minute")
async def confirm_password_reset(data: PasswordResetConfirm, request: Request, db: Session = Depends(get_db)):
    """Confirm password reset"""
    phone = normalize_jordan_phone(data.phone)
    ip, ua = get_client_info(request)
    
    # Check daily reset limit
    if not check_daily_resets(db, phone):
        log_security_event(db, "RESET_DAILY_LIMIT", phone, ip, ua)
        raise HTTPException(status_code=429, detail={
            "message_ar": "تم تجاوز الحد اليومي. حاول غدًا.",
            "message_en": "Daily limit exceeded. Try tomorrow."
        })
    
    # Verify OTP again
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.phone == phone,
        PasswordResetOTP.used == True
    ).order_by(PasswordResetOTP.created_at.desc()).first()
    
    if not otp_record or not verify_otp_code(data.otp, otp_record.otp_hash):
        attempt = PasswordResetAttempt(
            phone=phone,
            ip_address=ip,
            user_agent=ua,
            success=False,
            failure_reason="invalid_otp"
        )
        db.add(attempt)
        db.commit()
        log_security_event(db, "RESET_INVALID_OTP", phone, ip, ua)
        raise HTTPException(status_code=400, detail={
            "message_ar": "رمز التحقق غير صحيح.",
            "message_en": "Invalid verification code."
        })
    
    # Find user
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        log_security_event(db, "RESET_USER_NOT_FOUND", phone, ip, ua)
        raise HTTPException(status_code=404, detail={
            "message_ar": "المستخدم غير موجود.",
            "message_en": "User not found."
        })
    
    # Update password
    user.hashed_password = hash_password(data.new_password)
    user.last_password_reset = datetime.utcnow()
    user.password_reset_count += 1
    user.must_reset_password = False
    
    # Invalidate all refresh tokens
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    
    # Log success
    attempt = PasswordResetAttempt(
        phone=phone,
        ip_address=ip,
        user_agent=ua,
        success=True,
        failure_reason=None
    )
    db.add(attempt)
    db.commit()
    
    log_security_event(db, "PASSWORD_CHANGED", phone, ip, ua, {"user_id": user.id})
    
    return {
        "message_ar": "تم تغيير كلمة المرور بنجاح.",
        "message_en": "Password changed successfully."
    }
