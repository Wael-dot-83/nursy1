@echo off
REM =============================================================================
REM Nursery Management System - Windows Batch Commands
REM Alternative to Makefile for Windows environments
REM =============================================================================

setlocal enabledelayedexpansion

if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="build" goto :build
if "%1"=="build-quick" goto :build-quick
if "%1"=="up" goto :up
if "%1"=="down" goto :down
if "%1"=="restart" goto :restart
if "%1"=="logs" goto :logs
if "%1"=="logs-backend" goto :logs-backend
if "%1"=="logs-frontend" goto :logs-frontend
if "%1"=="ps" goto :ps
if "%1"=="migrate" goto :migrate
if "%1"=="seed" goto :seed
if "%1"=="db-shell" goto :db-shell
if "%1"=="db-reset" goto :db-reset
if "%1"=="test" goto :test
if "%1"=="test-cov" goto :test-cov
if "%1"=="e2e" goto :e2e
if "%1"=="e2e-install" goto :e2e-install
if "%1"=="smoke" goto :smoke
if "%1"=="backend-shell" goto :backend-shell
if "%1"=="frontend-shell" goto :frontend-shell
if "%1"=="clean" goto :clean
if "%1"=="nuke" goto :nuke
if "%1"=="health" goto :health
if "%1"=="dev-setup" goto :dev-setup
if "%1"=="admin-update" goto :admin-update

