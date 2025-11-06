# EXECUTION DIRECTIVE — FULL DELIVERY, NO DOWNSCOPING

You are a **senior Full-Stack + DevOps AI Engineer** operating as a disciplined delivery team (solution architect, backend, frontend, DBA, SRE, QA). You must deliver a **final, production-ready system** with **100% completeness, correctness, consistency, and coherence** across **frontend, backend, database, APIs, routes, migrations, tests, and deployment assets**.

## ABSOLUTE CONSTRAINTS

* **Project root:** `D:\nursy`
* **No toolchain swaps or hidden assumptions.** Do **not** introduce new languages, frameworks, build tools, packages, services, or "upgrades" not already in the repo.
* **Database standardization: PostgreSQL only.** If the codebase uses MySQL or a mix, perform a safe, explicit migration to PostgreSQL (schema, data, queries, drivers, migrations). Keep all other tools unchanged.
* **Delete duplication & dead code.** Remove unused files, redundant logic; enforce a clean, layered architecture.
* **Security-first:** Proper RBAC, least privilege, input validation, output encoding, secure session/token handling, secrets management, audit logging, rate limits.
* **Production quality:** Idempotent infra/migrations, seed data when needed, deterministic builds, env-configured.
* **No placeholders.** Implement real, working features with full validation, states, errors, and **tests**.
* **No scope negotiation.** Do not ask for subsets or phases. **Deliver everything now.**

## SCOPE SUMMARY (DELIVER END-TO-END)

### RBAC Users & Roles

* **Superadmin**: full permissions & auth flows; can add Admin, Manager, Supervisor, Parent; full CRUD on kindergartens/nurseries (and branches/classrooms if present).
* **Admin**: CRUD nurseries; **on create**, auto-generate **Manager** login:

  * Username = phone number
  * Password = **6 random digits**; store **hash** only; show **temp credentials once** in UI (reveal/copy, one-time display)
  * Admin can view reports (all filters), **CRUD Supervisors & Parents**, broadcast notifications to Managers.
* **Audit logs** for sensitive actions; **CSV/JSON exports** for nurseries/branches/users/reports.

### Admin UX Workflows

* **Auth:** `POST /auth/login` → JWT/session; lands on `/admin/dashboard`.
* **KPIs:** `/system/analytics` (backend datasets + FE charts).
* **Health:** `/system/system-health` (app+DB+queue+disk/backups checks if applicable).
* **Nursery onboarding:** form (name, address components, contact info, capacity, age range, notes) → define classrooms → show Manager temp creds once.
* **User invitations modal:** first/last name, optional email, role, phone, nursery assignment, activation toggle.
* **System policy & settings:** policy thresholds, session lifetimes, notification templates, rate limit thresholds.
* **Report moderation:** approval status, feedback notes.
* **Exports:** CSV/JSON for nurseries/branches/users/reports with server-side pagination & filters.
* **UI polish:** success/error toasts, reveal/hide temp passwords, copy-to-clipboard, empty states, client validation errors.

### Manager Workflows (scoped to assigned nursery)

* **Parents:** enrollment modal (First, Second, Last, email, phone, home/work addresses, emergency contact, notes).
* **Children:** registration modal with constraints:

  * **Child.Second == Parent.First**, **Child.Last == Parent.Last**
  * Nationality: **"Jordan" → require national_id**, else **passport_no**
  * DOB, photo metadata (use existing storage pattern only), health/education notes, linked parent IDs
* **Supervisors:** CRUD with same national/passport rules; show temp creds once on create.
* **Moderation:** approve/revision + reasons/follow-ups.
* **Attendance:** filters (date ranges, classrooms, statuses), quick actions (check-in/out).
* **Dashboards:** daily/weekly stats, ratios, timelines; pipeline counts; roster with status; toasts.

### Supervisor Workflows

* **Daily report per child:** date, attendance times/status, meals (breakfast/lunch/snacks), naps, diaper changes, activities (title/description), health observations, behavior notes.
* **Attendance quick actions:** check-in/check-out timestamps, manual status.
* **Submissions:** toasts; list with status pills; manager comments for revisions.
* **Scope:** children limited to supervisor's classrooms.

### Database (PostgreSQL)

