@echo off
setlocal EnableDelayedExpansion

REM Ensure script runs from its own directory
cd /d "%~dp0"

REM ========================================
REM   Nursery Management System
REM   Complete System Runner (Windows)
REM ========================================

REM Configuration
set BACKEND_PORT=8002
set FRONTEND_PORT=5174
set BACKEND_DIR=nursery-system\backend
set FRONTEND_DIR=nursery-system\frontend
set DATABASE_FILE=nursery-system\backend\nursery.db

REM Create logs directory if not exists
if not exist "logs" mkdir logs

REM ========================================
REM Pre-flight Checks
REM ========================================

echo ========================================
echo   System Pre-flight Checks
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)
if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Frontend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [OK] Directory structure verified
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.8+ and make sure it's in your PATH.
    echo Download from: https://python.org
    pause
    exit /b 1
)

echo [OK] Python found
python --version
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 16+ and make sure it's in your PATH.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo.

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    echo npm should come with Node.js. Please reinstall Node.js.
    pause
    exit /b 1
)

echo [OK] npm found
npm --version
echo.

REM Check if ports are in use
echo Checking if ports are available...
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port %BACKEND_PORT% is already in use!
    echo.
    set /p kill_backend="Kill process and continue? (y/n): "
    if /i "!kill_backend!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
            echo Killing process %%a...
            taskkill /PID %%a /F >nul 2>&1
        )
        timeout /t 2 >nul
    ) else (
        echo Cannot start - port %BACKEND_PORT% is in use
        pause
        exit /b 1
    )
)

netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port %FRONTEND_PORT% is already in use!
    echo.
    set /p kill_frontend="Kill process and continue? (y/n): "
    if /i "!kill_frontend!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
            echo Killing process %%a...
            taskkill /PID %%a /F >nul 2>&1
        )
        timeout /t 2 >nul
    ) else (
        echo Cannot start - port %FRONTEND_PORT% is in use
        pause
        exit /b 1
    )
)

echo [OK] Ports are available
echo.

REM ========================================
REM Backend Setup
REM ========================================

echo ========================================
echo   Setting Up Backend
echo ========================================
echo.

cd %BACKEND_DIR%

REM Check for virtual environment
if not exist "venv\Scripts\activate.bat" (
    echo [WARNING] Virtual environment not found. Creating...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        echo Make sure you have Python venv module installed.
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated
echo.

REM Upgrade pip first
echo Upgrading pip...
python -m pip install --upgrade pip
echo.

REM Install dependencies if needed
echo Checking backend dependencies...
if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found!
    pause
    exit /b 1
)

pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    echo Check your internet connection and try again.
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

REM Check database and run migrations
echo Checking database...
if not exist "nursery.db" (
    echo [WARNING] Database not found. Initializing database...

    REM Run database initialization
    python -c "from app.database import init_db; init_db()"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to initialize database schema
        pause
        exit /b 1
    )
    echo [OK] Database schema initialized
    echo.

    REM Seed database
    if exist "seed_db.py" (
        echo Seeding database with initial data...
        python seed_db.py
        if %errorlevel% neq 0 (
            echo [ERROR] Failed to seed database
            pause
            exit /b 1
        )
        echo [OK] Database seeded successfully
    ) else (
        echo [WARNING] seed_db.py not found - skipping database seeding
    )
    echo.
) else (
    echo [OK] Database found: nursery.db
    echo.
)

REM Run password reset migration if it exists
if exist "password_reset_migration.sql" (
    echo Checking password reset migration...
    REM Note: This would need to be run manually or integrated with alembic
    echo [INFO] Password reset migration available: password_reset_migration.sql
    echo [INFO] Run this manually if needed for password reset feature
    echo.
)

REM ========================================
REM Frontend Setup
REM ========================================

cd ..\..
cd %FRONTEND_DIR%

echo ========================================
echo   Setting Up Frontend
echo ========================================
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found!
    pause
    exit /b 1
)

REM Install node modules if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    echo This may take a few minutes...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        echo Check your internet connection and try again.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed
    echo.
) else (
    echo [INFO] Frontend dependencies already installed
    echo.
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo [WARNING] Frontend .env file not found. Creating from example...
    if exist ".env.example" (
        copy .env.example .env
        echo [OK] .env file created from .env.example
        echo [INFO] Please review and update .env file with your configuration
    ) else (
        echo [WARNING] .env.example not found. Creating basic .env file...
        echo VITE_API_BASE_URL=http://localhost:%BACKEND_PORT%> .env
        echo [OK] Basic .env file created
    )
    echo.
) else (
    echo [OK] Frontend .env file found
    echo.
)

REM ========================================
REM Start Services
REM ========================================

cd ..\..

echo ========================================
echo   Starting Services
echo ========================================
echo.

REM Start Backend in new window
echo Starting backend server on port %BACKEND_PORT%...
start "Nursery Backend" /MIN cmd /c "cd %BACKEND_DIR% && call venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT% --reload > ..\..\logs\backend.log 2>&1"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start backend server
    pause
    exit /b 1
)
timeout /t 3 >nul
echo [OK] Backend started
echo     API: http://localhost:%BACKEND_PORT%
echo     Docs: http://localhost:%BACKEND_PORT%/docs
echo.

REM Start Frontend in new window
echo Starting frontend server on port %FRONTEND_PORT%...
cd %FRONTEND_DIR%
start "Nursery Frontend" /MIN cmd /c "npm run dev -- --port %FRONTEND_PORT% > ..\..\logs\frontend.log 2>&1"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start frontend server
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
timeout /t 5 >nul
echo [OK] Frontend started
echo     URL: http://localhost:%FRONTEND_PORT%
echo.

REM ========================================
REM System Ready
REM ========================================

echo.
echo ========================================
echo   System Ready! [SUCCESS]
echo ========================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Nursery Management System - RUNNING
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Frontend:  http://localhost:%FRONTEND_PORT%
echo Backend:   http://localhost:%BACKEND_PORT%
echo API Docs:  http://localhost:%BACKEND_PORT%/docs
echo.
echo Test Accounts:
echo   Admin:      admin@nursery.com / Admin123!
echo   Manager:    manager@nursery.com / Manager123!
echo   Supervisor: supervisor@nursery.com / Supervisor123!
echo   Parent:     parent@nursery.com / Parent123!
echo.
echo Logs:
echo   Backend:  logs\backend.log
echo   Frontend: logs\frontend.log
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo [INFO] Backend and Frontend are running in separate windows
echo [INFO] You can minimize this window - services will continue running
echo [INFO] To stop services, close the "Nursery Backend" and "Nursery Frontend" windows
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:%FRONTEND_PORT%

echo.
echo Application opened in browser!
echo.
echo Keep this window open to monitor the system.
echo Press any key to exit (services will continue running)...
pause >nul

exit /b 0