echo [91mERROR: Unknown command "%1"[0m
echo.
goto :help

REM =============================================================================
REM HELP
REM =============================================================================
:help
echo [94m╔═══════════════════════════════════════════════════════════════════════╗[0m
echo [94m║       Nursery Management System - Docker Commands (Windows)          ║[0m
echo [94m╚═══════════════════════════════════════════════════════════════════════╝[0m
echo.
echo [92mUsage:[0m
echo   nursy.bat [36m^<command^>[0m
echo.
echo [94m══ General ══[0m
echo   [36mhelp[0m                Display this help message
echo   [36mdev-setup[0m           First-time setup for development
echo.
echo [94m══ Docker Operations ══[0m
echo   [36mbuild[0m               Build all Docker images (no cache)
echo   [36mbuild-quick[0m         Build Docker images (with cache)
echo   [36mup[0m                  Start all services
echo   [36mdown[0m                Stop all services
echo   [36mrestart[0m             Restart all services
echo   [36mlogs[0m                Follow logs for all services
echo   [36mlogs-backend[0m        Follow backend logs only
echo   [36mlogs-frontend[0m       Follow frontend logs only
echo   [36mps[0m                  Show running containers
echo.
echo [94m══ Database Operations ══[0m
echo   [36mmigrate[0m             Run database migrations
echo   [36mseed[0m                Run database seeds (idempotent)
echo   [36mdb-shell[0m            Open PostgreSQL shell
echo   [36mdb-reset[0m            Reset database (DANGER: deletes all data)
echo.
echo [94m══ Testing ══[0m
echo   [36mtest[0m                Run backend unit tests
echo   [36mtest-cov[0m            Run tests with coverage report
echo   [36me2e-install[0m         Install Playwright for E2E tests
echo   [36me2e[0m                 Run end-to-end tests with Playwright
echo   [36msmoke[0m               Run smoke tests (quick API health checks)
echo.
echo [94m══ Shell Access ══[0m
echo   [36mbackend-shell[0m       Open shell in backend container
echo   [36mfrontend-shell[0m      Open shell in frontend container
echo.
echo [94m══ Cleanup ══[0m
echo   [36mclean[0m               Stop services and remove containers
echo   [36mnuke[0m                DANGER: Remove volumes (deletes all data)
echo.
echo [94m══ Utilities ══[0m
echo   [36mhealth[0m              Check health of all services
echo   [36madmin-update[0m        Update admin user email to standard domain
echo.
goto :eof

REM =============================================================================
REM DOCKER OPERATIONS
REM =============================================================================
:build
echo [94mBuilding Docker images (no cache)...[0m
docker compose build --no-cache
if errorlevel 1 (
    echo [91m✗ Build failed[0m
    exit /b 1
)
echo [92m✓ Build complete[0m
goto :eof

:build-quick
echo [94mBuilding Docker images (with cache)...[0m
docker compose build
if errorlevel 1 (
    echo [91m✗ Build failed[0m
    exit /b 1
)
echo [92m✓ Build complete[0m
goto :eof

:up
echo [92mStarting all services...[0m
docker compose up -d
if errorlevel 1 (
    echo [91m✗ Failed to start services[0m
    exit /b 1
)
echo [92m✓ Services started[0m
echo.
echo Frontend:  http://localhost:4173
echo Backend:   http://localhost:8000
echo Adminer:   http://localhost:8080
echo.
call :health
goto :eof

:down
echo [93mStopping all services...[0m
docker compose down
if errorlevel 1 (
    echo [91m✗ Failed to stop services[0m
    exit /b 1
)
echo [92m✓ Services stopped[0m
goto :eof

:restart
call :down
timeout /t 2 /nobreak >nul
call :up
goto :eof

:logs
echo [94mFollowing logs for all services (Ctrl+C to exit)...[0m
docker compose logs -f
goto :eof

:logs-backend
echo [94mFollowing backend logs (Ctrl+C to exit)...[0m
docker compose logs -f backend
goto :eof

:logs-frontend
echo [94mFollowing frontend logs (Ctrl+C to exit)...[0m
docker compose logs -f frontend
goto :eof

:ps
docker compose ps
goto :eof

REM =============================================================================
REM DATABASE OPERATIONS
REM =============================================================================
:migrate
echo [94mRunning database migrations...[0m
docker compose exec backend python -c "from app.database import init_db; init_db(); print('✓ Migrations complete')"
if errorlevel 1 (
    echo [91m✗ Migration failed[0m
    exit /b 1
)
echo [92m✓ Migrations complete[0m
goto :eof

:seed
echo [94mSeeding database...[0m
docker compose exec backend python -c "from app.seed import seed_database; seed_database()"
if errorlevel 1 (
    echo [91m✗ Seed failed[0m
    exit /b 1
)
echo [92m✓ Database seeded[0m
goto :eof

:db-shell
echo [94mOpening database shell...[0m
docker compose exec db psql -U nursery_user -d nursery_db
goto :eof

:db-reset
echo [91m⚠️  WARNING: This will delete ALL data![0m
set /p confirm="Are you sure? [y/N]: "
if /i not "%confirm%"=="y" (
    echo [92mCancelled[0m
    goto :eof
)
echo [91mDropping database...[0m
docker compose down -v
timeout /t 2 /nobreak >nul
echo [94mStarting database...[0m
docker compose up -d db
timeout /t 5 /nobreak >nul
docker compose up -d backend
timeout /t 10 /nobreak >nul
call :migrate
call :seed
echo [92m✓ Database reset complete[0m
goto :eof

REM =============================================================================
REM TESTING
REM =============================================================================
:test
echo [94mRunning backend tests...[0m
docker compose exec backend pytest tests/ -v
goto :eof

:test-cov
echo [94mRunning tests with coverage...[0m
docker compose exec backend pytest --cov=app --cov-report=html --cov-report=term-missing tests/
echo.
echo [92mCoverage report generated:[0m
echo   nursery-system\backend\htmlcov\index.html
goto :eof

:e2e-install
echo [94mInstalling Playwright for E2E tests...[0m
if not exist "e2e\node_modules" (
    echo [94mInstalling npm dependencies...[0m
    cd e2e
    call npm install
    if errorlevel 1 (
        echo [91m✗ npm install failed[0m
        cd ..
        exit /b 1
    )
    echo [94mInstalling Playwright browsers...[0m
    call npx playwright install --with-deps
    if errorlevel 1 (
        echo [91m✗ Playwright install failed[0m
        cd ..
        exit /b 1
    )
    cd ..
    echo [92m✓ Playwright installed successfully[0m
) else (
    echo [93m✓ Playwright already installed[0m
    echo [94mUpdating browsers...[0m
    cd e2e
    call npx playwright install
    cd ..
)
goto :eof

:e2e
if not exist "e2e\node_modules" (
    echo [93m⚠️  Playwright not installed yet[0m
    echo [94mRun: nursy.bat e2e-install[0m
    goto :eof
)
echo [94mRunning E2E tests...[0m
cd e2e
call npx playwright test
set exitcode=!errorlevel!
cd ..
if !exitcode! neq 0 (
    echo [91m✗ E2E tests failed[0m
    echo [94mTo view report: cd e2e ^&^& npx playwright show-report[0m
    exit /b !exitcode!
)
echo [92m✓ E2E tests passed[0m
goto :eof

:smoke
echo [94mRunning smoke tests...[0m
echo.
echo [94mChecking Backend Health...[0m
curl -s http://localhost:8000/health
if errorlevel 1 (
    echo [91m✗ Backend not responding[0m
) else (
    echo [92m✓ Backend healthy[0m
)
echo.
echo [94mChecking Frontend...[0m
curl -s -o nul -w "%%{http_code}" http://localhost:4173
if errorlevel 1 (
    echo [91m✗ Frontend not responding[0m
) else (
    echo [92m✓ Frontend accessible[0m
)
echo.
echo [94mChecking Database...[0m
docker compose exec db pg_isready -U nursery_user -d nursery_db >nul 2>&1
if errorlevel 1 (
    echo [91m✗ Database not ready[0m
) else (
    echo [92m✓ Database ready[0m
)
echo.
goto :eof

REM =============================================================================
REM SHELL ACCESS
REM =============================================================================
:backend-shell
echo [94mOpening backend shell...[0m
docker compose exec backend /bin/bash
goto :eof

:frontend-shell
echo [94mOpening frontend shell...[0m
docker compose exec frontend /bin/sh
goto :eof

REM =============================================================================
REM CLEANUP
REM =============================================================================
:clean
echo [93mCleaning up containers...[0m
docker compose down --remove-orphans
if errorlevel 1 (
    echo [91m✗ Cleanup failed[0m
    exit /b 1
)
echo [92m✓ Cleanup complete[0m
goto :eof

:nuke
echo [91m⚠️  WARNING: This will delete ALL data including volumes![0m
set /p confirm="Are you sure? [y/N]: "
if /i not "%confirm%"=="y" (
    echo [92mCancelled[0m
    goto :eof
)
docker compose down -v --remove-orphans
docker volume prune -f
echo [92m✓ Nuclear cleanup complete[0m
goto :eof

REM =============================================================================
REM UTILITIES
REM =============================================================================
:health
echo [94mChecking service health...[0m
echo.
echo [36mBackend:[0m
curl -s http://localhost:8000/health 2>nul || echo [91m✗ Backend not responding[0m
echo.
echo [36mFrontend:[0m
curl -s -o nul -w "Status: %%{http_code}" http://localhost:4173 2>nul || echo [91m✗ Frontend not responding[0m
echo.
echo.
echo [36mDatabase:[0m
docker compose exec db pg_isready -U nursery_user -d nursery_db 2>nul
if errorlevel 1 (
    echo [91m✗ Database not ready[0m
) else (
    echo [92m✓ Database ready[0m
)
echo.
goto :eof

:dev-setup
echo [94m═══════════════════════════════════════[0m
echo [94m Nursery System - Development Setup[0m
echo [94m═══════════════════════════════════════[0m
echo.
if not exist ".env" (
    echo [93mCreating .env from .env.example...[0m
    copy .env.example .env >nul
    echo [92m✓ Environment file ready[0m
) else (
    echo [92m✓ Environment file exists[0m
)
echo.
call :build
echo.
call :up
echo.
echo [92m═══════════════════════════════════════[0m
echo [92m Setup Complete![0m
echo [92m═══════════════════════════════════════[0m
echo.
echo [94mQuick Start:[0m
echo   Frontend:  http://localhost:4173
echo   Backend:   http://localhost:8000
echo   Adminer:   http://localhost:8080
echo.
echo [94mDefault Admin Credentials:[0m
echo   Email:     admin@example.com
echo   Password:  Admin123!
echo.
echo [94mNext Steps:[0m
echo   nursy.bat logs       - View logs
echo   nursy.bat smoke      - Run smoke tests
echo   nursy.bat test       - Run tests
echo   nursy.bat e2e-install - Install E2E tests
echo.
goto :eof

:admin-update
echo [94mUpdating admin user email...[0m
docker compose exec backend python -c "from app.database import SessionLocal; from app.models import User; db = SessionLocal(); admin = db.query(User).filter(User.email == 'admin@nursery.local').first(); admin.email = 'admin@example.com' if admin else None; db.commit(); print('✓ Admin email updated to admin@example.com' if admin else '✗ Admin user not found')"
if errorlevel 1 (
    echo [91m✗ Update failed[0m
    exit /b 1
)
echo [92m✓ Admin email updated[0m
goto :eof

REM =============================================================================
:eof
endlocal
