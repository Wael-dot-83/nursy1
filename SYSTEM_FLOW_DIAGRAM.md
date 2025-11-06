# 🎯 System Startup Flow

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER COMMAND                             │
│                                                                  │
│  Windows: run-all.bat      Linux/Mac: bash run-all.sh          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-FLIGHT CHECKS                             │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Directory Structure (nursery-system/backend, frontend)       │
│  ✓ Python Installed (3.8+)                                      │
│  ✓ Node.js Installed (16+)                                      │
│  ✓ npm Installed                                                │
│  ✓ Port 8002 Available (Backend)                                │
│  ✓ Port 5174 Available (Frontend)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SETUP                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Check/Create Virtual Environment                             │
│     └─> python -m venv venv                                     │
│                                                                  │
│  2. Activate Virtual Environment                                 │
│     └─> venv/Scripts/activate.bat (Windows)                     │
│     └─> source venv/bin/activate (Linux/Mac)                    │
│                                                                  │
│  3. Install Dependencies                                         │
│     └─> pip install -r requirements.txt                         │
│                                                                  │
│  4. Check/Seed Database                                          │
│     └─> python seed_db.py (if nursery.db missing)              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND SETUP                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Check Node Modules                                           │
│     └─> Check if node_modules/ exists                           │
│                                                                  │
│  2. Install Dependencies                                         │
│     └─> npm install (if node_modules missing)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    START SERVICES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BACKEND (Port 8002)                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ python run.py                                           │    │
│  │  ├─> FastAPI Application                               │    │
│  │  ├─> Uvicorn ASGI Server                               │    │
│  │  ├─> SQLite Database (nursery.db)                      │    │
│  │  ├─> JWT Authentication                                │    │
│  │  ├─> CORS Middleware                                   │    │
│  │  └─> API Endpoints (/auth, /admin, /children, etc.)   │    │
│  │                                                         │    │
│  │ Logs: logs/backend.log                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          │ http://localhost:8002                │
│                          │                                       │
│  FRONTEND (Port 5174)    │                                       │
│  ┌────────────────────────┼───────────────────────────────┐    │
│  │ npm run dev            │                                │    │
│  │  ├─> Vite Dev Server   │                                │    │
│  │  ├─> React Application │                                │    │
│  │  ├─> Tailwind CSS      │                                │    │
│  │  ├─> React Router      │                                │    │
│  │  ├─> Axios HTTP Client │                                │    │
│  │  └─> API Proxy         │                                │    │
│  │      └─> /api/* ───────┘ Rewrite to /* on backend      │    │
│  │                                                         │    │
│  │ Logs: logs/frontend.log                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          │ http://localhost:5174                │
└──────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM READY                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🌐 Frontend:  http://localhost:5174                            │
│  🔧 Backend:   http://localhost:8002                            │
│  📚 API Docs:  http://localhost:8002/docs                       │
│                                                                  │
│  👥 Test Accounts:                                               │
│     • Admin:      admin@nursery.com / Admin123!                 │
│     • Manager:    manager@nursery.com / Manager123!             │
│     • Supervisor: supervisor@nursery.com / Supervisor123!       │
│     • Parent:     parent@nursery.com / Parent123!               │
│                                                                  │
│  📁 Logs:                                                        │
│     • Backend:  logs/backend.log                                │
│     • Frontend: logs/frontend.log                               │
└─────────────────────────────────────────────────────────────────┘
```

## API Request Flow

```
┌─────────────┐                ┌──────────────┐                ┌─────────────┐
│   Browser   │                │ Vite Proxy   │                │   FastAPI   │
│             │                │  (Port 5174) │                │ (Port 8002) │
└──────┬──────┘                └──────┬───────┘                └──────┬──────┘
       │                              │                               │
       │  GET /api/auth/login         │                               │
       │─────────────────────────────>│                               │
       │                              │                               │
       │                              │  GET /auth/login              │
       │                              │  (removes /api prefix)        │
       │                              │──────────────────────────────>│
       │                              │                               │
       │                              │  Response: {token, user}      │
       │                              │<──────────────────────────────│
       │                              │                               │
       │  Response: {token, user}     │                               │
       │<─────────────────────────────│                               │
       │                              │                               │
```

## Process Monitoring (Bash Script)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING LOOP                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Every 5 seconds:                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  1. Check Backend Process (PID from PID file)          │    │
│  │     ├─> If alive: Continue                             │    │
│  │     └─> If dead: Show error, cleanup, exit             │    │
│  │                                                         │    │
│  │  2. Check Frontend Process (PID from PID file)         │    │
│  │     ├─> If alive: Continue                             │    │
│  │     └─> If dead: Show error, cleanup, exit             │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  On Ctrl+C (SIGINT/SIGTERM):                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  1. Trap signal                                         │    │
│  │  2. Kill backend process                                │    │
│  │  3. Kill frontend process                               │    │
│  │  4. Kill processes on ports 8002 & 5174                │    │
│  │  5. Remove PID files                                    │    │
│  │  6. Display success message                             │    │
│  │  7. Exit cleanly                                        │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Windows vs Linux/Mac Behavior

```
┌──────────────────────────────┬──────────────────────────────────┐
│        Windows (BAT)         │      Linux/Mac (Bash)            │
├──────────────────────────────┼──────────────────────────────────┤
│                              │                                  │
│  Backend: Separate Window    │  Backend: Background Process     │
│  Frontend: Separate Window   │  Frontend: Background Process    │
│                              │                                  │
│  Windows stay open           │  Main script monitors            │
│  Services continue if main   │  Ctrl+C stops all                │
│  window closed               │                                  │
│                              │                                  │
│  Auto-open browser           │  No auto-open (manual)           │
│                              │                                  │
│  Kill: Close windows         │  Kill: Ctrl+C in terminal        │
│                              │                                  │
│  Logs: logs/*.log            │  Logs: logs/*.log                │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

## File Structure After Running

```
d:\nursy\
├── run-all.bat                    ⭐ All-in-one Windows runner
├── run-all.sh                     ⭐ All-in-one Linux/Mac runner
├── start-backend.bat              (Manual backend start)
├── start-frontend.bat             (Manual frontend start)
├── RUN_SYSTEM.md                  📖 Main execution guide
├── RUN_ALL_GUIDE.md              📖 Detailed runner documentation
├── ALL_IN_ONE_RUNNER_COMPLETE.md 📖 Implementation summary
│
├── logs/                          ⭐ Auto-created by runner
│   ├── backend.log                 Backend server logs
│   └── frontend.log                Frontend dev server logs
│
└── nursery-system/
    ├── backend/
    │   ├── venv/                   ⭐ Auto-created by runner
    │   │   ├── .deps_installed     Marker file
    │   │   ├── Scripts/            Windows activation
    │   │   └── bin/                Linux/Mac activation
    │   ├── nursery.db              ⭐ Auto-seeded by runner
    │   ├── run.py                  Backend entry point
    │   ├── seed_db.py              Database seeder
    │   └── requirements.txt        Python dependencies
    │
    └── frontend/
        ├── node_modules/           ⭐ Auto-installed by runner
        ├── package.json            NPM dependencies
        ├── vite.config.js          Proxy configuration
        └── src/                    React application
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Scenario 1: Port Already in Use                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Detection → Warning → Ask User → Kill Process → Retry  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Scenario 2: Python Not Found                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Check → Error Message → Exit with Instructions         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Scenario 3: Dependencies Failed                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Install → Error → Show Command → Exit                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Scenario 4: Service Won't Start                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Start → Wait → Check → Error → Show Log Path → Exit    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Scenario 5: Process Crash (Bash only)                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Monitor → Detect → Error → Cleanup → Exit              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Commands
```bash
# Start everything
run-all.bat              # Windows
bash run-all.sh          # Linux/Mac

# Monitor logs
Get-Content logs\backend.log -Wait -Tail 50   # Windows (PowerShell)
tail -f logs/backend.log                      # Linux/Mac

# Stop services
[Close windows]          # Windows
Ctrl+C                   # Linux/Mac (in script terminal)

# Check status
curl http://localhost:8002/health             # Backend
curl http://localhost:5174                    # Frontend

# Kill ports manually
netstat -ano | findstr :8002; taskkill /PID <PID> /F    # Windows
lsof -ti:8002 | xargs kill -9                           # Linux/Mac
```

### URLs
- Frontend: http://localhost:5174
- Backend API: http://localhost:8002
- API Documentation: http://localhost:8002/docs
- Health Check: http://localhost:8002/health

### Test Credentials
- Admin: admin@nursery.com / Admin123!
- Manager: manager@nursery.com / Manager123!
- Supervisor: supervisor@nursery.com / Supervisor123!
- Parent: parent@nursery.com / Parent123!

### Log Files
- Backend: `logs/backend.log`
- Frontend: `logs/frontend.log`

---

**Everything is automated! Just run one command and start testing! 🚀**
