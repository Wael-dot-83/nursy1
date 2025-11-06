# Password Reset System - Complete Documentation

## Overview

Production-ready password reset system with phone number verification via OTP SMS (Twilio). Supports managers, supervisors, and parents with Arabic/English localization.

## Features

- ✅ Phone number verification (Jordan: 07XXXXXXXX)
- ✅ 6-digit OTP with 10-minute expiry
- ✅ Bcrypt-hashed OTP storage (no plaintext)
- ✅ Rate limiting (3 OTP requests/hour, 2 resets/day)
- ✅ Security logging and alerts
- ✅ Session invalidation on password change
- ✅ Multi-step API flow
- ✅ Arabic/English responses
- ✅ Dev mode for testing (no SMS sent)

---

## Setup

### 1. Install Dependencies

```bash
cd nursery-system/backend
pip install aiohttp==3.9.1
```

### 2. Configure Environment

Copy `.env.example` to `.env` and set:

```env
# Required for production
SMS_TWILIO_SID=your_twilio_account_sid
SMS_TWILIO_TOKEN=your_twilio_auth_token
SMS_TWILIO_PHONE=+1234567890

# For development/testing
SMS_DEV_MODE=true
```

### 3. Run Migration

```bash
python migrations/run_migration.py
```

Or manually:

```sql
sqlite3 nursery.db < migrations/002_password_reset.sql
```

### 4. Register Router

In `app/main.py`:

```python
from app.password_reset_router import router as password_reset_router

app.include_router(
    password_reset_router,
    prefix="/auth/forgot-password",
    tags=["auth"]
)
```

---

## API Endpoints

### 1. Request OTP

**POST** `/auth/forgot-password/request`

**Request:**
```json
{
  "phone": "0791234567"
}
```

**Response (200):**
```json
{
  "message_ar": "تم إرسال رمز التحقق عبر الرسائل القصيرة.",
  "message_en": "Verification code sent via SMS.",
  "dev_otp": "123456"  // Only in dev mode
}
```

**Errors:**
- `429` - Rate limit exceeded (3/hour)
- `404` - Phone not registered
- `500` - SMS send failed

---

### 2. Verify OTP

**POST** `/auth/forgot-password/verify`

**Request:**
```json
{
  "phone": "0791234567",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "message_ar": "تم التحقق من الرمز بنجاح.",
  "message_en": "Verification successful.",
  "verified": true
}
```

**Errors:**
- `400` - Invalid OTP
- `400` - OTP expired
- `400` - Max attempts exceeded (5)

---

### 3. Confirm Password Reset

**POST** `/auth/forgot-password/confirm`

**Request:**
```json
{
  "phone": "0791234567",
  "otp": "123456",
  "new_password": "NewPassword123"
}
```

**Response (200):**
```json
{
  "message_ar": "تم تغيير كلمة المرور بنجاح.",
  "message_en": "Password changed successfully."
}
```

**Errors:**
- `400` - Invalid OTP
- `404` - User not found
- `429` - Daily limit exceeded (2/day)

---

## Phone Number Format

**Accepted:**
- Local: `07XXXXXXXX` (e.g., `0791234567`)
- E.164: `+9627XXXXXXXX` (e.g., `+9627912345678`)

**Normalized to:** `+9627XXXXXXXX`

---

## Security Features

### Rate Limiting

- **OTP Requests**: 3 per hour per phone
- **Password Resets**: 2 per day per phone
- **OTP Attempts**: 5 per OTP

### OTP Security

- 6-digit random code
- Bcrypt-hashed storage (no plaintext)
- 10-minute expiry
- Single-use only
- Constant-time comparison

### Session Invalidation

All refresh tokens are revoked on successful password reset.

### Security Logging

All events logged with:
- Event type
- Phone hash (SHA-256, first 16 chars)
- IP address
- User agent
- Metadata

**Events:**
- `OTP_REQUESTED`
- `OTP_VERIFIED`
- `OTP_INVALID`
- `OTP_EXPIRED`
- `OTP_RATE_LIMITED`
- `PASSWORD_CHANGED`

---

## Development Mode

