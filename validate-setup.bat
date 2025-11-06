@echo off
REM Quick validation script for run-prod.bat components
REM Tests tools and basic setup without full build

echo ========================================
echo   Quick Validation Test
echo ========================================
echo.

REM Test Python
echo Testing Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found
) else (
    echo ✅ Python OK
)

REM Test Node.js
echo Testing Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
) else (
    echo ✅ Node.js OK
)

REM Test npm
echo Testing npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found
) else (
    echo ✅ npm OK
)

REM Test directories
echo Testing directories...
if not exist "nursery-system\backend" (
    echo ❌ Backend directory missing
) else (
    echo ✅ Backend directory OK
)

if not exist "nursery-system\frontend" (
    echo ❌ Frontend directory missing
) else (
    echo ✅ Frontend directory OK
)

REM Test backend virtual environment
echo Testing backend virtual environment...
if not exist "nursery-system\backend\venv\Scripts\activate.bat" (
    echo ❌ Backend virtual environment missing
) else (
    echo ✅ Backend virtual environment OK
)

REM Test backend imports
echo Testing backend imports...
cd nursery-system\backend
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat >nul 2>&1
    python -c "from app.main import app" >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Backend imports failed
    ) else (
        echo ✅ Backend imports OK
    )
) else (
    echo ⚠️ Skipping backend import test (no venv)
)
cd ..\..

REM Test frontend package.json
echo Testing frontend package.json...
if not exist "nursery-system\frontend\package.json" (
    echo ❌ Frontend package.json missing
) else (
    echo ✅ Frontend package.json OK
)

echo.
echo ========================================
echo   Validation Complete
echo ========================================
echo.
echo If all checks show ✅, the system is ready for run-prod.bat
echo If any show ❌, run run-all.bat first to set up the environment
echo.
pause