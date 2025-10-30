@echo off
REM Nursery Management System - Local Network Server
REM Run this script to start the application for all users on your network

echo ============================================================
echo   Nursery Management System - Local Network Server
echo ============================================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address" ^| findstr "192.168"') do (
    set LOCAL_IP=%%a
)
set LOCAL_IP=%LOCAL_IP:~1%

echo Your Local IP Address: %LOCAL_IP%
echo.
echo Users can access the application at:
echo    http://%LOCAL_IP%:5173
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

REM Check if backend is already running
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Backend is already running on port 8000
    echo.
) else (
    echo [INFO] Starting Backend Server...
    cd nursery-system\backend

    REM Copy local environment
    if exist .env.local (
        copy /Y .env.local .env >nul
        echo [OK] Backend configured for local network
    ) else (
        echo [WARNING] .env.local not found, using default .env
    )

    REM Start backend
    start "Nursery Backend (Local Network)" cmd /k "venv\Scripts\activate.bat && python -c "import secrets; import sys; sys.stdout.write('Starting backend on http://%LOCAL_IP%:8000\n')" && uvicorn app.main:app --host 0.0.0.0 --port 8000"
    cd ..\..
    echo [OK] Backend starting...
    echo.

    REM Wait for backend to start
    timeout /t 5 /nobreak >nul
)

REM Check if frontend is already running
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Frontend is already running on port 5173
    echo.
) else (
    echo [INFO] Starting Frontend Server...
    cd nursery-system\frontend

    REM Copy local environment
    if exist .env.local (
        copy /Y .env.local .env >nul
        echo [OK] Frontend configured for local network
    ) else (
        echo [WARNING] .env.local not found, using default .env
    )

    REM Start frontend
    start "Nursery Frontend (Local Network)" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"
    cd ..\..
    echo [OK] Frontend starting...
    echo.
)

REM Wait for services to fully start
timeout /t 5 /nobreak >nul

echo ============================================================
echo   APPLICATION IS NOW RUNNING!
echo ============================================================
echo.
echo Access from this computer:
echo    http://localhost:5173
echo    http://127.0.0.1:5173
echo.
echo Access from other devices on your network:
echo    http://%LOCAL_IP%:5173
echo.
echo Backend API:
echo    http://%LOCAL_IP%:8000
echo    http://%LOCAL_IP%:8000/docs
echo.
echo Default Login:
echo    Email: admin@nursery.com
echo    Password: Admin123!
echo.
echo Two windows have opened for backend and frontend.
echo DO NOT CLOSE those windows - they keep the server running.
echo.
echo To stop the server:
echo    1. Close the backend window
echo    2. Close the frontend window
echo    3. Or press Ctrl+C in each window
echo.
echo ============================================================
echo.

REM Check firewall status
echo [INFO] Checking Windows Firewall...
netsh advfirewall show currentprofile state | findstr "ON" >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [!] IMPORTANT: Windows Firewall is ON
    echo.
    echo If other devices cannot access the application:
    echo 1. Run: configure-firewall.bat (as Administrator)
    echo 2. Or manually allow ports 8000 and 5173 in Windows Firewall
    echo.
)

echo Press any key to exit this window (servers will keep running)...
pause >nul
