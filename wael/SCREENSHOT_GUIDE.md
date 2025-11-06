# Frontend Screenshot Capture Guide

The workflow docs reference specific UI captures for each role. Follow this checklist to gather the assets manually—no automated tooling is bundled in the repo.

## Prerequisites
- Backend API running locally: `cd nursery-system/backend && uvicorn app.main:app --reload`.
- Frontend dev server: `cd nursery-system/frontend && npm install && npm run dev`.
- Seed data or fixtures that surface representative records (nurseries, supervisors, children, reports). You may reuse existing QA data or import fixtures through admin tools.

## Capture Steps
1. **Admin**
   - `/admin/dashboard`: show KPI tiles & charts.
   - `/admin/nurseries`: open “Create Nursery” modal.
   - `/admin/users`: include role filters with temp password modal.
   - `/admin/reports`: highlight approval controls.
   - `/admin/audit-logs`: display audit table with filters.
2. **Manager**
   - `/manager/dashboard`: capture statistics overview.
   - `/manager/children`: display parent + child forms.
   - `/manager/supervisors`: show supervisor list + edit modal.
   - `/manager/reports`: include approve/revise buttons.
3. **Supervisor**
   - `/supervisor/dashboard`: record attendance widgets.
   - `/supervisor/reports?mode=create`: show report form.
   - `/supervisor/reports`: list view with status chips.
4. **Parent**
   - `/parent/dashboard`: child summary cards & notifications.
   - `/parent/children`: detailed child profile.
   - `/parent/reports`: daily report timeline with filter panel.
   - `/parent/notifications`: unread/read states.

## Tips
- Use browser devtools to emulate production viewport (1280×720 or similar).
- Blur or anonymise sensitive data before sharing externally.
- Store captures under `docs/screenshots/<role>/` or your preferred asset path, and reference them from the workflow docs if needed.
