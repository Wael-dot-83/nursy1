# Manual Testing Guide - End User Perspective

## 🎯 Quick Start

### Access Points
- **Frontend Application**: http://localhost:4173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database Admin (Adminer)**: http://localhost:8080

### Default Credentials

#### System Admin
- **Email**: `admin@example.com`
- **Password**: `Admin123!`
- **Role**: System Administrator
- **Permissions**: Full system access, create nurseries, manage all users

---

## 📋 Test Scenarios

### Scenario 1: Admin Login and Dashboard Access
**Objective**: Verify admin can login and access dashboard

1. **Open Application**
   - Navigate to http://localhost:4173
   - You should see the login page

2. **Login as Admin**
   - Email: `admin@example.com`
   - Password: `Admin123!`
   - Click "تسجيل الدخول" (Login)

3. **Verify Dashboard**
   - Should redirect to admin dashboard
   - Check for navigation menu
   - Verify Arabic text displays correctly (no mojibake)

**Expected Result**: ✅ Successfully logged in, dashboard visible

---

### Scenario 2: Create a New Nursery with Branches
**Objective**: Create a nursery with 2 branches as System Admin

1. **Navigate to Nurseries**
   - Click "Nurseries" or "الحضانات" in the sidebar

2. **Click Create New Nursery**
   - Click "+ Create Nursery" button

3. **Fill Main Nursery Information**
   ```
   Nursery Name (Arabic): حضانة الأمل
   Nursery Name (English): Hope Nursery
   Phone: 01234567890
   Governorate: Select "القاهرة" (Cairo) from dropdown
   Director First Name: Ahmed
   Director Last Name: Hassan
   ```

4. **Add First Branch**
   ```
   Branch Name (Arabic): الفرع الرئيسي
   Branch Name (English): Main Branch
   Address: 123 Main Street, Cairo
   Phone: 01234567890
   Manager First Name: Mohamed
   Manager Last Name: Ali
   ```

5. **Add Second Branch**
   - Click "+ Add Branch"
   ```
   Branch Name (Arabic): فرع المعادي
   Branch Name (English): Maadi Branch
   Address: 456 Maadi Street, Cairo
   Phone: 01098765432
   Manager First Name: Sara
   Manager Last Name: Ibrahim
   ```

6. **Submit Form**
   - Click "Create Nursery" button
   - Wait for success message

7. **Check Credentials Modal**
   - A modal should appear showing:
     - Director credentials (email & temporary password)
     - Manager 1 credentials (email & temporary password)
     - Manager 2 credentials (email & temporary password)
   - **Important**: Copy these credentials for testing
   - Click "Close" or "تم"

**Expected Result**: ✅ Nursery created, credentials displayed, can see new nursery in list

---

### Scenario 3: Verify Arabic UTF-8 Rendering
**Objective**: Ensure Arabic text displays correctly throughout the application

1. **Check Governorate Dropdown**
   - Go to nursery creation form
   - Open governorate dropdown
   - Verify Arabic governorate names display correctly:
     - القاهرة (Cairo)
     - الجيزة (Giza)
     - الإسكندرية (Alexandria)
   - Should NOT see: Γò¼ΓòÇΓò¼ΓòØΓò¼ΓòªΓò¼ΓòØΓò¼ΓòØΓò¼ΓòØ (mojibake)

2. **Check Form Labels**
   - All Arabic labels should be readable
   - Text should be right-to-left (RTL)
   - No garbled characters

3. **Check Data Table**
   - Nursery list should show Arabic names correctly
   - Branch names in Arabic should be readable

**Expected Result**: ✅ All Arabic text displays correctly, no mojibake

---

### Scenario 4: Login as Director (Multi-Role)
**Objective**: Test director role login and permissions

1. **Logout from Admin**
   - Click logout button

2. **Login as Director**
   - Use the director email from Scenario 2 credentials
   - Use the temporary password provided
   - Click "تسجيل الدخول" (Login)

3. **First Login - Password Reset**
   - Should be prompted to change password
   - Enter current password (temporary)
   - Enter new password: `Director123!`
   - Confirm new password: `Director123!`
   - Submit

4. **Verify Director Dashboard**
   - Should see director-specific dashboard
   - Can view nursery information
   - Can view branches under their nursery
   - Should NOT see "Create Nursery" option (admin only)