Set `SMS_DEV_MODE=true` in `.env`:

- OTP not sent via Twilio
- OTP returned in API response (`dev_otp` field)
- Logs masked OTP for debugging

**Example:**
```json
{
  "message_ar": "تم إرسال رمز التحقق عبر الرسائل القصيرة.",
  "message_en": "Verification code sent via SMS.",
  "dev_otp": "123456"
}
```

---

## Testing

### Run Tests

```bash
# Windows
test_password_reset.bat

# Linux/Mac
python -m pytest test_password_reset.py -v
```

### Manual Testing

1. **Request OTP:**
```bash
curl -X POST http://localhost:8002/auth/forgot-password/request \
  -H "Content-Type: application/json" \
  -d '{"phone":"0791234567"}'
```

2. **Verify OTP:**
```bash
curl -X POST http://localhost:8002/auth/forgot-password/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"0791234567","otp":"123456"}'
```

3. **Confirm Reset:**
```bash
curl -X POST http://localhost:8002/auth/forgot-password/confirm \
  -H "Content-Type: application/json" \
  -d '{"phone":"0791234567","otp":"123456","new_password":"NewPass123"}'
```

---

## Maintenance

### Cleanup Script

Remove expired OTPs and old attempts:

```bash
# Windows
cleanup_password_reset.bat

# Linux/Mac
python cleanup_password_reset.py
```

**Removes:**
- Expired unused OTPs (>10 min)
- Used OTPs (>24 hours)
- Old attempts (>30 days)

**Schedule:** Run daily via cron/Task Scheduler

---

## Monitoring

### Key Metrics

- OTP request rate
- OTP verification success rate
- Password reset completion rate
- Rate limit hits
- Twilio failures

### Alerts

Trigger admin notification when:
- ≥5 failed OTP verifications for a phone in 1 hour
- Cross-IP phone activity within 10 minutes
- Multiple phones from same IP hitting rate limits

---

## Troubleshooting

### OTP Not Received

1. Check Twilio credentials in `.env`
2. Verify phone number format (07XXXXXXXX)
3. Check Twilio account balance
4. Review logs: `logs/app.log`

### Rate Limit Issues

1. Check `PasswordResetAttempt` table
2. Clear old attempts: `cleanup_password_reset.py`
3. Adjust limits in `.env`:
   - `OTP_REQUEST_RATE_LIMIT`
   - `MAX_RESET_ATTEMPTS_PER_DAY`

### OTP Expired

- Default: 10 minutes
- Adjust: `OTP_EXPIRE_MINUTES` in `.env`

### Database Issues

```bash
# Check tables exist
sqlite3 nursery.db ".tables"

# Re-run migration
python migrations/run_migration.py
```

---

## Production Checklist

- [ ] Set `SMS_DEV_MODE=false`
- [ ] Configure Twilio credentials
- [ ] Set strong secrets (32+ chars)
- [ ] Enable HTTPS
- [ ] Configure monitoring/alerts
- [ ] Schedule cleanup script (daily)
- [ ] Test all endpoints
- [ ] Review security logs
- [ ] Set up backup strategy

---

## Password Policy

**Minimum:** 8 characters

**Recommended:**
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

---

## Localization

### Arabic Messages

- `otp.sent`: "تم إرسال رمز التحقق عبر الرسائل القصيرة."
- `otp.invalid`: "رمز التحقق غير صحيح."
- `otp.expired`: "انتهت صلاحية رمز التحقق."
- `rate.limited`: "تم تجاوز الحد. حاول لاحقًا."
- `password.changed`: "تم تغيير كلمة المرور بنجاح."

### English Messages

- `otp.sent`: "Verification code sent via SMS."
- `otp.invalid`: "Invalid verification code."
- `otp.expired`: "Verification code has expired."
- `rate.limited`: "Rate limit exceeded. Try again later."
- `password.changed`: "Password changed successfully."

---

## Support

For issues or questions:
1. Check logs: `logs/app.log`
2. Review this documentation
3. Run tests: `test_password_reset.bat`
4. Check Twilio dashboard

---

**Implementation Complete! 🎉**
