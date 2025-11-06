@echo off
echo ========================================
echo Cleaning Nursery Management System
echo ========================================
echo.

echo [1/8] Removing Python cache files...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul
del /s /q *.pyc 2>nul
del /s /q *.pyo 2>nul

echo [2/8] Removing test coverage files...
if exist "nursery-system\backend\.coverage" del /q "nursery-system\backend\.coverage"
if exist "nursery-system\.coverage" del /q "nursery-system\.coverage"
if exist "nursery-system\backend\htmlcov" rd /s /q "nursery-system\backend\htmlcov"

echo [3/8] Removing old log files...
if exist "nursery-system\backend\logs\app.log.1" del /q "nursery-system\backend\logs\app.log.1"
if exist "nursery-system\backend\logs\app.log.2" del /q "nursery-system\backend\logs\app.log.2"
if exist "nursery-system\backend\logs\app.log.3" del /q "nursery-system\backend\logs\app.log.3"
if exist "nursery-system\backend\logs\app.log.4" del /q "nursery-system\backend\logs\app.log.4"
if exist "nursery-system\backend\logs\app.log.5" del /q "nursery-system\backend\logs\app.log.5"

echo [4/8] Removing duplicate database files...
if exist "nursery-system\backend\nursery_db.sqlite" del /q "nursery-system\backend\nursery_db.sqlite"
if exist "nursery-system\backend\test_app.db" del /q "nursery-system\backend\test_app.db"

echo [5/8] Removing nul files...
del /s /q nul 2>nul

echo [6/8] Removing temporary Word files...
del /q "~$*.docx" 2>nul

echo [7/8] Removing .vite cache...
if exist "nursery-system\frontend\.vite" rd /s /q "nursery-system\frontend\.vite"

echo [8/8] Removing build artifacts...
if exist "nursery-system\frontend\dist" rd /s /q "nursery-system\frontend\dist"

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Removed:
echo - Python cache files (__pycache__, *.pyc)
echo - Test coverage reports
echo - Old log files
echo - Duplicate database files
echo - Temporary files
echo - Frontend cache and build artifacts
echo.
pause
