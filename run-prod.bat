@echo off
setlocal EnableDelayedExpansion

REM Ensure script runs from its own directory
cd /d "%~dp0"

REM ========================================
REM   Nursery Management System
REM   Production Runner (Windows)
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
echo   Production Pre-flight Checks
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
REM Backend Setup & Validation
REM ========================================

echo ========================================
echo   Backend Setup & Validation
echo ========================================
echo.

cd %BACKEND_DIR%

REM Check for virtual environment
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Backend virtual environment not found!
    echo Please run 'run-all.bat' first to set up the development environment.
    pause
    exit /b 1
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

REM Upgrade pip and install dependencies
echo Installing/updating backend dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    echo Check your internet connection and try again.
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

REM Validate backend can import
echo Validating backend imports...
python -c "from app.main import app; print('[OK] Backend imports successful')"
if %errorlevel% neq 0 (
    echo [ERROR] Backend import validation failed
    echo Check the backend logs for errors.
    pause
    exit /b 1
)
echo.

REM Check database
if not exist "nursery.db" (
    echo [WARNING] Database not found. Initializing...
    python -c "from app.database import init_db; init_db()"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to initialize database
        pause
        exit /b 1
    )
    echo [OK] Database initialized
) else (
    echo [OK] Database found
)
echo.

cd ..\..
echo.

REM ========================================
REM Frontend Setup & Build
REM ========================================

echo ========================================
echo   Frontend Setup & Build
echo ========================================
echo.

cd %FRONTEND_DIR%

REM Check package.json
if not exist "package.json" (
    echo [ERROR] package.json not found!
    pause
    exit /b 1
)

REM Install dependencies
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    echo Check your internet connection and try again.
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo [WARNING] Frontend .env file not found. Creating from example...
    if exist ".env.example" (
        copy .env.example .env
        echo [OK] .env file created from .env.example
        echo [INFO] Please review and update .env file with your production settings
    ) else (
        echo [WARNING] .env.example not found. Creating basic .env file...
        echo VITE_API_URL=http://localhost:%BACKEND_PORT%> .env
        echo VITE_ENVIRONMENT=production>> .env
        echo [OK] Basic .env file created
    )
    echo.
) else (
    echo [OK] Frontend .env file found
    echo.
)

REM Build for production
echo Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    echo Check the build output above for errors.
    pause
    exit /b 1
)
echo [OK] Frontend built successfully
echo.

REM Verify build output
if not exist "dist" (
    echo [ERROR] Build output directory 'dist' not found!
    pause
    exit /b 1
)
echo [OK] Build output verified
echo.

cd ..\..
echo.

REM ========================================
REM Start Production Services
REM ========================================

echo ========================================
echo   Starting Production Services
echo ========================================
echo.

REM Start Backend in new window (production mode)
echo Starting backend server on port %BACKEND_PORT%...
echo [DEBUG] Testing backend command first...

REM Test backend command before starting
cd %BACKEND_DIR%
call venv\Scripts\activate.bat >nul 2>&1
python -c "from app.main import app" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend validation failed!
    echo The backend cannot start. Check the following:
    echo 1. Virtual environment is properly set up
    echo 2. All dependencies are installed
    echo 3. Database is accessible
    echo 4. No import errors in the application
    echo.
    echo Run this command manually to see the error:
    echo cd %BACKEND_DIR% && call venv\Scripts\activate.bat && python -c "from app.main import app"
    echo.
    pause
    exit /b 1
)
cd ..\..

echo [DEBUG] Backend validation passed, starting service...
start "Nursery Backend (Prod)" cmd /k "cd /d %BACKEND_DIR% && echo Starting backend server... && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT% 2>&1"
timeout /t 3 >nul
echo [OK] Backend started
echo     API: http://localhost:%BACKEND_PORT%
echo     Docs: http://localhost:%BACKEND_PORT%/docs
echo.

REM Start Frontend production server in new window
echo Starting frontend production server on port %FRONTEND_PORT%...
echo [DEBUG] Testing frontend command first...

cd %FRONTEND_DIR%
if not exist "dist" (
    echo [ERROR] Frontend build output not found!
    echo Run npm run build first.
    cd ..\..
    pause
    exit /b 1
)

REM Test if preview command works
call npm run preview --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm preview command failed!
    echo Check if npm is properly installed.
    cd ..\..
    pause
    exit /b 1
)

echo [DEBUG] Frontend validation passed, starting service...
start "Nursery Frontend (Prod)" cmd /k "cd %FRONTEND_DIR% && echo Starting frontend server... && npm run preview -- --port %FRONTEND_PORT% --host 127.0.0.1 2>&1 && echo Frontend stopped. Press any key to exit. && pause >nul"
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
echo   Production System Ready! [SUCCESS]
echo ========================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Nursery Management System - PRODUCTION
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
echo   Backend:  logs\backend-prod.log
echo   Frontend: logs\frontend-prod.log
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo [INFO] Production services are running in minimized windows
echo [INFO] To stop services, close the "Nursery Backend (Prod)" and "Nursery Frontend (Prod)" windows
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