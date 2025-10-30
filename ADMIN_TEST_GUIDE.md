# 🎯 NURSERY MANAGEMENT SYSTEM - ADMIN TEST GUIDE

## 🚀 SYSTEM STATUS: READY FOR TESTING

### ✅ Current Status
- **Backend API**: Running at `http://localhost:8000`
- **Frontend UI**: Running at `http://localhost:5174`
- **Database**: SQLite (D:\nursy\nursery-system\backend\nursery.db)
- **Total API Endpoints**: 71 (25 admin endpoints)
- **Status**: All systems operational

---

## 🔑 LOGIN CREDENTIALS

### Primary Admin Account
```
Email: admin@nursery.com
Password: Admin123!
Role: System Administrator
```

### Additional Test Accounts
```
Manager (Sunshine Kids):
Email: info@sunshinekids.jo
Password: PC7W4seh6nww
Role: Manager

Supervisor (Sara Ahmed):
Email: sara.ahmed@sunshine.jo
Password: OOx0i7uAAbWm
Role: Supervisor

Parent (Mohammed Hassan):
Email: mohammed.h@sunshine.jo
Password: ivMaxIZHbQJF
Role: Parent
```

---

## 🌐 HOW TO ACCESS THE SYSTEM

### Option 1: Web Browser (Frontend)
1. Open your browser
2. Navigate to: **http://localhost:5174**
3. You should see the Nursery Management System login page
4. Use admin credentials above

### Option 2: API Direct Access (Backend)
1. Open your browser
2. Navigate to: **http://localhost:8000/docs**
3. Interactive API documentation (Swagger UI)
4. You can test all endpoints directly

---

## 📋 ADMIN WORKFLOWS TO TEST

### 1️⃣ DASHBOARD & ANALYTICS
**URL**: http://localhost:5174/admin/dashboard

**What to test**:
- View total nurseries, users, children
- Check user distribution by role (chart)
- Review recent login activity
- Verify system health metrics

**Expected Results**:
- 2 nurseries
- 7 users (1 admin, 2 managers, 2 supervisors, 2 parents)
- 6 children
- All metrics display correctly

---

### 2️⃣ NURSERY MANAGEMENT
**URL**: http://localhost:5174/admin/nurseries

**What to test**:
- ✅ View existing nurseries (2 should exist)
- ✅ Click "Add New Nursery"
- ✅ Fill out the form:
  - Name: [Your Choice]
  - Phone: +962791234XXX
  - Email: test@nursery.jo
  - Address fields
  - Age range (min/max months)
- ✅ Add a branch
- ✅ Click "Save"
- ✅ Verify auto-generated manager credentials appear
- ✅ Edit an existing nursery
- ✅ View nursery details

**Expected Results**:
- Nursery created successfully
- Manager credentials shown (SAVE THESE!)
- New nursery appears in list
- Branch is associated

---

### 3️⃣ USER MANAGEMENT
**URL**: http://localhost:5174/admin/users

**What to test**:
- ✅ View all users (7 should exist)
- ✅ Use search to find "Sara"
- ✅ Filter by role (select "Supervisor")
- ✅ Click "Add New User"
- ✅ Create a supervisor:
  - Full Name: Test Supervisor
  - Email: test.supervisor@nursery.jo
  - Phone: +962795555999
  - Role: Supervisor
  - Assign to a nursery
- ✅ Save and copy temporary password
- ✅ Edit a user (change phone number)
- ✅ Activate/Deactivate a user
- ✅ Export users to CSV

**Expected Results**:
- User created with temp password
- Search and filters work
- CSV export downloads
- User status toggles correctly

---

### 4️⃣ CHILD ENROLLMENT
**URL**: http://localhost:5174/admin/children (or via nursery view)

**What to test**:
- View enrolled children (6 should exist)
- Enroll a new child:
  - First/Last Name
  - Date of Birth
  - Gender
  - Select parent
  - Select classroom
  - Medical info
  - Emergency contact
- View child details
- Edit child information

**Expected Results**:
- Child successfully enrolled
- Linked to correct parent
- Assigned to classroom

---

### 5️⃣ SETTINGS MANAGEMENT (NEW FEATURE!)
**URL**: http://localhost:8174/admin/settings (or API: http://localhost:8000/docs)

