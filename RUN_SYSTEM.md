# 🚀 Nursery Management System - Local Execution Guide

## 🎯 ONE-COMMAND START (Recommended)

### **Run Everything at Once**
The easiest way to start the complete system:

**Windows:**
```bash
d:\nursy\run-all.bat
```

**Linux/Mac (Git Bash):**
```bash
bash d:/nursy/run-all.sh
```

This single script will:
- ✅ Check all prerequisites (Python, Node.js, npm)
- ✅ Create virtual environment if needed
- ✅ Install all dependencies automatically
- ✅ Seed database if not exists
- ✅ Start backend server (port 8002)
- ✅ Start frontend server (port 5174)
- ✅ Open browser automatically
- ✅ Monitor both services
- ✅ Handle port conflicts
- ✅ Create detailed logs

**Expected Output:**
```
========================================
  System Pre-flight Checks
========================================

[OK] Directory structure verified
[OK] Python found
[OK] Node.js found
[OK] npm found
[OK] Ports are available

========================================
  Setting Up Backend
========================================

[OK] Virtual environment activated
[OK] Dependencies installed
[OK] Database found: nursery.db

========================================
  Setting Up Frontend
========================================

[INFO] Dependencies already installed

========================================
  Starting Services
========================================

[OK] Backend started
     API: http://localhost:8002
     Docs: http://localhost:8002/docs

[OK] Frontend started
     URL: http://localhost:5174

========================================
  System Ready! [SUCCESS]
========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Nursery Management System - RUNNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:  http://localhost:5174
Backend:   http://localhost:8002
API Docs:  http://localhost:8002/docs
```

---

## 📋 Manual Start (Alternative)

If you prefer to start services separately:

### **Step 1: Start Backend Server**
Open Command Prompt and run:
```bash
d:\nursy\start-backend.bat
```

**Expected Output:**
```
========================================
  Nursery System - Backend Server
========================================

Starting backend server on port 8002...

Virtual environment activated

Starting FastAPI server...
Backend API will be available at: http://localhost:8002
API Documentation: http://localhost:8002/docs

INFO:     Uvicorn running on http://0.0.0.0:8002 (Press CTRL+C to quit)
```

### **Step 2: Start Frontend Server** 
Open a **new** Command Prompt and run:
```bash
d:\nursy\start-frontend.bat
```

**Expected Output:**
```
========================================
  Nursery System - Frontend Server
========================================

Starting Vite development server...
Frontend will be available at: http://localhost:5174

API Proxy Configuration:
  - All /api/* requests proxy to http://localhost:8002

➜  Local:   http://localhost:5174/
```

### **Step 3: Access the Application**
Open your browser and navigate to:
- **http://localhost:5174/login**

---

## 👥 Test User Accounts

### Admin (Full Access)
- Email: `admin@nursery.com`
- Password: `Admin123!`

### Manager (Branch Management)
- Email: `manager@nursery.com`
- Password: `Manager123!`

### Supervisor (Daily Operations)
- Email: `supervisor@nursery.com`
- Password: `Supervisor123!`

### Parent (Child Monitoring)
- Email: `parent@nursery.com`
- Password: `Parent123!`

---

## 🔍 System Information

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8002
- **API Docs**: http://localhost:8002/docs
- **Database**: SQLite (./nursery.db)
- **CORS**: Enabled for localhost:5174

---

## ✅ Verification

### Check Backend Status
```bash
curl http://localhost:8002/health
```

### Check API Docs
Visit: http://localhost:8002/docs

### Test API Proxy
All frontend API calls now use the `/api` prefix and are automatically proxied to the backend.
Example: Frontend calls `/api/auth/login` → Proxied to backend `/auth/login`

---

## 📊 Monitoring & Logs

### View Real-time Logs
- **Backend Log:** `d:\nursy\logs\backend.log`
- **Frontend Log:** `d:\nursy\logs\frontend.log`

### Check Service Status
```bash
# Check if backend is running
curl http://localhost:8002/health

# Check if frontend is running
curl http://localhost:5174
```

---

## 🆘 Troubleshooting

**Issue: run-all.bat/run-all.sh not starting**
- Ensure you're in the correct directory (`d:\nursy`)
- Check that Python and Node.js are installed
- Run `python --version` and `node --version` to verify

**Issue: Port 8002 already in use**
```bash
netstat -ano | findstr :8002
taskkill /PID <PID> /F
```

**Issue: Port 5174 already in use**
```bash
netstat -ano | findstr :5174
taskkill /PID <PID> /F
```

**Issue: Node modules missing**
```bash
cd d:\nursy\nursery-system\frontend
npm install
npm run dev
```

---

**The system is production-ready and fully integrated!** 🎉
