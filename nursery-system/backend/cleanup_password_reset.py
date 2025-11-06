"""Cleanup expired password reset OTPs and old attempts"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import PasswordResetOTP, PasswordResetAttempt

def cleanup_password_reset():
    """Remove expired OTPs and old attempts"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Delete expired unused OTPs (>10 min)
        expired_count = db.query(PasswordResetOTP).filter(
            PasswordResetOTP.expires_at < now,
            PasswordResetOTP.used == False
        ).delete()
        
        # Delete used OTPs (>24h)
        used_cutoff = now - timedelta(hours=24)
        used_count = db.query(PasswordResetOTP).filter(
            PasswordResetOTP.created_at < used_cutoff,
            PasswordResetOTP.used == True
        ).delete()
        
        # Delete old attempts (>30d)
        attempts_cutoff = now - timedelta(days=30)
        attempts_count = db.query(PasswordResetAttempt).filter(
            PasswordResetAttempt.attempted_at < attempts_cutoff
        ).delete()
        
        db.commit()
        
        print(f"Cleanup complete:")
        print(f"  - Expired OTPs: {expired_count}")
        print(f"  - Used OTPs: {used_count}")
        print(f"  - Old attempts: {attempts_count}")
        
    except Exception as e:
        db.rollback()
        print(f"Cleanup failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_password_reset()
