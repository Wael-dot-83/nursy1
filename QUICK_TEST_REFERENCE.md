# 🎯 Quick Testing Reference Card

## Application Access
- **Frontend**: http://localhost:4173 ← **OPEN THIS NOW**
- **API Docs**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000

## 🔑 Login Credentials

### System Admin (Full Access)
```
Email: admin@example.com
Password: Admin123!
```

## 📋 Quick Test Steps

### 1️⃣ **Login as Admin** (2 minutes)
1. Open http://localhost:4173
2. Enter email: `admin@example.com`
3. Enter password: `Admin123!`
4. Click Login
5. ✅ Should see admin dashboard

### 2️⃣ **Create a Nursery** (5 minutes)
1. Click "Nurseries" in sidebar
2. Click "+ Create Nursery"
3. Fill in form:
   - Nursery Name (Arabic): `حضانة الأمل`
   - Nursery Name (English): `Hope Nursery`
   - Phone: `01234567890`
   - Governorate: Select `القاهرة`
   - Director: `Ahmed Hassan`
4. Add Branch 1:
   - Name: `Main Branch` / `الفرع الرئيسي`
   - Phone: `01234567890`
   - Manager: `Mohamed Ali`
5. Click "+ Add Branch"
6. Add Branch 2:
   - Name: `Maadi Branch` / `فرع المعادي`
   - Phone: `01098765432`
   - Manager: `Sara Ibrahim`
7. Click "Create Nursery"
8. ✅ Should see credentials modal
9. **COPY THE CREDENTIALS!** (You'll need them for next step)

### 3️⃣ **Test Director Login** (3 minutes)
1. Logout from admin
2. Use Director email/password from credentials modal
3. ✅ Should be prompted to change password
4. Change password to: `Director123!`
5. ✅ Should see director dashboard
6. ✅ Should see nursery and both branches

### 4️⃣ **Test Manager Login** (3 minutes)
1. Logout from director
2. Use Manager email/password from credentials modal
3. ✅ Should be prompted to change password
4. Change password to: `Manager123!`
5. ✅ Should see manager dashboard
6. ✅ Should ONLY see their specific branch

### 5️⃣ **Check Users List** (1 minute)
1. Login as admin again
2. Click "Users" in sidebar
3. ✅ Should see:
   - System Administrator
   - Director (Ahmed Hassan)
   - Manager 1 (Mohamed Ali)
   - Manager 2 (Sara Ibrahim)

## ✅ Success Criteria

- [ ] Admin can login
- [ ] Admin can create nursery with 2 branches
- [ ] Credentials modal shows all 3 users (1 director + 2 managers)
- [ ] Director can login and change password
- [ ] Director can see both branches
- [ ] Manager can login and change password
- [ ] Manager can only see their branch
- [ ] Arabic text displays correctly (no boxes or ?????)
- [ ] All users appear in Users list

## 🐛 Troubleshooting

### Can't login?
```powershell
# Check backend logs
.\nursy.bat logs-backend
```

### Service not running?
```powershell
# Check status
.\nursy.bat ps

# Restart services
.\nursy.bat restart
```

### Frontend not loading?
```powershell
# Check frontend logs
.\nursy.bat logs-frontend
```

### Database issues?
```powershell
# Reset database (⚠️ deletes all data)
.\nursy.bat db-reset
```

## 📸 Screenshots to Capture

1. Login page
2. Admin dashboard
3. Create nursery form (with Arabic text)
4. Credentials modal showing all 3 users
5. Director dashboard
6. Manager dashboard (showing only 1 branch)
7. Users list showing all roles

## 🎬 Video Recording Tips

If recording:
1. Start with login
2. Show nursery creation process
3. Show credentials modal (blur sensitive info)
4. Show different role dashboards
5. Highlight Arabic text rendering
6. End with users list

## ⏱️ Total Test Time
- **Quick Test**: ~15 minutes (just login + create nursery)
- **Full Test**: ~30 minutes (all scenarios)
- **Thorough Test**: ~60 minutes (including edge cases)

---

**READY! Open http://localhost:4173 now and start testing!** 🚀

See `MANUAL_TESTING_GUIDE.md` for complete detailed scenarios.
