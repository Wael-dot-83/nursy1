@echo off
REM Debug version of run-prod.bat to identify startup issues
REM This script will keep windows open to show errors

echo ========================================
echo   Production Debug Mode
echo ========================================
echo.

REM Configuration
set BACKEND_PORT=8002
set FRONTEND_PORT=5174
set BACKEND_DIR=nursery-system\backend
set FRONTEND_DIR=nursery-system\frontend

REM ========================================
REM Step 1: Test Backend Startup Manually
REM ========================================

echo Step 1: Testing Backend Startup
echo ================================
cd %BACKEND_DIR%

echo Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

echo Testing backend import...
python -c "from app.main import app; print('Backend import successful')"
if %errorlevel% neq 0 (
    echo [ERROR] Backend import failed
    echo Check the error message above
    pause
    exit /b 1
)

echo Testing uvicorn startup (will run for 5 seconds)...
timeout /t 2 >nul
start "Backend Test" cmd /k "cd %BACKEND_DIR% && call venv\Scripts\activate.bat && echo Starting uvicorn... && uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT% --workers 1"
echo.
echo [INFO] Backend test window opened. Check if it starts successfully.
echo [INFO] Close the test window when done checking.
echo.
pause

REM ========================================
REM Step 2: Test Frontend Build
REM ========================================

echo Step 2: Testing Frontend Build
echo ===============================
cd ..\..
cd %FRONTEND_DIR%

echo Testing npm install...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

echo Testing build...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

if not exist "dist" (
    echo [ERROR] dist directory not created
    pause
    exit /b 1
)

echo Testing preview server (will run for 10 seconds)...
start "Frontend Test" cmd /k "cd %FRONTEND_DIR% && echo Starting preview server... && npm run preview -- --port %FRONTEND_PORT% --host 127.0.0.1"
echo.
echo [INFO] Frontend test window opened. Check if it starts successfully.
echo [INFO] Close the test window when done checking.
echo.
pause

REM ========================================
REM Step 3: Full Production Run
REM ========================================

echo Step 3: Full Production Run
echo ===========================
cd ..\..

echo Starting full production environment...
echo.

REM Start Backend
echo Starting backend...
start "Nursery Backend (Prod)" cmd /k "cd %BACKEND_DIR% && call venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT% --workers 1"

REM Start Frontend
echo Starting frontend...
start "Nursery Frontend (Prod)" cmd /k "cd %FRONTEND_DIR% && npm run preview -- --port %FRONTEND_PORT% --host 127.0.0.1"

echo.
echo ========================================
echo   Debug Complete
echo ========================================
echo.
echo Services should now be running in separate windows.
echo Check each window for any error messages.
echo.
echo If services start successfully, you can use the regular run-prod.bat
echo If they fail, the error messages will be visible in the windows.
echo.
pause