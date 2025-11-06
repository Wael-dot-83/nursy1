# 🔐 Admin Complete Workflow Guide

## Overview
This guide covers all administrative functions and workflows in the Nursery Management System.

---

## 1. Authentication & Access

### Login Process
**Endpoint:** `POST /auth/login`

**Credentials:**
- Email: `admin@nursery.com`
- Password: `Admin123!`

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "email": "admin@nursery.com",
    "role": "admin",
    "nursery_id": 1
  }
}
```

**Features:**
- JWT token-based authentication
- Automatic token refresh (30 minutes)
- HttpOnly cookie for refresh token
- Rate limiting protection (5 attempts per 15 minutes)

### Password Management
**Change Password:** `POST /auth/password/change`
```json
{
  "current_password": "Admin123!",
  "new_password": "NewPassword123!"
}
```

**Revoke User Tokens:** `POST /auth/admin/revoke-tokens/{user_id}`
- Force logout compromised accounts
- Invalidate all user sessions

---

## 2. Dashboard & Analytics

### System Analytics
**Endpoint:** `GET /system/analytics`

**Returns:**
- Total users by role
- Total nurseries and branches
- Total children (active/inactive)
- Attendance statistics
- Recent activity logs
- System health metrics

### System Health
**Endpoint:** `GET /system/system-health`

**Monitors:**
- Database connection status
- API response time
- Memory usage
- Active sessions
- Error rates

---

## 3. Nursery Management

### Create Nursery
**Endpoint:** `POST /admin/nurseries`

**Required Fields:**
```json
{
  "name": "Little Stars Nursery",
  "main_phone": "0791234567",
  "email": "info@littlestars.jo",
  "main_address": {
    "street": "King Abdullah St",
    "city": "Amman",
    "governorate": "Amman",
    "postal_code": "11183"
  },
  "age_range": {
    "min": 6,
    "max": 60
  },
  "notes": "Premium nursery facility"
}
```

**Workflow:**
1. Validate nursery name (unique)
2. Validate phone number format
3. Create nursery record
4. Log audit trail
5. Return nursery ID

### List All Nurseries
**Endpoint:** `GET /admin/nurseries?skip=0&limit=100`

**Filters:**
- Pagination (skip/limit)
- Search by name
- Filter by governorate

### Update Nursery
**Endpoint:** `PUT /admin/nurseries/{nursery_id}`

**Updatable Fields:**
- Name, phone, email
- Address details
- Age range
- Operating hours
- Notes

### Delete Nursery
**Endpoint:** `DELETE /admin/nurseries/{nursery_id}`

**Cascade Actions:**
- Soft delete (marks as inactive)
- Preserves historical data
- Deactivates all branches
- Notifies affected users

---

## 4. Branch Management

### Create Branch
**Endpoint:** `POST /admin/nurseries/{nursery_id}/branches`

**Required Fields:**
```json
{
  "name": "Downtown Branch",
  "address": {
    "street": "Rainbow St",
    "city": "Amman",
    "governorate": "Amman"
  },
  "phone": "0791234568",
  "nursery_id": 1
}
```

**Workflow:**
1. Verify nursery exists
2. Validate branch name (unique per nursery)
3. Create branch record
4. Initialize default settings
5. Log creation

### List Branches
**Endpoint:** `GET /admin/nurseries/{nursery_id}/branches`

**Returns:**
- All branches for nursery
- Branch capacity and occupancy
- Active classrooms count
- Manager assignments

### Update Branch
**Endpoint:** `PUT /admin/branches/{branch_id}`

**Features:**
- Update contact information
- Modify capacity limits
- Change operating status
- Reassign managers

### Delete Branch
**Endpoint:** `DELETE /admin/branches/{branch_id}`

**Validations:**
- Cannot delete if children enrolled
- Must reassign staff first
- Requires confirmation

---

## 5. Classroom Management

### Create Classroom
**Endpoint:** `POST /admin/branches/{branch_id}/classrooms`

**Required Fields:**
```json
{
  "name": "Toddlers Room A",
  "capacity": 15,
  "branch_id": 1,
  "age_group": "12-24 months",
  "supervisor_id": 3
}
```

**Workflow:**
1. Verify branch exists
2. Check capacity limits
3. Assign supervisor
4. Create classroom
5. Initialize attendance tracking

### List Classrooms
**Endpoint:** `GET /admin/branches/{branch_id}/classrooms`

**Shows:**
- Classroom name and capacity
- Current enrollment
- Assigned supervisor
- Age group
- Status (active/full/closed)

### Update Classroom
**Endpoint:** `PUT /admin/classrooms/{classroom_id}`

**Updatable:**
- Name and capacity
- Age group
- Supervisor assignment
- Status

### Delete Classroom
**Endpoint:** `DELETE /admin/classrooms/{classroom_id}`

**Requirements:**
- No enrolled children
- Supervisor reassignment
- Admin confirmation

---

## 6. User Management

### Create User
**Endpoint:** `POST /admin/users/`

**User Types:**
1. **Admin** - Full system access
2. **Manager** - Nursery-level management
3. **Supervisor** - Classroom operations
4. **Parent** - Child information access

**Required Fields:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "0791234567",
  "role": "manager",
  "nursery_id": 1,
  "password": "TempPassword123!"
}
```