* **Design/normalize** with FKs, unique constraints, indexes, cascades, soft-delete where appropriate (RLS if applicable).
* **Migrations + seeds** included; **idempotent** and **reversible**.
* **Core tables (complete schema)**:

  * `users (role enum: superadmin/admin/manager/supervisor/parent, name parts, email?, phone unique, username unique, password_hash, is_active, last_login_at, created_at, updated_at)`
  * `nurseries (name, address fields, contact info, capacity, age_range, notes, created_by, timestamps)`
  * `branches (if present)`
  * `classrooms (nursery_id, name, capacity, age_range, notes)`
  * `managers_nurseries (manager_id, nursery_id) unique`
  * `supervisors_classrooms (supervisor_id, classroom_id) unique`
  * `parents (user_id FK, addresses, emergency_contact JSON, notes)`
  * `children (parent_id FK, first, second, last, dob, nationality, national_id?, passport_no?, photo_url/meta, health_notes, education_notes, classroom_id FK, timestamps)`
  * `attendance (child_id, date, check_in, check_out, status enum, notes, created_by, updated_by, timestamps)`
  * `daily_reports (child_id, date, meals JSON, naps JSON, diaper_changes JSON, activities JSON, health_observations JSON, behavior_notes TEXT, status enum: pending/approved/revision, manager_feedback TEXT, created_by, updated_by, timestamps)`
  * `audit_logs (actor_user_id, action, entity_type, entity_id, metadata JSON, ip, user_agent, created_at)`
  * `notification_templates (key unique, subject, body, channels JSON)`
  * `system_settings (policy_thresholds JSON, session_lifetimes JSON, rate_limits JSON, updated_by, updated_at)`
  * `backups (snapshot path/meta, created_by, created_at)`
* **DB + Backend validation rules:**

  * Child.Second == Parent.First; Child.Last == Parent.Last
  * Nationality = "Jordan" → require `national_id`; else require `passport_no`
  * Phone & username unique; temp passwords are **6 digits**, **shown once**, **never stored plaintext** (hash only + ephemeral one-time token/TTL to display)

### API & Routes (follow existing framework conventions)

* **Auth:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
* **Admin:** `/admin/dashboard`, `/system/analytics`, `/system/system-health`
  Nurseries: `POST/GET/GET:id/PUT:id/DELETE:id` (+ classrooms)
  Users & invitations: `POST /admin/users/invite`, `GET /admin/users`, `PUT /admin/users/:id`, `DELETE /admin/users/:id`, activation toggle
  Supervisors & Parents CRUD (admin scope)
  Reports moderation: `PUT /admin/reports/:id/moderate`
  Notifications: `POST /admin/notifications/broadcast`
  Exports: `GET /admin/exports/<entity>.(csv|json)` with filters
  Audit logs: `GET /admin/audit-logs`
* **Manager:** parents, children, supervisors, reports moderation (scoped), attendance, audit, settings
* **Supervisor:** attendance quick actions; daily reports; scoped roster

### Frontend

* Route shells: `/admin/*`, `/manager/*`, `/supervisor/*`
* Forms: full client validation mirroring backend constraints; empty states; skeleton loaders
* Toasts for success/error; copy/reveal temp passwords; broadcast UI; moderation dialogs with status+feedback
* Analytics KPIs + charts from `/system/analytics`
* Health indicators from `/system/system-health`
* Preserve accessibility basics (labels, keyboard nav, aria, focus management)

### PostgreSQL Migration Plan (no other tool changes)

* Inventory current DB usage (drivers/ORM/raw SQL). Produce schema diff for Postgres.
* Create Postgres migrations (enums, JSON, constraints, indexes).
* Build data migration/ETL scripts (idempotent, RI checks).
* Replace MySQL-isms with Postgres-safe queries (LIMIT/OFFSET, ILIKE, JSON ops).
* Update DB config/env; pooling; retry logic.
* Dry-run on snapshot; validate row counts/constraints/queries.
* Add schema check + migration smoke to CI.
* Cut-over plan with backup, maintenance window, verify, **rollback** documented.

### Security, Compliance, Quality

* Strong hashing (argon2/bcrypt); password policies for non-temp creds
* RBAC middleware everywhere; sanitization; encoding; CSRF (if cookies), CORS; **rate limits** from `system_settings`
* Audit logs for sensitive flows; structured logs with correlation IDs
* Backups endpoint (if present) gated to Superadmin
* Tests: unit, integration (repo+DB), API contract, E2E; fixtures/seeds
* Performance sanity on key pages; a11y basics

## EXECUTION MODE (DO NOT ASK QUESTIONS — DELIVER)

Work **sequentially**, self-verify at each gate, then proceed.

1. **Repo Scan & Plan (≤30 lines)**
   Inventory stack, DB driver/ORM, structure, routes, tests. Map each requirement to exact files/modules.

2. **PostgreSQL Standardization**
   Full schema migrations + seeds; data migration scripts (MySQL→PG if applicable); update drivers/config; remove MySQL-isms.

3. **RBAC & Auth**
   Implement/confirm Superadmin/Admin/Manager/Supervisor/Parent; middleware guards; end-to-end flows.

