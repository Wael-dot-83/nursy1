# 🚀 QUICK START GUIDE
**Nursery Management System - Local Development**

---

## ⚡ Start Everything (Automatic)

```powershell
cd d:\nursy
.\run-all.bat
```

This single command will:
- ✅ Check prerequisites (Python, Node.js)
- ✅ Setup virtual environment
- ✅ Install dependencies
- ✅ Seed database if needed
- ✅ Start backend on port 8002
- ✅ Start frontend on port 5173
- ✅ Open browser automatically

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main application |
| **API Docs** | http://localhost:8002/docs | API testing |
| **Backend** | http://localhost:8002 | REST API |

---

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@nursery.com | Admin123! |
| **Manager** | manager@nursery.com | Manager123! |
| **Supervisor** | supervisor@nursery.com | Supervisor123! |
| **Parent** | parent@nursery.com | Parent123! |

---

## 🔧 Manual Start (Step by Step)

### 1. Start Backend
```powershell
cd d:\nursy\nursery-system\backend
.\venv\Scripts\activate.ps1
python run.py
```
✅ Backend: http://localhost:8002

### 2. Start Frontend (new terminal)
```powershell
cd d:\nursy\nursery-system\frontend
npm run dev
```
✅ Frontend: http://localhost:5173

---

## 🛑 Stop Everything

**Option 1:** Press `Ctrl+C` in each terminal  
**Option 2:** Close terminal windows  
**Option 3:** Kill processes:
```powershell
# Kill all
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force
```

---

## 🆘 Quick Fixes

### Port Already in Use
```powershell
# Kill process on specific port
$pid = (netstat -ano | findstr ":8002") -split '\s+' | Select-Object -Last 1
Stop-Process -Id $pid -Force
```

### Database Reset
```powershell
cd d:\nursy\nursery-system\backend
del nursery.db
python seed_db.py
```

### Frontend Issues
```powershell
cd d:\nursy\nursery-system\frontend
rm -rf node_modules
npm install
```

---

## 📊 Health Checks

```powershell
# Backend health
Invoke-WebRequest http://localhost:8002/health

# Frontend health
Invoke-WebRequest http://localhost:5173

# Check ports
netstat -ano | findstr "8002 5173"
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `run-all.bat` | Auto-start everything |
| `nursery-system/backend/nursery.db` | Database |
| `nursery-system/backend/seed_db.py` | Reset data |
| `SYSTEM_STATUS_LIVE.md` | Full status report |

---

## ✅ Current Status

- **Backend:** ✅ Running on 8002
- **Frontend:** ✅ Running on 5173
- **Database:** ✅ Ready (136 KB)
- **Status:** 🟢 ALL SYSTEMS OPERATIONAL

---

**Last Updated:** 2025-11-02  
**Next:** Login and test workflows!
