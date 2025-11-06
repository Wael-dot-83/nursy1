# Parent Role Workflow Reference

## Purpose
Parents access real-time updates about their enrolled children: daily attendance, activity reports, notifications from the nursery, and profile information.

## Frontend Entry Points
- `nursery-system/frontend/src/pages/parent/ParentDashboard.jsx`: overview cards, latest notifications, quick child listing.
- `nursery-system/frontend/src/pages/parent/ParentChildren.jsx`: detailed child profiles, classroom placement, contact information.
- `nursery-system/frontend/src/pages/parent/ParentReports.jsx`: chronological daily reports with filters and print/export hooks.
- `nursery-system/frontend/src/pages/parent/ParentNotifications.jsx`: messaging center with read/unread states.

## Primary Inputs
- Minimal data entry (primarily view-only). Parents can:
  - Filter reports by child/date range.
  - Mark notifications as read.
  - Download/export report snapshots (planned).

## Outputs & Visualisations
- Personalized dashboard summarizing child roster, next steps, and unread notifications.
- Detailed report timelines containing meals, naps, activities, health notes, attendance timestamps.
- Attendance history charts/tables per child.
- Notification feed with timestamps and categories (event reminders, announcements, alerts).

## Backend Endpoints & Logic
- Parent router (`nursery-system/backend/app/parent_router.py`):
  - `GET /parent/children` — fetch children linked to the authenticated parent with latest report metadata.
- Shared feature routers:
  - `GET /children/parent/` & `GET /children/parent/{id}` (`children_router.py`) for child profiles.
  - `GET /attendance/parent/{childId}` (`attendance_router.py`) for attendance history.
  - `GET /reports/parent/{childId}` (`reports_router.py`) for daily reports, including pagination/filter options.
  - `GET /notifications/` and `PATCH /notifications/{id}/read` (`notification_router.py`) once parent scoping is enforced.
- All calls require parent JWT; `require_parent` ensures access is restricted to the caller’s children.

## Database Touchpoints
- `children`: records owned by the parent (linked via `parent_id` and join tables if multiple guardians are supported).
- `daily_reports`: source for detailed daily summaries, serialized JSON fields for meals/activities.
- `attendance`: per-child check-in/out history.
- `notifications`: targeted announcements/messages.
- `users`: parent account with contact preferences.

## End-to-End Workflow
1. Parent logs in → `/parent/dashboard` loads `GET /parent/children` and `GET /notifications/` previews.
2. Selecting a child reveals detailed profile (classroom, branch, emergency contacts) via `/children/parent/{childId}`.
3. Parent navigates to Reports to browse daily updates (`GET /reports/parent/{childId}`), filtering by date or status, and optionally exporting.
4. Attendance tab leverages `/attendance/parent/{childId}` for arrival/departure history and status.
5. Notifications page surfaces targeted messages; parent marks messages as read (`PATCH /notifications/{id}/read`) when available.

## Screenshot Checklist
1. `/parent/dashboard` — include child summary cards and notifications panel.
2. `/parent/children` — child profile view with classroom details.
3. `/parent/reports` — daily report timeline with filters applied.
4. `/parent/notifications` — list of announcements highlighting unread badge states.