**Workflow:**
1. Validate email (unique)
2. Hash password (bcrypt)
3. Assign role and permissions
4. Link to nursery/branch
5. Send welcome email
6. Create audit log

### List Users
**Endpoint:** `GET /admin/users/?skip=0&limit=100`

**Filters:**
- By role
- By nursery
- By status (active/inactive)
- Search by name/email

**Returns:**
```json
[
  {
    "id": 1,
    "email": "admin@nursery.com",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "admin",
    "is_active": true,
    "nursery_id": 1,
    "created_at": "2025-01-01T00:00:00"
  }
]
```

### Update User
**Endpoint:** `PUT /admin/users/{user_id}`

**Updatable Fields:**
- Personal information
- Contact details
- Role (with validation)
- Nursery assignment
- Status

**Restrictions:**
- Cannot change own role
- Cannot deactivate last admin
- Role changes require confirmation

### Activate/Deactivate User
**Activate:** `PUT /admin/users/{user_id}/activate`
**Deactivate:** `PUT /admin/users/{user_id}/deactivate`

**Effects:**
- Revokes all active sessions
- Blocks login access
- Preserves user data
- Logs status change

### Reset User Password
**Endpoint:** `PUT /admin/users/{user_id}/password`

```json
{
  "new_password": "NewPassword123!",
  "force_change": true
}
```

**Features:**
- Generate temporary password
- Force password change on next login
- Send reset email
- Log password reset

### Delete User
**Endpoint:** `DELETE /admin/users/{user_id}`

**Validations:**
- Cannot delete self
- Cannot delete last admin
- Reassign responsibilities
- Requires confirmation

---

## 7. Children Management

### Register Child
**Endpoint:** `POST /children/`

**Required Information:**
```json
{
  "first_name": "Sara",
  "last_name": "Ahmed",
  "date_of_birth": "2022-03-15",
  "gender": "female",
  "medical_info": "No allergies",
  "emergency_contact": "Mother - Fatima Ahmed",
  "emergency_phone": "0791234567",
  "classroom_id": 1,
  "parent_id": 4
}
```

**Workflow:**
1. Validate parent exists
2. Check classroom capacity
3. Verify age requirements
4. Create child record
5. Link to parent
6. Assign to classroom
7. Initialize attendance
8. Notify parent

### List Children
**Endpoint:** `GET /children/?skip=0&limit=100`

**Filters:**
- By classroom
- By parent
- By status (active/inactive/graduated)
- By age range
- Search by name

**Returns:**
- Child details
- Parent information
- Classroom assignment
- Attendance summary
- Medical notes

### Update Child Information
**Endpoint:** `PUT /children/{child_id}`

**Updatable:**
- Personal details
- Medical information
- Emergency contacts
- Classroom assignment
- Status

### Transfer Child
**Process:**
1. Check target classroom capacity
2. Verify age compatibility
3. Update classroom assignment
4. Transfer attendance records
5. Notify parent and supervisors
6. Log transfer

### Graduate/Archive Child
**Endpoint:** `PUT /children/{child_id}`
```json
{
  "status": "graduated"
}
```

**Actions:**
- Mark as graduated
- Archive records
- Generate final report
- Notify parent
- Free classroom slot

---

## 8. Attendance Management

### View All Attendance
**Endpoint:** `GET /attendance/?skip=0&limit=100`

**Filters:**
- Date range
- Child ID
- Classroom
- Status (present/absent/late)

### Create Attendance Record
**Endpoint:** `POST /attendance/`

```json
{
  "child_id": 1,
  "date": "2025-01-15",
  "check_in_time": "08:30:00",
  "status": "present"
}
```

