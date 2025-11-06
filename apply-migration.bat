@echo off
echo Applying branch_id migration...
echo.

set DB_PATH=nursery-system\backend\storage\nursery.db
set MIGRATION_PATH=nursery-system\backend\migrations\004_add_branch_id_to_users.sql

if not exist "%DB_PATH%" (
    echo Error: Database not found at %DB_PATH%
    exit /b 1
)

if not exist "%MIGRATION_PATH%" (
    echo Error: Migration file not found at %MIGRATION_PATH%
    exit /b 1
)

echo Applying migration...
type "%MIGRATION_PATH%" | sqlite3 "%DB_PATH%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [32mMigration applied successfully![0m
    echo.
    echo Verifying...
    sqlite3 "%DB_PATH%" "PRAGMA table_info(users);" | findstr "branch_id"
    if %ERRORLEVEL% EQU 0 (
        echo [32mbranch_id column exists[0m
    ) else (
        echo [31mbranch_id column not found[0m
    )
) else (
    echo [31mMigration failed[0m
    exit /b 1
)

echo.
echo Done!
