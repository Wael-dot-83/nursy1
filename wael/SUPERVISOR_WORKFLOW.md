# Supervisor Role Workflow Reference

## Purpose
Supervisors handle daily classroom execution: tracking attendance, documenting child activities, submitting daily reports, and previewing feedback from managers.

## Frontend Entry Points
- `nursery-system/frontend/src/pages/supervisor/SupervisorDashboard.jsx`: attendance summary, upcoming activities, recent feedback highlights.
- `nursery-system/frontend/src/pages/supervisor/SupervisorReports.jsx`: unified view for report creation, listing, and editing.
- Shared components for attendance actions leverage `attendanceAPI` helpers in `nursery-system/frontend/src/lib/api.js`.

## Primary Inputs
- Daily report form: child selector, date, attendance times/status, meals (breakfast/lunch/snacks), naps, diaper changes, activities (title/description), health observations, behavior notes.
- Attendance quick actions: check-in/check-out timestamps, manual status adjustments.
- Optional attachment metadata (future file upload integration).

## Outputs & Feedback
- Confirmation dialogs/toasts when reports are submitted or updated.
- Pending/approved report lists with status pills, manager comments once revision flow is wired.
- Attendance summaries per classroom/day, including ratios and late arrivals.

## Backend Endpoints & Logic
- Supervisor router (`nursery-system/backend/app/supervisor_router.py`):
  - `GET /supervisor/children` — list children assigned to supervisor’s classrooms.
  - `GET /supervisor/reports` — retrieve submitted reports with status filters.
  - `POST /supervisor/reports` — create new daily report entries.
  - `PUT /supervisor/reports/{id}` — update existing reports (e.g., after manager feedback).
  - `GET /supervisor/dashboard` — roll-up metrics for the dashboard view.
- Shared attendance/report endpoints:
  - `POST /attendance/check-in|check-out/{childId}` and `GET /attendance/my-nursery/` (with manager/supervisor guard) for real-time attendance updates (`attendance_router.py`).
  - `GET /reports/my-nursery/` for aggregated history (`reports_router.py`).
- Access enforcement via `require_supervisor` dependency ensures supervisors operate within their assigned nursery and classroom scope.

## Database Touchpoints
- `children`: fetch roster restricted to supervisor’s classrooms.
- `daily_reports`: primary table for submissions; includes nested JSON fields (meals, activities, observations).
- `attendance`: for check-in/out interactions and status tracking.
- `audit_logs`: captures report submissions and updates for traceability.

## End-to-End Workflow
1. Supervisor signs in and opens `/supervisor/dashboard`; SPA fetches `GET /supervisor/dashboard` plus `/attendance/my-nursery/` snapshot.
2. For each classroom:
   - Uses attendance quick actions (check-in/out) to keep real-time status.
   - Opens Supervisor Reports in “Create” mode, selects child + date, fills structured sections, and submits via `POST /supervisor/reports`.
3. Reviews submitted reports in “List” mode (`GET /supervisor/reports`), filtering by status/date. If manager requests changes, edits via `PUT /supervisor/reports/{id}`.
4. Monitors manager feedback and adjusts future submissions accordingly.

## Screenshot Checklist
1. `/supervisor/dashboard` — attendance summary widgets.
2. `/supervisor/reports?mode=create` — report creation form populated with sample data.
3. `/supervisor/reports` — list view showing status chips and action buttons.
