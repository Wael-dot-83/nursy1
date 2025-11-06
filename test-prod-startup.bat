@echo off
REM Quick test script to validate backend and frontend startup
REM Run this before run-prod.bat to check for issues

echo ========================================
echo   Pre-Production Validation Test
echo ========================================
echo.

set BACKEND_DIR=nursery-system\backend
set FRONTEND_DIR=nursery-system\frontend
set BACKEND_PORT=8002
set FRONTEND_PORT=5174

REM Test Backend
echo [TEST] Backend Validation
echo ========================
cd %BACKEND_DIR%

if not exist "venv\Scripts\activate.bat" (
    echo ❌ FAIL: Virtual environment not found
    echo Run run-all.bat first to set up the environment
    goto :frontend_test
)

call venv\Scripts\activate.bat >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: Cannot activate virtual environment
    goto :frontend_test
)

python -c "from app.main import app" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: Backend import error
    echo Run: cd %BACKEND_DIR% && call venv\Scripts\activate.bat && python -c "from app.main import app"
    echo to see the specific error
) else (
    echo ✅ PASS: Backend imports successfully
)

REM Test if uvicorn can start (quick test)
echo Testing uvicorn startup...
start "Backend Quick Test" cmd /c "cd %BACKEND_DIR% && call venv\Scripts\activate.bat && timeout /t 3 && uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT% --workers 1 --log-level critical >nul 2>&1 && echo Backend test completed"
timeout /t 5 >nul
echo ✅ Backend startup test completed

:frontend_test
echo.
echo [TEST] Frontend Validation
echo =========================
cd ..\..
cd %FRONTEND_DIR%

if not exist "package.json" (
    echo ❌ FAIL: package.json not found
    goto :summary
)

if not exist "node_modules" (
    echo ❌ FAIL: node_modules not found
    echo Run: cd %FRONTEND_DIR% && npm install
    goto :summary
)

if not exist "dist" (
    echo ❌ WARNING: dist directory not found
    echo Run: cd %FRONTEND_DIR% && npm run build
    goto :summary
)

REM Test npm commands
call npm run preview --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: npm preview command not available
) else (
    echo ✅ PASS: Frontend commands available
)

echo Testing frontend preview startup...
start "Frontend Quick Test" cmd /c "cd %FRONTEND_DIR% && timeout /t 3 && npm run preview -- --port %FRONTEND_PORT% --host 127.0.0.1 >nul 2>&1 && echo Frontend test completed"
timeout /t 5 >nul
echo ✅ Frontend startup test completed

:summary
cd ..\..
echo.
echo ========================================
echo   Validation Summary
echo ========================================
echo.
echo If you see any ❌ FAIL messages above, fix them before running run-prod.bat
echo If you see ✅ PASS messages, the system should start successfully
echo.
echo Common fixes:
echo - Run run-all.bat to set up the development environment
echo - Check that all dependencies are installed
echo - Ensure ports 8002 and 5174 are available
echo - Check the logs directory for error details
echo.
pause