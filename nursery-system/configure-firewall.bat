@echo off
REM Configure Windows Firewall for Local Network Access
REM Run this as Administrator

echo ============================================================
echo   Configure Windows Firewall
echo ============================================================
echo.
echo This script will add firewall rules to allow network access
echo to the Nursery Management System.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] Adding firewall rules...
echo.

REM Remove existing rules (if any)
netsh advfirewall firewall delete rule name="Nursery System - Backend" >nul 2>&1
netsh advfirewall firewall delete rule name="Nursery System - Frontend" >nul 2>&1

REM Add new rules
netsh advfirewall firewall add rule name="Nursery System - Backend" dir=in action=allow protocol=TCP localport=8000 profile=private,domain
if %errorLevel% equ 0 (
    echo [OK] Backend port 8000 allowed
) else (
    echo [ERROR] Failed to add backend rule
)

netsh advfirewall firewall add rule name="Nursery System - Frontend" dir=in action=allow protocol=TCP localport=5173 profile=private,domain
if %errorLevel% equ 0 (
    echo [OK] Frontend port 5173 allowed
) else (
    echo [ERROR] Failed to add frontend rule
)

echo.
echo ============================================================
echo   Firewall Configuration Complete!
echo ============================================================
echo.
echo The following ports are now accessible on your local network:
echo    - Port 8000: Backend API
echo    - Port 5173: Frontend Application
echo.
echo You can now run: start-local-server.bat
echo.
echo To remove these rules later, run:
echo    netsh advfirewall firewall delete rule name="Nursery System - Backend"
echo    netsh advfirewall firewall delete rule name="Nursery System - Frontend"
echo.
pause