### Update Attendance
**Endpoint:** `PUT /attendance/{attendance_id}`

**Updatable:**
- Check-in time
- Check-out time
- Status
- Notes

### Attendance Statistics
**Endpoint:** `GET /attendance/stats/daily?target_date=2025-01-15`

**Returns:**
```json
{
  "date": "2025-01-15",
  "present": 45,
  "absent": 5,
  "late": 3,
  "total": 53,
  "attendance_rate": 84.9
}
```

---

## 9. Reports Management

### View All Reports
**Endpoint:** `GET /reports/?skip=0&limit=100`

**Filters:**
- Date range
- Child ID
- Supervisor
- Report type

### Daily Report Structure
```json
{
  "child_id": 1,
  "date": "2025-01-15",
  "activities": "Painting, storytelling, outdoor play",
  "meals": "Breakfast: cereal, Lunch: chicken and rice",
  "naps": "12:00 PM - 2:00 PM (2 hours)",
  "mood": "happy",
  "notes": "Very active and engaged today"
}
```

### Generate Reports
**Types:**
1. **Daily Child Report** - Individual child activities
2. **Classroom Summary** - Group activities
3. **Attendance Report** - Monthly attendance
4. **Financial Report** - Payments and fees
5. **Staff Report** - Employee performance

### Export Reports
**Formats:**
- PDF
- Excel
- CSV
- JSON

---

## 10. File Management

### Upload Files
**Endpoint:** `POST /files/upload`

**Supported Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Max size: 10MB

**Use Cases:**
- Child photos
- Medical certificates
- Registration documents
- Reports and certificates

### List Files
**Endpoint:** `GET /files/?skip=0&limit=100`

**Filters:**
- By uploader
- By file type
- By date
- Search by name

### Download File
**Endpoint:** `GET /files/{file_id}/download`

**Features:**
- Secure download links
- Access control
- Audit logging

### Delete File
**Endpoint:** `DELETE /files/{file_id}`

**Validations:**
- Check permissions
- Verify not in use
- Log deletion

---

## 11. Notifications System

### Create Notification
**Endpoint:** `POST /notifications/`

```json
{
  "user_id": 4,
  "title": "Attendance Alert",
  "message": "Your child was absent today",
  "type": "warning",
  "link": "/attendance/123"
}
```

**Types:**
- info - General information
- success - Positive updates
- warning - Important alerts
- error - Critical issues

### Broadcast Notification
**Endpoint:** `POST /notifications/broadcast`

**Parameters:**
- title
- message
- type
- role (optional - target specific role)
- link (optional)

**Use Cases:**
- System announcements
- Holiday notices
- Emergency alerts
- Policy updates

### View Notifications
**Endpoint:** `GET /notifications/?skip=0&limit=50`

**Filters:**
- Unread only
- By type
- Date range

---

## 12. Audit Logs

### View Audit Logs
**Endpoint:** `GET /audit-logs/?skip=0&limit=100`

**Filters:**
- User ID
- Action type
- Resource type
- Date range (default: 30 days)

**Logged Actions:**
- User login/logout
- Data creation/modification/deletion
- Permission changes
- System configuration
- File uploads/downloads

### Audit Log Entry
```json
{
  "id": 1,
  "user_id": 1,
  "action": "CREATE",
  "resource_type": "User",
  "resource_id": 5,
  "details": {
    "email": "newuser@example.com",
    "role": "parent"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-01-15T10:30:00"
}
```

### Audit Statistics
**Endpoint:** `GET /audit-logs/stats?days=7`

**Returns:**
- Actions by type
- Most active users
- Peak activity times
- Failed operations

---

## 13. System Settings

### Security Settings
**Endpoint:** `GET /admin/settings/security`

**Configurable:**
- Password policy
- Session timeout
- Login attempts limit
- Two-factor authentication
- IP whitelist

**Update:** `PATCH /admin/settings/security`

### Organization Settings
**Endpoint:** `GET /admin/settings/organization`

**Configurable:**
- Organization name
- Contact information
- Business hours
- Holiday calendar
- Notification preferences

### Governorates Management
**List:** `GET /admin/settings/governorates`
**Add:** `POST /admin/settings/governorates`
**Delete:** `DELETE /admin/settings/governorates/{governorate}`

**Jordan Governorates:**
- Amman, Irbid, Zarqa, Balqa, Madaba
- Karak, Tafilah, Ma'an, Aqaba
- Jerash, Ajloun, Mafraq

