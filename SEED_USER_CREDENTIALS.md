# 👥 Nursery Management System - User Credentials

Complete list of all seed users for testing and demonstration purposes.

## 🔐 Security Notice

**⚠️ IMPORTANT:** These are test credentials. In production:
- Change all default passwords immediately
- Use strong, unique passwords for each account
- Enable two-factor authentication if available
- Follow your organization's password policy

---

## 📊 User Statistics

- **Total Users**: 38
- **Admins**: 3
- **Managers**: 16
- **Supervisors**: 7
- **Parents**: 12

---

## 👨‍💼 Administrator Accounts (3 users)

| Email | Password | Name | Phone | Purpose |
|-------|----------|------|-------|---------|
| admin@nursery.com | Admin123! | System Administrator | +96271234567 | Primary admin |
| admin2@nursery.com | Admin2Pass! | Ahmed Al-Hassan | +96271111111 | Secondary admin |
| backup.admin@nursery.com | Backup1! | Backup Administrator | +96275111111 | Backup admin |

### Admin Capabilities:
- Full system access
- User management (create, edit, delete)
- Nursery and branch management
- System settings and configuration
- View all reports and analytics
- Audit log access
- Backup and restore

---

## 👔 Manager Accounts (16 users)

### Original Managers

| Email | Password | Name | Phone | Branch |
|-------|----------|------|-------|--------|
| manager@nursery.com | Manager123! | Sarah Johnson | +96272345678 | Main |

### Extended Managers

| Email | Password | Name | Phone | Purpose |
|-------|----------|------|-------|---------|
| manager.branch1@nursery.com | Manager1! | Layla Al-Mahmoud | +96272111111 | Branch 1 Manager |
| manager.branch2@nursery.com | Manager2! | Omar Khalil | +96272222222 | Branch 2 Manager |
| manager.operations@nursery.com | Manager3! | Fatima Nasser | +96272333333 | Operations Manager |
| deputy.manager@nursery.com | Deputy1! | Deputy Manager | +96275222222 | Deputy Manager |

### Manager Capabilities:
- Manage assigned branch(es)
- Staff scheduling
- Classroom management
- Enrollment and admissions
- Parent communication
- Reports for their branch
- Attendance tracking
- Event planning

---

## 👨‍🏫 Supervisor Accounts (7 users)

### Original Supervisor

| Email | Password | Name | Phone | Assignment |
|-------|----------|------|-------|------------|
| supervisor@nursery.com | Supervisor123! | Mike Wilson | +96273456789 | General |

### Extended Supervisors

| Email | Password | Name | Phone | Assignment |
|-------|----------|------|-------|------------|
| supervisor.morning@nursery.com | Super1! | Rania Yousef | +96273111111 | Morning Shift |
| supervisor.afternoon@nursery.com | Super2! | Khaled Ibrahim | +96273222222 | Afternoon Shift |
| supervisor.classroom1@nursery.com | Super3! | Hala Mustafa | +96273333333 | Sunshine Room |
| supervisor.classroom2@nursery.com | Super4! | Youssef Hamdan | +96273444444 | Rainbow Room |
| supervisor.classroom3@nursery.com | Super5! | Nour Saleh | +96273555555 | Star Room |

### Supervisor Capabilities:
- Daily attendance tracking
- Classroom activities
- Child progress notes
- Parent notifications
- Incident reporting
- Meal and nap tracking
- View assigned children only

---

## 👨‍👩‍👧 Parent Accounts (12 users)

### Original Parent

| Email | Password | Name | Phone | Children |
|-------|----------|------|-------|----------|
| parent@nursery.com | Parent123! | Emily Davis | +96274567890 | Sample children |

### Extended Parents

| Email | Password | Name | Phone |
|-------|----------|------|-------|
| parent.smith@nursery.com | Parent1! | John Smith | +96274111111 |
| parent.brown@nursery.com | Parent2! | Lisa Brown | +96274222222 |
| parent.johnson@nursery.com | Parent3! | David Johnson | +96274333333 |
| parent.williams@nursery.com | Parent4! | Sarah Williams | +96274444444 |
| parent.jones@nursery.com | Parent5! | Michael Jones | +96274555555 |
| parent.garcia@nursery.com | Parent6! | Maria Garcia | +96274666666 |
| parent.martinez@nursery.com | Parent7! | Carlos Martinez | +96274777777 |
| parent.rodriguez@nursery.com | Parent8! | Ana Rodriguez | +96274888888 |
| parent.lee@nursery.com | Parent9! | James Lee | +96274999999 |
| parent.ahmed@nursery.com | Parent10! | Mona Ahmed | +96274101010 |