**Expected Result**: ✅ Director login works, password reset works, correct permissions

---

### Scenario 5: Login as Manager (Branch-Scoped)
**Objective**: Test manager role with branch-level access

1. **Logout from Director**
   - Click logout button

2. **Login as Manager**
   - Use manager email from Scenario 2 credentials
   - Use the temporary password provided
   - Click "تسجيل الدخول" (Login)

3. **First Login - Password Reset**
   - Change password to: `Manager123!`

4. **Verify Manager Dashboard**
   - Should see manager dashboard
   - Can only view/manage their specific branch
   - Can view children in their branch
   - Can manage attendance for their branch
   - Should NOT see other branches
   - Should NOT see "Create Nursery" option

**Expected Result**: ✅ Manager login works, can only see their branch data

---

### Scenario 6: View Users List (Admin Only)
**Objective**: Verify created users appear in the system

1. **Login as Admin**
   - Email: `admin@example.com`
   - Password: `Admin123!`

2. **Navigate to Users**
   - Click "Users" or "المستخدمين" in sidebar

3. **Verify Users List**
   - Should see System Administrator (yourself)
   - Should see Director created in Scenario 2
   - Should see both Managers created in Scenario 2
   - Check roles are correct:
     - admin@example.com → ADMIN
     - Director email → DIRECTOR
     - Manager emails → MANAGER

4. **Check User Details**
   - Click on a manager
   - Verify nursery_id and branch_id are set correctly
   - Manager should be linked to specific branch

**Expected Result**: ✅ All users visible with correct roles and associations

---

### Scenario 7: Governorate Seeding Verification
**Objective**: Ensure all 27 Egyptian governorates are seeded

1. **Login as Admin**

2. **Navigate to Nursery Creation**
   - Go to create nursery form

3. **Check Governorate Dropdown**
   - Open governorate dropdown
   - Verify at least 27 governorates are present
   - Check key governorates:
     - القاهرة (Cairo)
     - الإسكندرية (Alexandria)
     - الجيزة (Giza)
     - القليوبية (Qalyubia)
     - الدقهلية (Dakahlia)
     - أسوان (Aswan)
     - الأقصر (Luxor)

**Expected Result**: ✅ All 27 governorates present with correct Arabic names

---

### Scenario 8: API Testing (Optional)
**Objective**: Test backend API directly

1. **Open API Documentation**
   - Navigate to http://localhost:8000/docs

2. **Test Login Endpoint**
   - Click on `POST /api/auth/login`
   - Click "Try it out"
   - Enter:
     ```json
     {
       "email": "admin@example.com",
       "password": "Admin123!"
     }
     ```
   - Click "Execute"
   - Should receive access_token and refresh_token

3. **Test Protected Endpoint**
   - Copy the access_token from login response
   - Click on `GET /api/admin/users`
   - Click "Authorize" button (top right)
   - Enter: `Bearer <your_access_token>`
   - Click "Try it out" then "Execute"
   - Should see list of users

**Expected Result**: ✅ API endpoints work, authentication works

---

## 🔍 What to Check

### Visual Checks
- [ ] Arabic text displays correctly (no mojibake)
- [ ] Text direction is right-to-left (RTL) for Arabic
- [ ] Forms are properly aligned
- [ ] Buttons are clickable and responsive
- [ ] Modals appear and close properly
- [ ] Navigation menu works
- [ ] Colors and styling look professional