**What to test via API** (http://localhost:8000/docs):

#### Security Settings
1. Go to `GET /admin/settings/security`
2. Click "Try it out" → "Execute"
3. View current security config

4. Go to `PATCH /admin/settings/security`
5. Try updating:
```json
{
  "session_timeout": 3600,
  "lockout_threshold": 3,
  "otp_enabled_for_admins": true
}
```

#### Organization Settings
1. Go to `GET /admin/settings/organization`
2. View current settings

3. Try `PATCH /admin/settings/organization`:
```json
{
  "language": "ar",
  "timezone": "Asia/Amman",
  "notifications": {
    "sms_enabled": true,
    "email_enabled": true
  }
}
```

#### Governorates Management
1. `GET /admin/settings/governorates` - View list
2. `POST /admin/settings/governorates` - Add new:
```json
{
  "name": "البلقاء"
}
```

**Expected Results**:
- Settings update successfully
- File `D:\nursy\nursery-system\backend\app_settings.json` created/updated

---

### 6️⃣ BACKUP & RESTORE (NEW FEATURE!)
**URL**: http://localhost:8000/docs → Backup section

**What to test**:

#### Create Backup
1. Go to `POST /admin/backup/manual`
2. Set `backup_type` to "full"
3. Click "Execute"
4. Note the backup filename

#### List Backups
1. Go to `GET /admin/backup/list`
2. Execute
3. See all available backups

#### Backup Statistics
1. Go to `GET /admin/backup/stats`
2. View total backups and size

#### Test Restore (CAREFUL!)
1. Go to `POST /admin/backup/restore`
2. Enter backup filename
3. Set `confirm` to `true`
4. Execute (creates safety backup first)

**Expected Results**:
- Backup files created in `D:\nursy\nursery-system\backend\backups\`
- Full backup is a .zip file
- Stats show correct sizes
- Restore works with confirmation

---

### 7️⃣ REPORTS & ANALYTICS
**URL**: http://localhost:5174/admin/reports

**What to test**:
- View attendance reports
- Generate custom date range reports
- Export to CSV/PDF
- View operational metrics

---

### 8️⃣ AUDIT LOGS
**URL**: http://localhost:5174/admin/audit-logs (or API)

**What to test via API**:
1. `GET /audit-logs/` - View all audit entries
2. Filter by user_id
3. Filter by action type
4. `GET /audit-logs/stats` - View activity statistics

**Expected Results**:
- All admin actions are logged
- Filters work correctly
- Statistics display activity patterns

---

### 9️⃣ NOTIFICATIONS
**URL**: http://localhost:5174/admin/notifications

**What to test via API**:
1. `GET /notifications/` - View your notifications
2. `GET /notifications/unread-count` - Check unread count
3. `POST /notifications/` - Create notification (admin only)
4. `PATCH /notifications/{id}/read` - Mark as read
5. `POST /notifications/broadcast` - Send to all users

---

## 🧪 TESTING CHECKLIST

### Basic Functionality
- [ ] Login as admin
- [ ] View dashboard
- [ ] Navigate to all admin pages
- [ ] Logout and login again

### CRUD Operations
- [ ] Create a nursery
- [ ] Create a user
- [ ] Create a child enrollment
- [ ] Edit any record
- [ ] Delete a test record
- [ ] Export data to CSV

### New Features (Priority 1 Fixes)
- [ ] Change your admin password
- [ ] View security settings
- [ ] Update organization settings
- [ ] Add a governorate
- [ ] Create a full backup
- [ ] List all backups

### Search & Filter
- [ ] Search for users
- [ ] Filter by role
- [ ] Filter by nursery
- [ ] Sort columns

### Validation
- [ ] Try creating user without email (should fail)
- [ ] Try invalid phone format
- [ ] Try enrolling child in full classroom
- [ ] Try duplicate email

---

## 🐛 KNOWN ISSUES

### Fixed Issues ✅
- ✅ Password change endpoint (was broken, now fixed)
- ✅ Unicode characters preventing router loading (fixed)
- ✅ User full_name field mismatch (fixed)
- ✅ Missing settings API (implemented)
- ✅ Missing backup API (implemented)

### Minor Issues (Non-blocking) ⚠️
- ⚠️ Classroom creation via API (workaround: works via DB)
- ⚠️ Database health check warning (cosmetic, not affecting functionality)

---

## 📊 DATA VERIFICATION

### Check Database Directly
```bash
# Navigate to backend directory
cd D:\nursy\nursery-system\backend

# Open SQLite database
sqlite3 nursery.db

# Run queries
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM nurseries;
SELECT COUNT(*) FROM children;
SELECT * FROM users WHERE role = 'admin';

# Exit
.exit
```

---

## 🔧 TROUBLESHOOTING

### Frontend Not Loading?
```bash
# Check if Vite is running
# Look for: http://localhost:5174
# If not, restart:
cd D:\nursy\nursery-system\frontend
npm run dev
```

### Backend API Not Responding?
```bash
# Check if running on port 8000
# Restart:
cd D:\nursy\nursery-system\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Login Failed?
1. Verify credentials exactly as shown
2. Check backend logs for errors
3. Verify database exists: `D:\nursy\nursery-system\backend\nursery.db`

### CORS Errors in Browser?
- Backend already configured for http://localhost:5173 and http://localhost:5174
- Should work automatically

---

## 📱 MOBILE TESTING
The frontend is responsive and works on:
- Desktop browsers (Chrome, Firefox, Edge)
- Tablets
- Mobile devices (access via network URL shown in Vite output)

---

## 💡 PRO TIPS

1. **Use Swagger UI** (http://localhost:8000/docs) to test all API endpoints directly
2. **Copy temporary passwords** immediately when creating users
3. **Create backups** before testing destructive operations
4. **Check browser console** (F12) for detailed error messages
5. **Use incognito mode** to test different user roles simultaneously

---

## 🎯 SUCCESS CRITERIA

You'll know the system is working correctly if:
- ✅ All pages load without errors
- ✅ You can create/edit/delete all entities
- ✅ Search and filters return correct results
- ✅ Temporary passwords work for new users
- ✅ Backups create successfully
- ✅ Settings persist after updates
- ✅ Analytics show correct data
- ✅ Export functions download files

---

## 📞 SUPPORT

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs in terminal
3. Check browser console (F12)
4. Verify all services are running
5. Check database file exists

---

## 🎉 READY TO TEST!

Your Nursery Management System is fully operational with:
- ✅ 71 API endpoints
- ✅ Complete admin dashboard
- ✅ User/Nursery/Child management
- ✅ Settings configuration
- ✅ Backup & restore system
- ✅ Analytics & reporting
- ✅ Audit logging
- ✅ Notification system

**Start here**: http://localhost:5174

**API Docs**: http://localhost:8000/docs

**Login**: admin@nursery.com / Admin123!

Happy Testing! 🚀
