# 🚀 All-in-One System Runner

## Overview
The `run-all.bat` (Windows) and `run-all.sh` (Linux/Mac/Git Bash) scripts provide a single-command solution to start the complete Nursery Management System, including backend, frontend, and all required services.

## Features

### ✨ Automated Setup
- **Pre-flight Checks**: Validates Python, Node.js, npm installation
- **Virtual Environment**: Creates and activates Python venv automatically
- **Dependency Management**: Installs backend and frontend dependencies
- **Database Initialization**: Seeds database with test data if needed
- **Port Management**: Detects and resolves port conflicts

### 🔍 Smart Monitoring
- **Health Checks**: Monitors both backend and frontend processes
- **Auto-Recovery**: Detects process failures and provides diagnostics
- **Detailed Logging**: Separate logs for backend and frontend
- **Status Display**: Real-time service status with color-coded output

### 🛡️ Error Handling
- **Graceful Shutdown**: Ctrl+C stops all services cleanly
- **Port Conflict Resolution**: Offers to kill conflicting processes
- **Dependency Validation**: Ensures all requirements are met
- **Detailed Error Messages**: Clear feedback on failures

## Usage

### Windows
```bash
cd d:\nursy
run-all.bat
```

### Linux/Mac/Git Bash
```bash
cd /d/nursy
bash run-all.sh
```

### First Run
On the first run, the script will:
1. Create Python virtual environment (~30 seconds)
2. Install backend dependencies (~2 minutes)
3. Install frontend dependencies (~3 minutes)
4. Seed database with test users (~5 seconds)
5. Start both servers (~5 seconds)

**Total first-run time: ~5-6 minutes**

### Subsequent Runs
After the first run:
1. Verify dependencies (instant)
2. Start both servers (~5 seconds)

**Total subsequent run time: ~5-10 seconds**

## Script Behavior

### Windows (`run-all.bat`)
- Opens backend and frontend in **separate minimized windows**
- Main window stays open for monitoring
- Services continue running even if you close the main window
- Opens browser automatically after startup
- To stop: Close the "Nursery Backend" and "Nursery Frontend" windows

### Linux/Mac (`run-all.sh`)
- Runs backend and frontend as **background processes**
- Main script monitors both processes
- **Press Ctrl+C** to stop all services gracefully
- Logs are written to `logs/backend.log` and `logs/frontend.log`
- PID files stored in `/tmp/` for process tracking

## Configuration

Default settings:
```bash
BACKEND_PORT=8002
FRONTEND_PORT=5174
BACKEND_DIR=nursery-system/backend
FRONTEND_DIR=nursery-system/frontend
DATABASE_FILE=nursery-system/backend/nursery.db
```

To change ports, edit the configuration section at the top of the script.

## Output

### Successful Startup
```
========================================
  System Ready! 🎉
========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Nursery Management System - RUNNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Frontend:  http://localhost:5174
🔧 Backend:   http://localhost:8002
📚 API Docs:  http://localhost:8002/docs

👥 Test Accounts:
   Admin:      admin@nursery.com / Admin123!
   Manager:    manager@nursery.com / Manager123!
   Supervisor: supervisor@nursery.com / Supervisor123!
   Parent:     parent@nursery.com / Parent123!

📁 Logs:
   Backend:  logs/backend.log
   Frontend: logs/frontend.log

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Logs

Both scripts create detailed logs in the `logs/` directory:

### Backend Log (`logs/backend.log`)
- FastAPI startup messages
- Uvicorn server info
- API request/response logs
- Database queries
- Error traces

### Frontend Log (`logs/frontend.log`)
- Vite dev server output
- Compilation status
- Hot module replacement (HMR) updates
- Build warnings/errors

## Troubleshooting

### Script Won't Start
**Issue:** "Required directories not found"
- **Solution:** Ensure you're running from `d:\nursy` directory

**Issue:** "Python is not installed"
- **Solution:** Install Python 3.8+ from python.org

**Issue:** "Node.js is not installed"
- **Solution:** Install Node.js 16+ from nodejs.org

### Port Conflicts
**Issue:** "Port 8002 is already in use"
- **Solution:** Script will offer to kill the process automatically
- **Manual:** Find and kill the process:
  ```bash
  # Windows
  netstat -ano | findstr :8002
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -ti:8002 | xargs kill -9
  ```

### Service Failures
**Issue:** "Backend failed to start"
- **Check:** `logs/backend.log` for error details
- **Common causes:**
  - Missing dependencies
  - Database corruption
  - Port conflicts
  
**Issue:** "Frontend failed to start"
- **Check:** `logs/frontend.log` for error details
- **Common causes:**
  - Missing node_modules
  - Port conflicts
  - Vite configuration errors

## Stopping Services

### Windows
- **Option 1:** Close the "Nursery Backend" and "Nursery Frontend" windows
- **Option 2:** Use Task Manager to end the processes
- **Option 3:** Kill by port:
  ```bash
  netstat -ano | findstr :8002
  taskkill /PID <PID> /F
  ```

### Linux/Mac
- **Option 1:** Press `Ctrl+C` in the terminal running `run-all.sh`
- **Option 2:** Kill by port:
  ```bash
  lsof -ti:8002 | xargs kill -9
  lsof -ti:5174 | xargs kill -9
  ```

## Comparison with Manual Scripts

| Feature | run-all.bat/sh | start-backend.bat + start-frontend.bat |
|---------|----------------|----------------------------------------|
| Commands needed | 1 | 2 |
| Dependency check | ✅ Automatic | ❌ Manual |
| Virtual environment | ✅ Auto-create | ⚠️ Must exist |
| Database setup | ✅ Auto-seed | ⚠️ Must exist |
| Port conflict handling | ✅ Yes | ❌ No |
| Process monitoring | ✅ Yes | ❌ No |
| Detailed logs | ✅ Yes | ⚠️ Console only |
| Auto-open browser | ✅ Yes (Windows) | ❌ No |
| Graceful shutdown | ✅ Yes | ⚠️ Manual |

## Best Practices

1. **First Run:** Always run from a clean state to ensure proper setup
2. **Development:** Use `run-all` for comprehensive monitoring
3. **Testing:** Check logs after startup to verify no errors
4. **Debugging:** Monitor `logs/backend.log` and `logs/frontend.log` in real-time
5. **Port Changes:** Update both backend and frontend configuration files

## Support

For issues or questions:
1. Check `logs/backend.log` and `logs/frontend.log`
2. Verify all prerequisites are installed
3. Ensure ports 8002 and 5174 are available
4. Review RUN_SYSTEM.md for additional guidance

---

**Note:** The all-in-one runner is the recommended way to start the system for development and testing. For production deployment, use the deployment guides in `nursery-system/DEPLOYMENT_GUIDE.md`.
