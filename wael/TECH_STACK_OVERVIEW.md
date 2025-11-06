# Project Technology Stack & Tooling

## High-Level Architecture
- **Backend API** (`nursery-system/backend/app`): FastAPI application that exposes REST endpoints for authentication, user management, nursery operations, attendance, reports, notifications, and supporting services.
- **Frontend SPA** (`nursery-system/frontend`): React + Vite single-page application that delivers role-specific dashboards (Admin, Manager, Supervisor, Parent) with Tailwind CSS styling and React Query data fetching.
- **Operations Utilities**: Batch scripts (`run-all.bat`, `run-prod.bat`, `debug-prod.bat`) and Docker assets orchestrate local/production environments, nginx reverse proxying, and continuous deployment.

## Backend (Python 3.11 / FastAPI)
- **Core Framework**: FastAPI (`fastapi`, `uvicorn[standard]`) for async REST APIs.
- **Configuration**: `pydantic-settings` and `.env` files handle environment-driven configuration. Global settings live in `app/config.py` and `app/settings.py`.
- **Database & ORM**: SQLAlchemy 2.0, MySQL connector (`mysql-connector-python`). Declarative models defined in `app/models.py`; session management in `app/database.py`.
- **Auth & Security**:
  - `python-jose[cryptography]`, `passlib[bcrypt]`, and `bcrypt` for JWT issuance and password hashing (`app/auth_service.py`, `app/security.py`).
  - Rate limiting and request tracking via custom middleware (`app/middleware/rate_limiter.py`, `app/middleware/request_id.py`) powered by `slowapi`.
- **API Layer**:
  - Routers for domain areas: `admin_router.py`, `manager_router.py`, `supervisor_router.py`, `parent_router.py`, `attendance_router.py`, `reports_router.py`, `nursery_router.py`, `settings_router.py`, `file_router.py`, `notification_router.py`, `password_reset_router.py`, `auth_router.py`, `user_router.py`, `backup_router.py`, `audit_router.py`.
  - Shared dependencies (`app/dependencies.py`), exception handling (`app/exceptions.py`, `app/errors.py`), validators (`app/validators.py`), and sanitization helpers (`app/sanitization.py`).
- **Domain Services & Utilities**: `app/services/query_optimizer.py`, `app/nursery_service.py`, `app/sms_service.py`, `app/audit_helper.py`.
- **Testing**: `pytest`, `pytest-asyncio`, `pytest-cov`, and `faker` for unit/integration tests (see `nursery-system/backend/tests` if present; fixtures consumed by routers and services).

## Frontend (React 18 / Vite)
- **Framework**: React 18 with functional components and hooks. Routing handled via `react-router-dom` (routes declared under `src/routes`).
- **State/Data**: `@tanstack/react-query` for server state, local contexts in `src/contexts`, and custom hooks in `src/hooks`.
- **Styling**: Tailwind CSS (`tailwind.config.js`, `postcss.config.js`) with utility-first classes; component primitives live under `src/components/ui`.
- **Visualization & UX**:
  - `chart.js` + `react-chartjs-2` for dashboards.
  - `@headlessui/react`, `@heroicons/react`, and `react-hot-toast` for accessibility, icons, and notifications.
  - `dompurify` to sanitize rich text.
- **HTTP Client**: `axios` wrapper inside `src/lib/apiClient.js`.
- **Testing & Quality**: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, and `jsdom`. Linting/formatting handled by ESLint (`.eslintrc.json`) and Prettier (`.prettierrc`).
- **Build/Deploy**: Vite config (`vite.config.js`), multi-stage Dockerfile (`frontend/Dockerfile`), and Vercel adapter (`vercel.json`). Production artifacts hosted behind nginx (`frontend/nginx.conf`).

## Cross-Cutting Tools & Infrastructure
- **Containerization**: Dockerfiles for backend (`nursery-system/backend/Dockerfile`) and frontend (`nursery-system/frontend/Dockerfile`), plus `docker-compose.yml` variants for orchestration (`nursery-system/docker-compose.yml`, root `docker-compose.production.yml`).
- **Automation Scripts**: `.bat`/`.sh` runners for setup, deploy, and cleanup (`run-all.bat`, `cleanup.bat`, `nursery-system/quick-start.sh`, etc.).
- **Logging & Auditing**: `app/logging_config.py`, `app/audit_helper.py`, and persistent audit trail models (`app/models.AuditLog`).
- **Storage**: Static/media managed through `storage/` directories referenced by file and backup routers.
- **Secrets Handling**: `.env`/`.env.example` blueprints for environment variables across services.

## Module Map (Key Directories)
| Layer | Directory | Notes |
| --- | --- | --- |
| API Entry | `nursery-system/backend/app/main.py` | FastAPI app creation, router registration, middleware. |
| Data Models | `nursery-system/backend/app/models.py` | SQLAlchemy declarative models for users, nurseries, branches, classrooms, children, attendance, reports, files, tokens, notifications, audits. |
| Schemas | `nursery-system/backend/app/schemas.py` | Pydantic response/request models, validation rules. |
| Middleware | `nursery-system/backend/app/middleware/` | Rate limiting, request ID injection. |
| Services | `nursery-system/backend/app/services/` | Query optimization helpers, domain services. |
| Front Pages | `nursery-system/frontend/src/pages/` | Role-specific dashboards (`admin`, `manager`, `supervisor`, `parent`) plus settings/auth/profile flows. |
| Shared UI | `nursery-system/frontend/src/components/ui/` | Button, Card, Input, Dialog, Stat widgets reused throughout the SPA. |
| Routing | `nursery-system/frontend/src/routes/` | Route guards and layout-aware routing definitions. |
| Contexts | `nursery-system/frontend/src/contexts/` | Authentication, layout, and theme providers. |

## Dependency Reference
- **Backend Requirements** (`nursery-system/backend/requirements.txt`): FastAPI, SQLAlchemy, MySQL connector, Passlib/Bcrypt, Python-JOSE, SlowAPI, HTTPX/Requests, AIOHTTP, Email validator, Multipart & Slugify utilities, pytest stack.
- **Frontend Dependencies** (`nursery-system/frontend/package.json`):
  - Runtime: React, React DOM, React Router DOM, React Query, Axios, Chart.js, React Chart.js 2, Heroicons, Headless UI, Tailwind plugins, CLSX, Day.js, DOMPurify, React Hot Toast.
  - Dev/Test: Vite, Vitest, Testing Library suite, ESLint config, Tailwind/PostCSS toolchain, TypeScript types, JSDOM.
