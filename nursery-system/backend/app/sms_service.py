"""SMS service for sending OTP via Twilio"""
import os
import re
import logging
from typing import Optional
import aiohttp
from base64 import b64encode

from .settings import settings

logger = logging.getLogger(__name__)

SMS_DEV_MODE = os.getenv("SMS_DEV_MODE", "false").lower() in ("true", "1", "yes")

def normalize_jordan_phone(phone: str) -> str:
    """Normalize Jordan phone to E.164 format (+9627XXXXXXXX)"""
    digits = re.sub(r'\D', '', phone)
    if re.fullmatch(r'07\d{8}', digits):
        return f'+962{digits[1:]}'
    if re.fullmatch(r'9627\d{8}', digits):
        return f'+{digits}'
    if digits.startswith('962'):
        return f'+{digits}'
    return phone

async def send_otp_sms(phone: str, otp: str) -> bool:
    """Send OTP via Twilio SMS"""
    normalized_phone = normalize_jordan_phone(phone)
    message = f"Your verification code is: {otp}. Valid for 10 minutes."
    
    if SMS_DEV_MODE:
        logger.info(f"[DEV MODE] SMS to {normalized_phone[:8]}*** - OTP: {otp[:2]}****")
        return True
    
    if not all([settings.sms_twilio_sid, settings.sms_twilio_token, settings.sms_twilio_phone]):
        logger.error("Twilio credentials not configured")
        return False
    
    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.sms_twilio_sid}/Messages.json"
    auth = b64encode(f"{settings.sms_twilio_sid}:{settings.sms_twilio_token}".encode()).decode()
    
    data = {
        "From": settings.sms_twilio_phone,
        "To": normalized_phone,
        "Body": message
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers={"Authorization": f"Basic {auth}"},
                data=data,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status in (200, 201):
                    logger.info(f"SMS sent to {normalized_phone[:8]}***")
                    return True
                else:
                    logger.error(f"Twilio error: {response.status}")
                    return False
    except Exception as e:
        logger.error(f"SMS send failed: {str(e)}")
        return False