### Functional Checks
- [ ] Login works for all roles (Admin, Director, Manager)
- [ ] Logout works
- [ ] Password reset on first login works
- [ ] Creating nurseries works
- [ ] Adding multiple branches works
- [ ] Credentials modal appears after creation
- [ ] Users are created with correct roles
- [ ] Governorate dropdown has all 27 governorates
- [ ] Role-based access control works (managers can't see admin features)

### Data Checks
- [ ] Nursery data saves correctly
- [ ] Branch data links to nursery
- [ ] User accounts created with temp passwords
- [ ] Email format is correct (e.g., ahmed.hassan@hopursery.com)
- [ ] Phone numbers validate correctly
- [ ] Arabic names stored and retrieved without corruption

---

## 🐛 Common Issues and Fixes

### Issue 1: Login Doesn't Redirect
**Symptom**: After login, stays on login page

**Check**:
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed requests

**Fix**: May need to update frontend routing

### Issue 2: Arabic Text Shows as Boxes or ?????
**Symptom**: Arabic text displays as □□□□ or ?????

**Check**:
1. Check browser encoding (should be UTF-8)
2. Check API response headers (Content-Type: application/json; charset=utf-8)

**Fix**: Already handled in backend with UTF-8 encoding

### Issue 3: "Unauthorized" Error
**Symptom**: Can't access protected routes

**Check**:
1. Token might have expired
2. Check if logged in
3. Check browser console for 401 errors

**Fix**: Logout and login again

### Issue 4: Can't Create Nursery
**Symptom**: Form submission fails

**Check**:
1. All required fields filled
2. Phone number format (10-11 digits)
3. Branch count (at least 1)
4. Browser console for validation errors

**Fix**: Check form validation messages

---

## 📊 Test Checklist

### Pre-Testing
- [x] All services running: `docker compose ps`
- [x] Backend healthy: http://localhost:8000/health
- [x] Frontend accessible: http://localhost:4173
- [x] Database seeded with governorates and admin user

### Admin Role Testing
- [ ] Admin login successful
- [ ] Admin dashboard loads
- [ ] Can create nursery
- [ ] Can add multiple branches
- [ ] Credentials modal appears
- [ ] Can view all users
- [ ] Can logout

### Director Role Testing
- [ ] Director login successful
- [ ] Password reset on first login works
- [ ] Director dashboard loads
- [ ] Can view nursery details
- [ ] Can view all branches under nursery
- [ ] Cannot create new nurseries
- [ ] Can logout

### Manager Role Testing
- [ ] Manager login successful
- [ ] Password reset on first login works
- [ ] Manager dashboard loads
- [ ] Can only see their branch
- [ ] Cannot see other branches
- [ ] Cannot create nurseries
- [ ] Can logout

### Arabic/UTF-8 Testing
- [ ] Governorate names in Arabic display correctly
- [ ] Form labels in Arabic display correctly
- [ ] User input in Arabic saves correctly
- [ ] Data tables show Arabic text correctly
- [ ] No mojibake characters anywhere

---

## 🎬 Video Walkthrough Script

If recording a demo:

1. **Introduction** (30 seconds)
   - "Welcome to the Nursery Management System"
   - Show login page
   - Mention multi-role authentication

2. **Admin Features** (2 minutes)
   - Login as admin
   - Show dashboard
   - Create a nursery with 2 branches
   - Show credentials modal
   - Show users list

3. **Director Features** (1 minute)
   - Logout and login as director
   - Show password reset
   - Show director dashboard
   - Show nursery and branches view

4. **Manager Features** (1 minute)
   - Logout and login as manager
   - Show password reset
   - Show branch-specific view
   - Demonstrate limited permissions

5. **Arabic Support** (30 seconds)
   - Show governorate dropdown with Arabic names
   - Show Arabic form labels
   - Demonstrate RTL text direction

6. **Conclusion** (30 seconds)
   - Summarize features
   - Show API documentation
   - Thank you

---

## 📝 Test Results Template

Copy and fill this after testing:

```
## Test Session Report
Date: 2025-11-05
Tester: [Your Name]
Environment: Local Docker (Windows)

### Service Status
- Backend: ✅ Running
- Frontend: ✅ Running
- Database: ✅ Running
- Redis: ✅ Running

### Test Results
1. Admin Login: ✅ / ❌
2. Create Nursery: ✅ / ❌
3. Add Branches: ✅ / ❌
4. Credentials Modal: ✅ / ❌
5. Director Login: ✅ / ❌
6. Manager Login: ✅ / ❌
7. Password Reset: ✅ / ❌
8. Arabic Rendering: ✅ / ❌
9. Role Permissions: ✅ / ❌
10. Users List: ✅ / ❌

### Issues Found
- [List any issues here]

### Screenshots
- [Attach screenshots of key features]

### Notes
- [Any additional observations]
```

---

## 🚀 Quick Commands

```powershell
# Check service status
.\nursy.bat ps

# View logs
.\nursy.bat logs

# Restart services
.\nursy.bat restart

# Run backend tests
.\nursy.bat test

# Run health check
.\nursy.bat health

# Open backend shell
.\nursy.bat backend-shell

# Open database shell
.\nursy.bat db-shell
```

---

**Ready to test!** 🎉

Start by opening http://localhost:4173 in your browser and follow the scenarios above.