### Parent Capabilities:
- View their children's information
- Check-in/check-out children
- View attendance history
- Receive notifications
- View daily reports
- View photos and activities
- Update emergency contacts
- Communication with staff

---

## 🚀 Quick Start for Testing

### 1. Access the Application
```
http://192.168.1.11:5173
```

### 2. Login with Any Test Account
Choose an account from the lists above based on the role you want to test.

### 3. Test Different Roles
- **Admin**: Full system management
- **Manager**: Branch and staff operations
- **Supervisor**: Daily classroom activities
- **Parent**: Child monitoring and communication

---

## 📋 Testing Scenarios

### Scenario 1: Admin Workflow
1. Login as `admin@nursery.com` / `Admin123!`
2. Create a new branch
3. Add a new manager
4. Configure system settings
5. View audit logs

### Scenario 2: Manager Workflow
1. Login as `manager.branch1@nursery.com` / `Manager1!`
2. Create new classroom
3. Assign supervisors
4. Enroll new children
5. Generate reports

### Scenario 3: Supervisor Workflow
1. Login as `supervisor.classroom1@nursery.com` / `Super3!`
2. Mark attendance for children
3. Record daily activities
4. Add progress notes
5. Send parent notifications

### Scenario 4: Parent Workflow
1. Login as `parent.smith@nursery.com` / `Parent1!`
2. View child's attendance
3. Check daily report
4. View photos
5. Update contact information

---

## 🔄 Password Reset

If you need to reset a password:

1. **As Admin**:
   - Login as admin
   - Go to User Management
   - Select user
   - Click "Reset Password"
   - Assign temporary password

2. **As User**:
   - Click "Forgot Password" on login page
   - Enter email address
   - Follow email instructions (if email configured)

---

## 📁 Database Management

### View All Users
```bash
cd nursery-system/backend
venv/Scripts/python -c "from app.database import SessionLocal; from app.models import User; db = SessionLocal(); users = db.query(User).all(); [print(f'{u.email} - {u.role.value}') for u in users]"
```

### Create Additional Users
```bash
cd nursery-system/backend
venv/Scripts/python seed_extended_users.py
```

### Reset Database
```bash
# Delete database file
del nursery-system\backend\nursery.db

# Re-seed
cd nursery-system\backend
venv\Scripts\python seed_db.py
venv\Scripts\python seed_extended_users.py
```

---

## 🎯 User Management Best Practices

### For Production Use:

1. **Password Policy**:
   - Minimum 8 characters
   - Include uppercase, lowercase, number, special character
   - Change every 90 days
   - No password reuse

2. **Access Control**:
   - Assign minimal required permissions
   - Review user access quarterly
   - Deactivate unused accounts
   - Use role-based access

3. **Security Monitoring**:
   - Enable audit logging
   - Monitor failed login attempts
   - Review user activity regularly
   - Set up alerts for suspicious activity

4. **Account Lifecycle**:
   - Welcome email with temp password
   - Force password change on first login
   - Regular access reviews
   - Proper offboarding process

---

## 📞 Support

For issues with user accounts:
- **Admin**: admin@nursery.com
- **Technical Support**: See USER_GUIDE.md
- **Documentation**: See ADMIN_TEST_GUIDE.md

---

## 📝 Quick Reference Card

**Print and distribute this section to staff:**

```
╔══════════════════════════════════════════════════════════╗
║        NURSERY MANAGEMENT SYSTEM - LOGIN INFO            ║
╠══════════════════════════════════════════════════════════╣
║  Access URL: http://192.168.1.11:5173                   ║
║                                                          ║
║  Your Credentials:                                       ║
║  Email:    ________________________________              ║
║  Password: ________________________________              ║
║                                                          ║
║  ⚠️ Change your password after first login               ║
║                                                          ║
║  Need Help?                                              ║
║  • Click "Forgot Password" on login page                ║
║  • Contact your administrator                            ║
║  • See USER_GUIDE.md for instructions                    ║
╚══════════════════════════════════════════════════════════╝
```

---

**Last Updated**: October 30, 2025
**System Version**: 1.0.0
**Total Accounts**: 38 users across 4 roles