4. **Admin Workflows**
   Dashboard, analytics, health; onboarding + classrooms + **auto Manager temp creds** (hash at rest; one-time display); invitations, CRUD, broadcast; moderation; exports; audit logs.

5. **Manager Workflows**
   Parents/Children validation (Jordan ID vs passport), supervisor CRUD with temp creds; moderation; attendance filters; dashboards.

6. **Supervisor Workflows**
   Attendance quick actions; structured daily reports (JSON sections); list/edit per status.

7. **Frontend**
   Routes, forms, validation, toasts, copy/reveal temp passwords, dialogs, a11y basics.

8. **Tests (target ≥ repo default; else 80%)**
   Unit, integration, API, E2E; deterministic seeds.

9. **Cleanup**
   Remove duplication/dead files; normalize structure; lint/format/type checks pass.

10. **Docs & CI**
    OpenAPI/Swagger updated; `.env.example`; runbooks (migrations, rollback); CHANGELOG.md; CI wired to lint/test/migrate smoke.

## VERIFICATION GATES (BLOCKERS)

* **Static checks:** lint/format/type (as applicable) pass
* **Tests:** unit/integration/API/E2E green; coverage ≥ threshold
* **Runtime validation:** local env runs; all role logins & flows match spec (no stubs)
* **Acceptance Checklist:** all ✅

### ACCEPTANCE CHECKLIST (DEFINITION OF DONE)

* ✅ No duplication; dead code removed; coherent structure
* ✅ PostgreSQL is sole DB; migrations idempotent; data migration validated
* ✅ Roles & permissions exact; Superadmin/Admin behaviors match spec
* ✅ Admin: onboarding + classrooms; auto Manager creds (6 digits, hash, one-time display)
* ✅ Manager: parent/child validations (Jordan ID vs passport); supervisor CRUD w/ temp creds; moderation; attendance filters
* ✅ Supervisor: attendance quick actions; daily reports with JSON sections; list & edit per status
* ✅ Notifications broadcast; templates configurable
* ✅ `/system/analytics` chart-ready; `/system/system-health` reflects app/DB status
* ✅ Exports CSV/JSON (filtered, paginated) accurate
* ✅ Audit logs for sensitive events
* ✅ UI/UX polished: toasts, validation, empty states, a11y basics
* ✅ CI green; artifacts reproducible; env samples provided
* ✅ Security review: auth, RBAC, rate limits, sanitization, secrets
* ✅ Deployment/rollback docs updated

## OUTPUTS & ARTIFACTS (REQUIRED)

* Updated source in `D:\nursy` (frontend, backend, migrations, seeds, tests, CI)
* DB migrations + data migration scripts (MySQL→PG if applicable) with runbooks
* API reference (OpenAPI/Swagger) matching implemented routes
* UX notes for Admin/Manager/Supervisor (flows + screenshots if render pipeline exists)
* Ops docs: health checks, backups, settings/rate limits, env vars, deployment + rollback
* Test reports & coverage summary; perf snapshot for main pages
* CHANGELOG.md updates; `.env.example` updated

## GITHUB DELIVERY (MANDATORY)

* Provide **unified Git patches**:

  * `patch-01-db-migrations.diff`
  * `patch-02-backend-routes-services.diff`
  * `patch-03-frontend-ui.diff`
  * `patch-04-tests-and-ci.diff`
  * `patch-05-docs-and-runbooks.diff`
* Open **a single PR** with:

  * **Title:** `feat(a11y+rbac+pg): full production remediation & PG standardization`
  * **Body:** Release Notes, Verification Report (map acceptance items → files/tests), Go-Live checklist (backup, migration, health, rollback)

## PROHIBITED

* No silent scope changes
* No new tools beyond Postgres standardization mandate
* No fake logic or stubs
* No background workers/services not already in the repo

## FINAL CONFIRMATION (MUST DELIVER)

When **all gates pass**, include in the PR:

1. **Release Notes** (features, migrations, breaking changes)
2. **Verification Report** (each acceptance item proven with diffs/paths/tests & sample calls/screens)
3. **Go-Live Checklist** ticked (backup taken, migration run, health OK, roll-forward & rollback documented)

---

## USAGE

This specification is for **Phase 2** implementation after the current accessibility work is complete.

**Current Status:** Accessibility remediation (Phase 1) is ready for PR.

**Next Steps:**
1. Complete accessibility PR merge
2. Create new branch: `feat/comprehensive-rbac-pg-migration`
3. Execute this directive in full

---

**Saved:** `.github/COMPREHENSIVE_SYSTEM_UPGRADE_SPEC.md`  
**Status:** Ready for Phase 2 implementation
