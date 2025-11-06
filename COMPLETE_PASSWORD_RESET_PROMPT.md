# Complete Password Reset Implementation Prompt

## Overview
Implement a complete forgot/change password system for the Nursery Management System using phone number verification and OTP SMS delivery via Twilio. The system should support managers, supervisors, and parents with enterprise-level security measures.

## Requirements
- Phone number validation (Jordan format: 07XXXXXXXX)
- OTP generation and SMS delivery via Twilio
- Rate limiting (3 OTP requests/hour, 2 resets/day per phone number)
- Security logging and admin notifications for suspicious activity
- Password strength validation and session invalidation
- Multi-step UI flow with progress indicators
- Arabic/English interface support
- Production-ready implementation

## Phase 1: Database Schema & Models
Create the necessary database models for password reset functionality:

1. **PasswordResetOTP Model**:
   - Fields: id, phone, otp_hash, expires_at, attempts, used, created_at
   - Relationships: None required
   - Indexes: phone, expires_at, used

2. **PasswordResetAttempt Model**:
   - Fields: id, phone, ip_address, user_agent, success, failure_reason, attempted_at
   - Indexes: phone+attempted_at, ip_address+attempted_at

3. **User Model Extensions**:
   - Add: last_password_reset (datetime), password_reset_count (int)

**Files to modify**: `models.py`

## Phase 2: SMS Service Integration
Create a dedicated SMS service for Twilio integration:

1. **SMS Service Features**:
   - Async SMS sending using aiohttp
   - Jordan phone number formatting (+962 prefix)
   - Error handling and logging
   - Development mode fallback (print OTP instead of sending)

2. **Twilio Configuration**:
   - Account SID: ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   - Auth Token: d6a147be6d8cbff2a81624a33c1dc383
   - Phone Number: To be configured in environment

**Files to create**: `sms_service.py`
**Dependencies to add**: `aiohttp==3.9.1` to `requirements.txt`

## Phase 3: API Validation Schemas
Create Pydantic schemas for request/response validation:

1. **PasswordResetRequest Schema**:
   - phone: str with regex validation for Jordan format (07XXXXXXXX)

2. **PasswordResetVerify Schema**:
   - phone: str
   - otp: str (6-digit numeric validation)

3. **PasswordResetConfirm Schema**:
   - reset_token: str
   - new_password: str (minimum 8 characters)
   - confirm_password: str (must match new_password)

**Files to modify**: `schemas.py`

## Phase 4: Password Reset API Router
Create a comprehensive FastAPI router with three endpoints:

1. **POST /auth/forgot-password/request**:
   - Validate phone number format
   - Check rate limits (3/hour per phone)
   - Generate 6-digit OTP and hash with bcrypt
   - Send SMS via Twilio service
   - Create PasswordResetOTP record
   - Log security event

2. **POST /auth/forgot-password/verify**:
   - Validate phone and OTP
   - Check OTP attempts (max 5)
   - Verify OTP hash and expiration (10 minutes)
   - Mark OTP as used
   - Generate reset token (JWT)
   - Log verification attempt

3. **POST /auth/forgot-password/confirm**:
   - Validate reset token
   - Check daily reset limit (2/day per phone)
   - Validate password strength
   - Update user password (bcrypt hash)
   - Invalidate all refresh tokens
   - Update user reset tracking
   - Log password change

**Security Features**:
- Rate limiting using slowapi
- Comprehensive audit logging
- Admin notifications for suspicious activity
- Input sanitization and validation
- Proper error handling with i18n support

**Files to create**: `password_reset_router.py`

## Phase 5: Configuration & Integration
Complete the integration with existing systems:

1. **Settings Configuration**:
   - OTP_EXPIRATION_MINUTES: 10
   - MAX_OTP_ATTEMPTS: 5
   - MAX_DAILY_RESETS: 2
   - OTP_REQUESTS_PER_HOUR: 3
   - Twilio configuration variables

2. **Router Registration**:
   - Import password_reset_router in main.py
   - Add to _ROUTERS tuple under /auth prefix

3. **Audit Helper Enhancement**:
   - Add log_security_event function for security logging

**Files to modify**: `settings.py`, `main.py`, `audit_helper.py`

## Phase 6: Database Migration & Maintenance
Create deployment and maintenance scripts:

1. **Database Migration Script**:
   - Create password_reset_otps table
   - Create password_reset_attempts table
   - Add columns to users table
   - Include proper indexes and constraints

2. **Cleanup Job**:
   - Remove expired OTPs (unused after 10 minutes)
   - Remove used OTPs (after 24 hours)
   - Remove old attempts (after 30 days)
   - Python script with proper error handling

3. **Testing Scripts**:
   - API test script for all endpoints
   - Validation of phone number formats
   - Rate limiting verification
   - Error handling testing

4. **Documentation**:
   - Comprehensive README with setup instructions
   - API documentation and examples
   - Security considerations and monitoring
   - Troubleshooting guides

**Files to create**:
- `password_reset_migration.sql`
- `cleanup_password_reset.py`
- `cleanup_password_reset.bat`
- `test_password_reset.py`
- `test_password_reset.bat`
- `PASSWORD_RESET_README.md`

## Security Requirements
- OTP codes must be hashed with bcrypt (not stored in plain text)
- Rate limiting must prevent abuse (phone and IP-based)
- All attempts must be logged for security monitoring
- Password changes must invalidate existing sessions
- Admin notifications for suspicious patterns
- Input validation on all endpoints
- Proper error messages (no sensitive data leakage)

## Integration Requirements
- Must integrate with existing FastAPI application
- Must use existing authentication and authorization patterns
- Must follow existing database schema conventions
- Must support existing i18n framework (Arabic/English)
- Must use existing audit logging system
- Must maintain compatibility with existing user management

## Testing Requirements
- Unit tests for OTP generation and validation
- Integration tests for SMS delivery
- Rate limiting verification
- Security audit logging validation
- Error handling and edge cases
- Database migration testing

## Deployment Checklist
- [ ] Run database migration script
- [ ] Configure Twilio environment variables
- [ ] Set up scheduled cleanup job
- [ ] Test all API endpoints
- [ ] Verify SMS delivery
- [ ] Check audit logging
- [ ] Validate rate limiting
- [ ] Test error scenarios
- [ ] Review security logs
- [ ] Document production configuration

## Success Criteria
- All API endpoints return correct responses
- SMS delivery works with Twilio
- Rate limiting prevents abuse
- Security events are properly logged
- Password changes invalidate sessions
- Phone number validation works correctly
- Error handling is comprehensive
- Code follows existing patterns
- Documentation is complete
- Testing passes all scenarios

## Implementation Notes
- Use existing project structure and patterns
- Follow FastAPI best practices
- Implement proper error handling
- Add comprehensive logging
- Use type hints throughout
- Write clean, maintainable code
- Include docstrings for all functions
- Test thoroughly before deployment

