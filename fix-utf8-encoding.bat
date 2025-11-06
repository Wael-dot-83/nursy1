@echo off
chcp 65001 >nul
echo ========================================
echo   UTF-8 Encoding Fix Script
echo ========================================
echo.

echo [1/4] Setting console to UTF-8...
chcp 65001

echo.
echo [2/4] Backing up database...
cd nursery-system\backend
if exist storage\nursery.db (
    copy storage\nursery.db storage\nursery.db.backup >nul
    echo Database backed up to nursery.db.backup
)

echo.
echo [3/4] Recreating database with UTF-8...
del storage\nursery.db 2>nul
python seed_db.py

echo.
echo [4/4] Verifying UTF-8 encoding...
python -c "import sqlite3; conn = sqlite3.connect('storage/nursery.db'); cursor = conn.cursor(); cursor.execute('PRAGMA encoding'); print('Database encoding:', cursor.fetchone()[0]); conn.close()"

echo.
echo ========================================
echo   UTF-8 Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart backend: python run.py
echo 2. Restart frontend: npm run dev
echo 3. Clear browser cache (Ctrl+Shift+Delete)
echo 4. Test Arabic text at http://localhost:4173/admin/nurseries
echo.
pause
