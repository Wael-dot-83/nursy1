# Nursery Creation - Production Testing Guide

## 🎯 Current Status

✅ **All Services Running**
- Backend: http://localhost:8000 (healthy)
- Frontend: http://localhost:4173 (healthy)
- Database: PostgreSQL with 12 governorates seeded
- Redis: Session management active

✅ **Database Schema Fixed**
- Added `users.branch_id` column
- Added `branches.name_normalized` column
- Added `branches.is_active` column
- All migrations applied successfully

✅ **API Endpoints Ready**
- `GET /api/admin/settings/governorates` - Returns 12 Jordan governorates
- `POST /api/admin/nurseries` - Creates nursery with branches

## 🧪 Manual Testing Steps

### 1. Open Application
Navigate to: **http://localhost:4173**

### 2. Login as Admin
```
Email: admin@example.com
Password: Admin123!
```

### 3. Navigate to Nursery Management
- Click on sidebar: **إدارة الحضانات** (Nursery Management)
- Or go directly to: http://localhost:4173/admin/nurseries

### 4. Click "إضافة حضانة" (Add Nursery)
You should see a multi-step form.

### 5. Test Case 1: Simple Nursery (No Branches)

**Step 1 - Basic Info:**
```
اسم الحضانة: حضانة الأمل
رقم الهاتف: 0791234567
البريد الإلكتروني: amal@test.com
```

**Step 2 - Location & Ages:**
```
الشارع: شارع الملك حسين
المدينة: عمان
المحافظة: عمان (select from dropdown - should show Arabic names)
الرمز البريدي: 11953
الحد الأدنى للعمر: 70 (days)
الحد الأقصى للعمر: 52 (months)
```

**Step 3 - Branches:**
- Select: **لا، الحضانة لها موقع واحد فقط** (No, single location only)

**Expected Result:**
- ✅ Nursery created successfully
- ✅ Modal shows director credentials (email + temporary password)
- ✅ Director appears in إدارة المستخدمين (User Management)

### 6. Test Case 2: Nursery with 2 Branches

**Step 1 - Basic Info:**
```
اسم الحضانة: حضانة المستقبل
رقم الهاتف: 0795555555
البريد الإلكتروني: future@test.com
```

**Step 2 - Location & Ages:**
```
الشارع: شارع الجامعة
المدينة: عمان
المحافظة: عمان
الرمز البريدي: 11942
الحد الأدنى للعمر: 70
الحد الأقصى للعمر: 52
```

**Step 3 - Branches:**
- Select: **نعم، الحضانة لها عدة أفرع** (Yes, multiple branches)
- Number of branches: **2**
- Click "إعداد نماذج الأفرع"

**Branch 1:**
```
اسم الفرع: فرع الجاردنز
رقم الهاتف: 0796666666
الشارع: دوار الجاردنز
المدينة: عمان
المحافظة: عمان
```

**Branch 2:**
```
اسم الفرع: فرع الصويفية  
رقم الهاتف: 0797777777
الشارع: شارع الصويفية
المدينة: عمان
المحافظة: عمان
```

**Expected Result:**
- ✅ Nursery created with 2 branches
- ✅ Modal shows 2 manager credentials (one per branch)
- ✅ Both managers appear in إدارة المستخدمين with branch assignment

## 🔍 Verification Checklist

After creating nurseries, verify:

### In Frontend UI:
- [ ] Governorate dropdown shows Arabic names (عمان, إربد, الزرقاء, etc.)
- [ ] Governorate dropdown values are integers (1, 2, 3, etc.)
- [ ] Form validation works (required fields, phone format)
- [ ] Branch sections appear/disappear based on selection
- [ ] Credentials modal shows after creation
- [ ] Copy buttons work for credentials

### In Admin → Users Page:
- [ ] Director user appears with role "DIRECTOR"
- [ ] Manager users appear with role "MANAGER"
- [ ] Branch managers show branch assignment
- [ ] Email format is correct (e.g., director@nursery-name.nursy.jo)

### In Database:
```sql
-- Check nurseries
SELECT id, name, main_phone, governorate_id FROM nurseries ORDER BY id DESC LIMIT 5;

-- Check branches
SELECT id, nursery_id, name, name_normalized, is_active FROM branches ORDER BY id DESC;

-- Check users with branches
SELECT id, email, role, nursery_id, branch_id FROM users WHERE role IN ('DIRECTOR', 'MANAGER') ORDER BY id DESC LIMIT 10;
```

## 🐛 Known Issues & Workarounds

### Issue 1: Governorate Dropdown Still Shows English
**Status:** Partial fix applied
**Workaround:** The dropdown should now fetch from API, but if you still see English names:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Create a nursery
4. Check if `/api/admin/settings/governorates` is called
5. Verify response has Arabic names

### Issue 2: Branch Names All Same as Nursery
**Status:** Fixed in code, needs testing
**Expected:** Each branch should use the name you enter (e.g., "فرع الجاردنز")
**Workaround:** If they all show nursery name, the frontend fix didn't apply - needs rebuild

## 🔧 Troubleshooting

### Backend Errors
```powershell
# View backend logs
docker logs nursy_backend --tail 100

# Check for validation errors or DB errors
docker logs nursy_backend | Select-String "error|Error|ERROR"
```

### Frontend Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed API calls

### Database Verification
```powershell
# Connect to database
docker compose exec db psql -U nursery_user -d nursery_db

# Check schema
\d users
\d branches
\d nurseries

# Verify governorates
SELECT * FROM governorates ORDER BY name_ar;
```

## 📊 Test Results Template

Document your test results:

```
Date: 2025-11-05
Tester: [Your Name]

Test Case 1: Simple Nursery
- Created: ✅ / ❌
- Credentials Shown: ✅ / ❌
- Director in Users: ✅ / ❌
- Notes: 

Test Case 2: Nursery with Branches
- Created: ✅ / ❌
- Branch Count Correct: ✅ / ❌
- Managers in Users: ✅ / ❌
- Branch Assignment: ✅ / ❌
- Notes:

Governorate Dropdown:
- Shows Arabic Names: ✅ / ❌
- Values are IDs: ✅ / ❌
- Notes:

Overall Status: ✅ Pass / ⚠️ Partial / ❌ Fail
```

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Document the working feature
   - Create user guide for admins
   - Deploy to staging/production

2. **If partial issues:**
   - Note specific problems
   - Check browser console for errors
   - Review backend logs
   - Report findings

3. **If major issues:**
   - Take screenshots of errors
   - Export browser console logs
   - Save backend logs
   - Create detailed bug report

## 📞 Support Commands

```powershell
# Restart all services
docker compose restart

# Rebuild frontend with changes
docker compose up -d --build frontend

# View all logs
docker compose logs -f

# Check service health
docker compose ps

# Access database
docker compose exec db psql -U nursery_user -d nursery_db
```

---

**Ready to test!** Open http://localhost:4173 and follow the steps above. 🎉
