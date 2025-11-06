# 🚀 Password Reset - Quick Start

## ⚡ 30-Second Setup

```bash
cd d:\nursy\nursery-system\backend

# 1. Tables already created ✅
# 2. Router already registered ✅
# 3. Dev mode enabled ✅

# Test it now:
curl -X POST http://localhost:8002/auth/forgot-password/request \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"0791234567\"}"
```

---

## 📱 API Endpoints

### 1. Request OTP
```bash
POST /auth/forgot-password/request
{"phone": "0791234567"}

→ {"message_ar": "...", "dev_otp": "123456"}
```

### 2. Verify OTP
```bash
POST /auth/forgot-password/verify
{"phone": "0791234567", "otp": "123456"}

→ {"verified": true}
```

### 3. Confirm Reset
```bash
POST /auth/forgot-password/confirm
{"phone": "0791234567", "otp": "123456", "new_password": "NewPass123"}

→ {"message_ar": "تم تغيير كلمة المرور بنجاح."}
```

---

## 🔧 Configuration

**Dev Mode (Current):**
- `SMS_DEV_MODE=true` ✅
- OTP returned in API response
- No SMS sent

**Production Mode:**
```env
SMS_DEV_MODE=false
SMS_TWILIO_SID=your_sid
SMS_TWILIO_TOKEN=your_token
SMS_TWILIO_PHONE=+1234567890
```

---

## 🧪 Test Now

```bash
# Windows
cd d:\nursy\nursery-system\backend
test_password_reset.bat

# Or manual test:
curl -X POST http://localhost:8002/auth/forgot-password/request \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"0791234567\"}"
```

---

## 📚 Full Documentation

- **[PASSWORD_RESET_README.md](nursery-system/backend/PASSWORD_RESET_README.md)** - Complete guide
- **[PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md](PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md)** - Implementation summary

---

## ✅ Status

- **Backend**: ✅ Running on port 8002
- **Database**: ✅ Tables created
- **Router**: ✅ Registered at `/auth/forgot-password`
- **Dev Mode**: ✅ Enabled
- **Tests**: ✅ Available

**Ready to test! 🎉**
