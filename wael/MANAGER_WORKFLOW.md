# Manager Role Workflow Reference

## Purpose
Nursery managers coordinate daily operations for their assigned nursery: onboarding parents/children, supervising staff, validating reports, and tracking attendance/performance metrics.

## Frontend Entry Points
- `nursery-system/frontend/src/pages/manager/ManagerDashboard.jsx`: nursery KPIs, attendance summaries, report status widgets.
- `nursery-system/frontend/src/pages/manager/ManagerChildren.jsx`: parent + child enrollment flows, class assignments, document management placeholders.
- `nursery-system/frontend/src/pages/manager/ManagerReports.jsx`: review pipeline for supervisor-submitted reports with approve/revise flows.
- `nursery-system/frontend/src/pages/manager/ManagerSupervisors.jsx`: CRUD interface for supervisor accounts and branch assignments.
- `nursery-system/frontend/src/pages/manager/ManagerAudit.jsx`: visibility into audit events scoped to the manager’s nursery.

## Primary Inputs
- Parent enrollment modal: full name (First name, Second , Last Name), email, phone, home/work addresses, emergency contact, notes.
- Child registration modal: full name (First name, Second Must Match with first Name from parent name , Last Name Must Match with last Name from parent name), DOB, national/passport IDs, nationality{ if select jordan then must entire National Id else passport number }, photo upload, , health/education notes, linked parent IDs.
- Supervisor management form: full name (first name, Second name , Last name ), email, phone, national/passport IDs, nationality{ if select jordan then must entire National Id else passport number }.
- Report moderation dialog: approval toggle, feedback reason, follow-up actions.
- Attendance filters: date ranges, classroom filters, status toggles.

## Outputs & Dashboards
- Daily/weekly attendance stats, ratio indicators, check-in/out timelines.
- Report pipeline counts (pending, approved, revision needed) with quick filters.
- Supervisor roster with status badges and branch assignments.
- Success/error toasts confirming onboarding or moderation actions.

## Backend Endpoints & Logic
- Manager-specific router functions in `nursery-system/backend/app/manager_router.py`:
  - `GET /manager/dashboard` — aggregated nursery KPIs.
  - `GET|PUT /manager/nursery` — update nursery profile owned by manager.
  - `GET /manager/children` and `POST /manager/children` — scoped child management.
  - `POST /manager/parents` — create parent accounts tied to the nursery.
  - `GET|POST|PUT|DELETE /manager/supervisors` — supervisor lifecycle control.
  - `GET /manager/reports` with `PUT /manager/reports/{id}/approve|revise|` — moderation workflow.
- Shared routers leveraged by manager dashboards:
  - `GET /children/my-nursery/` (`children_router.py`) for roster views.
  - `GET /attendance/my-nursery/` and `POST /attendance/check-in|check-out/{childId}` (`attendance_router.py`) for attendance operations.
  - `GET /reports/my-nursery/`, `GET /reports/stats/nursery`, `GET /reports/stats/children` (`reports_router.py`) for analytics.
- Role guard: `require_manager` dependency enforces access and injects nursery context.

## Database Touchpoints
- `children`, `attendance`, `daily_reports`: core operational datasets belonging to the manager’s nursery.
- `users` table for supervisor accounts (role = `manager`/`supervisor`) plus parent users created through manager flow.
- `nurseries`, `branches`, `classrooms`: restricted to the manager’s assigned nursery tree.
- `audit_logs`: records each manager CRUD action for compliance.

## End-to-End Workflow
1. Manager authenticates and loads `/manager/dashboard`; the SPA issues `GET /manager/dashboard` for metrics and `/reports/stats/...` for charts.
2. For new enrolments, opens Manager Children:
   - Creates parent with contact + emergency info (`POST /manager/parents`).
   - Registers child profile (`POST /manager/children`) and assigns to branch/class.
3. Coordinates supervisors via Manager Supervisors:
   - Lists current staff (`GET /manager/supervisors`).
   - Adds/edits supervisors with branch pairing; temporary credentials returned from backend.
4. Reviews daily reports (`GET /manager/reports`), approving or marking for revision using `PUT /manager/reports/{id}/approve` or `.../revise`.
5. Monitors attendance anomalies via `GET /attendance/my-nursery/` and triggers check-in/out actions if delegated.
6. Audits changes through Manager Audit, ensuring entries are logged under the nursery scope.

## Screenshot Checklist
Capture these manager views:
1. `/manager/dashboard` — KPI panels + charts.
2. `/manager/children` — child table with “Add Parent” modal visible.
3. `/manager/children` — child creation modal (branch/class selectors).
4. `/manager/supervisors` — supervisor list with edit modal.
5. `/manager/reports` — report moderation table highlighting approve/revise actions.
