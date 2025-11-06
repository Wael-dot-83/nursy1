# ⚡ Quick Start - One Command

## 🚀 Start Everything Now!

### Windows Users
```bash
cd d:\nursy
run-all.bat
```

### Linux/Mac/Git Bash Users
```bash
cd /d/nursy
bash run-all.sh
```

## What Happens Next?

The script will automatically:
1. ✅ Check prerequisites (Python, Node.js, npm)
2. ✅ Create virtual environment (first run only)
3. ✅ Install all dependencies (first run only)
4. ✅ Seed database with test users (if needed)
5. ✅ Start backend on http://localhost:8002
6. ✅ Start frontend on http://localhost:5174
7. ✅ Open your browser automatically
8. ✅ Display test account credentials

## ⏱️ Time Required

**First Run (Fresh Install):**
- ~5-6 minutes (installs everything)

**Subsequent Runs:**
- ~5-10 seconds (just starts servers)

## 🎯 What You'll See

```
========================================
  System Ready! [SUCCESS]
========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Nursery Management System - RUNNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:  http://localhost:5174
Backend:   http://localhost:8002
API Docs:  http://localhost:8002/docs

Test Accounts:
  Admin:      admin@nursery.com / Admin123!
  Manager:    manager@nursery.com / Manager123!
  Supervisor: supervisor@nursery.com / Supervisor123!
  Parent:     parent@nursery.com / Parent123!
```

## 🔐 Login Now

Your browser will open automatically to:
**http://localhost:5174/login**

Use any of these test accounts:
- **Admin** (full access): admin@nursery.com / Admin123!
- **Manager** (branch management): manager@nursery.com / Manager123!
- **Supervisor** (daily operations): supervisor@nursery.com / Supervisor123!
- **Parent** (child monitoring): parent@nursery.com / Parent123!

## 🛑 Stop the System

**Windows:**
- Close the "Nursery Backend" and "Nursery Frontend" windows
- Or use Task Manager to end the processes

**Linux/Mac:**
- Press `Ctrl+C` in the terminal running the script
- All services will stop gracefully

## 📊 Monitor Logs

**Real-time monitoring:**
```bash
# Windows (PowerShell)
Get-Content logs\backend.log -Wait -Tail 50
Get-Content logs\frontend.log -Wait -Tail 50

# Linux/Mac
tail -f logs/backend.log
tail -f logs/frontend.log
```

## ❓ Troubleshooting

**Problem: "Port already in use"**
- The script will offer to kill the conflicting process
- Choose "y" to proceed automatically

**Problem: "Python is not installed"**
- Install Python 3.8+ from https://python.org
- Make sure to add Python to PATH during installation

**Problem: "Node.js is not installed"**
- Install Node.js 16+ from https://nodejs.org

**Problem: Services won't start**
- Check logs in `logs/backend.log` and `logs/frontend.log`
- Make sure ports 8002 and 5174 are not blocked by firewall

## 📚 More Information

- **Complete Guide:** See `RUN_SYSTEM.md`
- **Detailed Documentation:** See `RUN_ALL_GUIDE.md`
- **Flow Diagrams:** See `SYSTEM_FLOW_DIAGRAM.md`

## 🎉 That's It!

No configuration needed. No manual setup. Just one command and you're ready to go!

```bash
run-all.bat     # Windows
bash run-all.sh # Linux/Mac
```

**Happy Testing! 🚀**
