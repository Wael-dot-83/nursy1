# Admin Role Workflow Reference

## Purpose
Administrators oversee the entire nursery network: onboarding nurseries, provisioning user accounts, auditing activity, configuring settings, and monitoring health metrics.

## Frontend Entry Points
- `nursery-system/frontend/src/pages/admin/AdminDashboard.jsx`: analytics overview, KPI cards, charts, recent logins feed.
- `nursery-system/frontend/src/pages/admin/NurseryManagement.jsx`: CRUD for nurseries, branches, and classrooms.
- `nursery-system/frontend/src/pages/admin/UserManagement.jsx`: invite/manage admin, manager, supervisor, and parent accounts.
- `nursery-system/frontend/src/pages/admin/AuditLogs.jsx`: filterable audit history.
- `nursery-system/frontend/src/pages/admin/Reports.jsx`: global report review and export tools.
- `nursery-system/frontend/src/pages/admin/NotificationCenter.jsx`: administrative notifications (drafted for future integration).
- `nursery-system/frontend/src/pages/admin/Settings.jsx`: system-wide configuration (rate limits, password policies, SMS provider).

## Primary Inputs
- Nursery onboarding forms: name, address components, contact info, capacity, age range, notes.
- Branch/classroom creation dialogs: branch metadata, classroom capacity, assignment to nursery.
- User invitation modal: first/last name, email (optional), role, phone, nursery assignment, activation toggle.
- Settings forms: password policy thresholds, session lifetimes, notification templates, rate limit thresholds.
- Report moderation controls: approval status, feedback notes.

## Outputs & Visualisations
- Dashboard metrics: total nurseries/users/children, active nurseries, pending reports, age distribution.
- Geographical breakdown of nurseries by governorate; recent login list.
- Exportable CSV/JSON datasets for nurseries, branches, users, reports.
- Success/error toasts, temporary credentials display (with reveal/hide UX for generated passwords).

## Backend Endpoints & Logic
- `GET /system/analytics` and `GET /system/system-health` (`nursery-system/backend/app/admin_router.py`): aggregate KPIs and health checks.
- `GET|POST|PUT|DELETE /admin/nurseries` plus nested `/branches` and `/classrooms` (`nursery-system/backend/app/nursery_router.py`): nursery lifecycle management with audit logging.
- `GET|POST|PUT|DELETE /admin/users/` (`nursery-system/backend/app/user_router.py`): role-based user provisioning, activation/deactivation, temp password issuance.
- `GET /audit-logs/` (`nursery-system/backend/app/audit_router.py`): queryable audit entries with filtering.
- `GET|PUT /admin/settings/…` (`nursery-system/backend/app/settings_router.py`): configurable operational parameters.
- `GET /reports/` (`nursery-system/backend/app/reports_router.py`): cross-role report moderation and exports.
- `POST /admin/backup/run` & `GET /admin/backup/history` (`nursery-system/backend/app/backup_router.py`): data backup orchestration.
- Shared dependencies enforce JWT auth, role checks, and rate limits via `app/dependencies.py` and `app/middleware`.

## Database Touchpoints
- `users`: admin user accounts with hashed credentials (`models.User`).
- `nurseries`, `branches`, `classrooms`: hierarchical nursery structure (`models.Nursery`, `models.Branch`, `models.Classroom`).
- `children`, `attendance`, `daily_reports`: read-only analytics access, occasional admin edits.
- `audit_logs`: immutable audit trail for CRUD operations.
- `notifications`, `file_assets`, `refresh_tokens`, `password_reset_*`: auxiliary subsystems surfaced through admin monitoring.

## End-to-End Workflow
1. Admin authenticates (`/auth/login`) and lands on the dashboard (`/admin/dashboard` route).
2. Reviews KPIs from `/system/analytics`; checks health via `/system/system-health`.
3. Uses Nursery Management to onboard locations: create nursery → add branches → define classrooms. Temporary credentials for generated managers are surfaced for distribution.
4. Invites or edits staff via User Management, leveraging `/admin/users/` endpoints. Temp passwords can be revealed/copied and status toggled.
5. Monitors daily reports and attendance anomalies, approving or requesting changes.
6. Audits sensitive actions through Audit Logs; downloads backups as needed; adjusts system settings to enforce policy.

## Screenshot Checklist
Capture the following SPA routes after running `npm run dev` (proxying to backend or using mock data):
1. `/admin/dashboard` — KPI cards + charts.
2. `/admin/nurseries` — nursery table with create/edit modal open.
3. `/admin/users` — user grid showing role filters and temp password modal.
4. `/admin/reports` — report moderation table with status badges.
5. `/admin/audit-logs` — audit timeline or table view.