### Age Categories
**List:** `GET /admin/settings/age-categories`
**Add:** `POST /admin/settings/age-categories`
**Update:** `PUT /admin/settings/age-categories/{category_id}`
**Delete:** `DELETE /admin/settings/age-categories/{category_id}`

**Default Categories:**
- Infants: 0-12 months
- Toddlers: 12-36 months
- Preschool: 3-5 years

---

## 14. Backup & Restore

### Create Manual Backup
**Endpoint:** `POST /admin/backup/manual?backup_type=full`

**Backup Types:**
- full - Complete database
- incremental - Changes only
- files - Uploaded files only

**Process:**
1. Lock database
2. Create backup file
3. Compress data
4. Store securely
5. Log backup

### List Backups
**Endpoint:** `GET /admin/backup/list`

**Returns:**
```json
[
  {
    "filename": "backup_2025-01-15_10-30-00.db",
    "size": "15.2 MB",
    "type": "full",
    "created_at": "2025-01-15T10:30:00"
  }
]
```

### Restore Backup
**Endpoint:** `POST /admin/backup/restore`

**Parameters:**
- backup_filename
- confirm (required: true)

**Warning:** Destructive operation - replaces current data

### Backup Statistics
**Endpoint:** `GET /admin/backup/stats`

**Shows:**
- Total backups
- Storage used
- Last backup date
- Backup schedule status

---

## 15. Common Admin Workflows

### Workflow 1: Onboard New Nursery
1. Create nursery record
2. Add branches
3. Create classrooms
4. Register manager user
5. Add supervisor users
6. Configure settings
7. Import children data
8. Train staff

### Workflow 2: Register New Child
1. Verify parent account exists
2. Check classroom availability
3. Collect child information
4. Upload required documents
5. Assign to classroom
6. Create attendance record
7. Notify parent and supervisor
8. Generate welcome packet

### Workflow 3: Handle Staff Changes
1. Create new user account
2. Assign role and permissions
3. Link to nursery/branch
4. Transfer responsibilities
5. Update classroom assignments
6. Notify affected parties
7. Deactivate old account
8. Archive records

### Workflow 4: Monthly Reporting
1. Generate attendance reports
2. Compile financial summaries
3. Review staff performance
4. Analyze enrollment trends
5. Export data
6. Share with stakeholders
7. Archive reports

### Workflow 5: System Maintenance
1. Review audit logs
2. Check system health
3. Create backup
4. Update user permissions
5. Clean old data
6. Optimize database
7. Test critical functions
8. Document changes

---

## 16. Security Best Practices

### Access Control
- Use strong passwords (min 8 chars, mixed case, numbers, symbols)
- Enable two-factor authentication
- Review user permissions regularly
- Revoke access immediately when staff leaves
- Use role-based access control

### Data Protection
- Regular backups (daily recommended)
- Encrypt sensitive data
- Secure file uploads
- Monitor audit logs
- Implement data retention policy

### System Security
- Keep software updated
- Monitor failed login attempts
- Use HTTPS only
- Implement rate limiting
- Regular security audits

---

## 17. Troubleshooting

### Common Issues

**Issue: Cannot login**
- Check credentials
- Verify account is active
- Check rate limiting
- Review audit logs

**Issue: Classroom full**
- Check capacity settings
- Review enrollment
- Consider creating new classroom
- Transfer children if needed

**Issue: Report not generating**
- Verify date range
- Check data availability
- Review permissions
- Check system logs

**Issue: File upload fails**
- Check file size (max 10MB)
- Verify file type
- Check storage space
- Review permissions

---

## 18. API Response Codes

**Success:**
- 200 OK - Request successful
- 201 Created - Resource created
- 204 No Content - Deleted successfully

**Client Errors:**
- 400 Bad Request - Invalid input
- 401 Unauthorized - Authentication required
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 422 Validation Error - Invalid data

**Server Errors:**
- 500 Internal Server Error - System error
- 503 Service Unavailable - Maintenance mode

---

## 19. Support & Resources

### Documentation
- API Documentation: http://localhost:8002/docs
- User Guides: `/docs` folder
- Video Tutorials: Available on request

### Contact
- Technical Support: support@nursery.com
- Emergency: +962-XXX-XXXX
- Business Hours: Sun-Thu, 8AM-5PM

### Updates
- Check changelog regularly
- Subscribe to notifications
- Attend training sessions
- Review release notes

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
**Status:** Production Ready
