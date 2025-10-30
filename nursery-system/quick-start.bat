@echo off
REM Nursery Management System - Quick Start Script for Windows
REM This script sets up and runs the system in development mode

echo ==========================================
echo Nursery Management System - Quick Start
echo ==========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Python not found. Please install Python 3.11 or higher.
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Node.js not found. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

echo [OK] Prerequisites check passed
echo.

REM Backend setup
echo Setting up backend...

cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo [WARNING] Please edit backend\.env with your configuration
)

REM Initialize database
if not exist "nursery.db" (
    echo Initializing database...
    python seed_db.py
)

echo [OK] Backend setup complete
echo.

REM Frontend setup
echo Setting up frontend...

cd ..\frontend

REM Install dependencies
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install --silent
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo VITE_API_URL=http://localhost:8000 > .env
)

echo [OK] Frontend setup complete
echo.

REM Start services
echo Starting services...
echo.

REM Start backend in new window
echo Starting backend server...
cd ..\backend
start "Nursery Backend" cmd /k "venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo [OK] Backend running on http://localhost:8000
echo     API Docs: http://localhost:8000/docs
echo.

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting frontend development server...
cd ..\frontend
start "Nursery Frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"
echo [OK] Frontend running on http://localhost:5173
echo.

REM Display info
echo ==========================================
echo     System is now running!
echo ==========================================
echo.
echo Access the application:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Default credentials:
echo    Email: admin@nursery.com
echo    Password: Admin123!
echo.
echo Two new command windows have opened for backend and frontend.
echo Close those windows to stop the services.
echo.
echo Press any key to exit this window...
pause >nul
