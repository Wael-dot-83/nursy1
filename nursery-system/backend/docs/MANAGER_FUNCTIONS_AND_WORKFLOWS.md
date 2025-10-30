# Manager Guide — Functions & Workflows (Nursery Management)

This document explains the backend endpoints implemented in `nursery_router.py` and describes, in plain language for managers and product owners, the exact behaviour, inputs/outputs, workflows, edge cases, and important notes for each function related to nursery, branch and classroom management.

> Audience: Product managers, operations managers, and non-developer stakeholders who need to understand how the system behaves when they create/update/delete nurseries, branches and classrooms.

---

## Quick overview (non-technical)

- The system exposes endpoints (server-side routes) that allow administrators to create, view, update and delete nurseries, branches and classrooms.
- Only users with the Admin role may call these endpoints (i.e., the UI’s "Admin" section or API clients using an Admin account).
- When creating a new nursery the backend does additional work: it persists the nursery, optionally creates branches, and creates a manager account with a temporary password for that nursery.
- The manager account is returned to the caller (temporary password) for onboarding; this is intended for development and must be handled securely in production.

---

## Roles & permissions

- Admin: Full access to all endpoints in this router. Only Admin may create/update/delete nurseries, branches or classrooms and view details.
- Manager: Not given direct access to these endpoints in the current implementation; managers manage day-to-day operations in the UI, but creation of nurseries is an administrative action.

---

## Endpoints and detailed descriptions

Each entry below contains:
- Path & Method
- Purpose
- Who uses it (permission)
- Inputs (what the frontend must send)
- Outputs (what will be returned)
- Workflow steps (what the server does, step-by-step)
- Common error cases and how they surface
- Manager notes (what the product/operations team should expect)

### 1) GET /nurseries
- Purpose: Sanity / list endpoint returning a message and echoing pagination parameters (placeholder behaviour).
- Permission: Admin only (note the router-level decorator uses `require_admin` in other functions; this one currently does not enforce it by code, but intended for admin use).
- Inputs: Query parameters: `skip` (int, default 0), `limit` (int, default 100).
- Output: JSON with a message and the `skip` and `limit` values. Example: `{ "message": "Nurseries endpoint working", "skip": 0, "limit": 100 }`.
- Workflow (server): Returns a simple JSON message — currently not a full list implementation.
- Errors: None (always returns the message). If we later implement real listing, watch for DB errors or permissions issues.
- Manager notes: This endpoint is a placeholder; the UI should call the fully implemented list endpoint if available. If you see just the message in the UI, it means the listing logic is not implemented in the backend yet.


### 2) POST /nurseries
- Purpose: Create a new nursery and bootstraps a manager user for it.
- Permission: Admin only (the function requires `current_user: User = Depends(require_admin)`).
- Inputs (body): `NurseryCreate` schema. Typical properties expected from the UI:
  - `name` (string) — nursery name
  - `main_address` (object) — fields: street, city, governorate, postalCode
  - `main_phone` (string)
  - `email` (string)
  - `age_range` (object) — minAge, maxAge
  - `notes` (string, optional)
  - `branches` (optional list) — each branch with name, address, phone
- Outputs (success): JSON object representing the created nursery plus:
  - `branches`: array of created branch objects (if provided)
  - `manager`: object with onboarding credentials:
    - `username` (string) — generated username like `manager_{nursery_id}`
    - `temporaryPassword` (string) — a generated password (12 chars) **(see security notes)**
    - `fullName`, `email` — manager contact
  - The returned nursery uses the database model attributes (concrete fields like `main_street`, `min_age_days`, etc.).
- Workflow (server steps):
  1. Validate request body against `NurseryCreate` schema.
  2. Construct a `Nursery` database object using name, main address parts, phone, email, age range mapped to the DB columns (note: implementation maps `minAge` to `min_age_days` and `maxAge` to `max_age_months` — units differ, see notes below).
  3. Persist `Nursery` (add, commit, refresh to get ID and timestamps).
  4. If `branches` supplied: for each branch, create a `Branch` record with address, phone, persist individually and collect them.
  5. Generate manager credentials: username `manager_{id}`, a 12-character random password, manager email defaulting to nursery email (or fallback), then hash password.
  6. Create a `User` record with role `MANAGER`, assign `nursery_id` and store hashed password.
  7. Persist manager user and return response combining nursery, branches, and manager onboarding info.
- Common errors and how they surface:
  - Validation errors: If the request fails schema validation, FastAPI will return 422 with details.
  - DB errors: Unique constraints (duplicate email, phone) may result in 400/500 responses if exceptions bubble up.
  - Permission error: If the caller is not an Admin, the dependency `require_admin` will raise an HTTPException (likely 401/403).
- Manager notes & operational behaviour:
  - The backend creates a manager account automatically and returns the temporary password in the API response. For production, the team should NOT return plaintext passwords — instead send an invite email with a token or require password setup.
  - The generated manager username follows the pattern `manager_{nursery_id}`.
  - Address fields are split into discrete DB fields (street, city, governorate, postal code). UI should map addresses accordingly.
  - Important: Age units are inconsistent in DB mapping: `minAge` is saved to `min_age_days` and `maxAge` is saved to `max_age_months`. The product team must confirm intended units; otherwise the system may store incorrect age ranges.
  - Example UI flow (what managers see):
    1. Admin fills the “Add nursery” form (name, phone, email, age range, branches optional).
    2. Admin clicks Save -> frontend sends POST to `/api/nurseries` (or `/nurseries` depending on proxy) with the form JSON.
    3. On success, UI receives nursery object and manager temporary credentials and shows onboarding instructions or sends them to the manager via email.


### 3) GET /nurseries/{nursery_id}
- Purpose: Retrieve a single nursery with its branches and formatted fields for the frontend.
- Permission: Admin only.
- Inputs: `nursery_id` path parameter (integer).
- Outputs: JSON object representing the nursery with formatted field names the frontend expects (e.g., `mainStreet`, `minAgeDays`, `branches` array with addresses nested).
- Workflow (server):
  1. Query DB for nursery by ID.
  2. If not found -> raise 404.
  3. Format DB fields to a frontend-friendly JSON structure (field renaming and aggregation).
  4. Query `Branch` table for branches with that `nursery_id` and append formatted branch objects to the `branches` array.
  5. Return formatted nursery object.
- Errors: 404 if not found, 500 for DB or unexpected exceptions.
- Manager notes: This is the canonical endpoint that the Admin UI should call to populate the Edit / Details view for a nursery.


### 4) PUT /nurseries/{nursery_id}
- Purpose: Update an existing nursery’s attributes.
- Permission: Admin only.
- Inputs: Path param `nursery_id`, body `NurseryUpdate` with optional fields to update (name, main_phone, email, main_address, age_range, notes).
- Outputs: Returns the updated nursery object in the same formatted shape as `GET /nurseries/{id}`.
- Workflow (server):
  1. Query for nursery. If missing -> 404.
  2. For each provided field in `NurseryUpdate`, update the corresponding DB column.
  3. Commit and refresh the DB object.
  4. Re-query branches and append formatted branches like the GET endpoint.
  5. Return the formatted updated object.
- Errors: 404 example, validation 422, DB errors 500.
- Manager notes: This endpoint will not create or delete branches — branch management uses separate endpoints. Changes to the age range again depend on agreed-upon units (days vs months).


### 5) DELETE /nurseries/{nursery_id}
- Purpose: Remove a nursery record from the system.
- Permission: Admin only.
- Inputs: `nursery_id` path param.
- Outputs: `BaseResponse` with message "Nursery deleted successfully" on success.
- Workflow (server):
  1. Query nursery by ID. If not found -> 404.
  2. Delete the nursery (and, depending on DB cascade rules, related branches/users may be deleted or require manual cleanup).
  3. Commit transaction and return success message.
- Errors: 404 if missing; caution about cascade behavior — confirm data retention policy before deleting production records.
- Manager notes: Deleting a nursery is destructive — ensure backups and proper checks (confirmation modal) on the UI. Consider soft-delete or admin confirmation steps.


### 6) GET /nurseries/{nursery_id}/branches
- Purpose: List all branches for a specific nursery.
- Permission: Admin only.
- Inputs: `nursery_id` path param.
- Outputs: Array of branch objects with nested `address` object (street, city, governorate, postalCode).
- Workflow: Query `Branch` table for matching `nursery_id`, format each branch, return array.
- Errors: If nursery doesn't exist the endpoint currently returns an empty list (it does not explicitly check nursery existence) — implement a guard if necessary.
- Manager notes: UI should call this to populate branch lists for a nursery.


### 7) POST /nurseries/{nursery_id}/branches
- Purpose: Create a new branch under a nursery.
- Permission: Admin only.
- Inputs: `nursery_id` path param; body `BranchCreate` (name, address, phone).
- Outputs: The newly created branch object formatted for the frontend.
- Workflow:
  1. Verify nursery exists (returns 404 if missing).
  2. Create `Branch` DB record with provided data and commit.
  3. Return formatted branch.
- Errors: 404 when nursery not found; validation 422.
- Manager notes: Branch creation requires a valid nursery. The UI should redirect to the nursery detail view after branch creation.


### 8) GET /branches/{branch_id}
- Purpose: Get branch details by branch id.
- Permission: Admin only.
- Inputs: `branch_id` path param.
- Outputs: Formatted branch object.
- Workflow: Query `Branch` -> 404 if not found -> format and return.
- Manager notes: Used by the UI to populate branch edit/detail screens.


### 9) PUT /branches/{branch_id}
- Purpose: Update branch details.
- Permission: Admin only.
- Inputs: `branch_id` path param; `BranchUpdate` body with optional updates.
- Outputs: Updated branch object.
- Workflow: Query branch -> update provided fields -> commit -> refresh -> return formatted branch.
- Manager notes: Keep in mind address fields are split; updating address replaces the address parts.


### 10) DELETE /branches/{branch_id}
- Purpose: Delete a branch.
- Permission: Admin only.
- Inputs: `branch_id` path param.
- Outputs: `BaseResponse` message on success.
- Workflow: Query branch -> 404 if missing -> delete -> commit -> return success.
- Manager notes: Similar to nursery deletion — consider soft-delete policy.


### 11) GET /branches/{branch_id}/classrooms
- Purpose: List all classrooms under a branch.
- Permission: Admin only.
- Inputs: `branch_id` path param.
- Outputs: Array of classroom objects (raw DB model currently returned).
- Workflow: Query `Classroom` table filtering `branch_id`.
- Manager notes: The UI should show classroom list using this.


### 12) POST /branches/{branch_id}/classrooms
- Purpose: Create a classroom under a branch.
- Permission: Admin only.
- Inputs: `branch_id` path param; body `ClassroomCreate` (classroom properties). The server ensures `branch_id` matches the URL.
- Outputs: The newly created classroom object.
- Workflow: Verify branch exists -> merge `branch_id` into classroom data -> create `Classroom` record -> commit -> return DB model.
- Manager notes: Classroom creation is simple; the UI should validate fields before submitting.


### 13) GET /classrooms/{classroom_id}
- Purpose: Get a classroom by id.
- Permission: Admin only.
- Inputs: `classroom_id` path param.
- Outputs: Classroom DB model object.
- Workflow: Query `Classroom` -> 404 if missing -> return.


### 14) PUT /classrooms/{classroom_id}
- Purpose: Update classroom fields.
- Permission: Admin only.
- Inputs: `classroom_id` path param; `ClassroomUpdate` body with optional fields to update.
- Outputs: Updated classroom object.
- Workflow: Query `Classroom`, apply updates using `dict(exclude_unset=True)`, commit and return refreshed model.
- Manager notes: Update will set attributes as provided; any omitted fields are left unchanged.


### 15) DELETE /classrooms/{classroom_id}
- Purpose: Delete classroom.
- Permission: Admin only.
- Inputs: `classroom_id` path param.
- Outputs: `BaseResponse` with message on success.
- Workflow: Query -> 404 if missing -> delete -> commit -> return success.


---

## Cross-cutting notes and important caveats (for managers)

1. Security & onboarding: The `POST /nurseries` endpoint returns the manager's temporary password in plaintext. In production this is a security risk — prefer sending an email invite, or returning a one-time setup token rather than the password.

2. Age units mismatch: The implementation maps `age_range.minAge` into a DB column named `min_age_days` and `age_range.maxAge` into `max_age_months`. This mismatch can lead to wrong data entry (e.g., a UI entering ages in years/months may be mapped incorrectly). Confirm the intended unit (days/months) and adjust both UI and backend consistently.

3. Cascading deletes: Deleting a nursery may or may not cascade to branches, users, children, attendance, etc. Confirm retention policy and implement soft-delete if required to avoid data loss.

4. Validation: Some endpoints assume correct payload shapes. The UI should perform client-side validation and the backend should enforce constraints (existing code depends on Pydantic schemas; ensure these schemas match the UI contract).

5. Errors: Common visible messages to the admin UI will be 401/403 (authorization), 404 (not found), 422 (validation error), 500 (server error). Ensure the frontend surfaces friendly error messages and handles each status appropriately.

6. Method Not Allowed (405) — common cause and fix for the `Save` action problem:
   - Cause: The frontend may be calling the wrong origin (Vite dev server at `localhost:5173`) or an incorrect path (e.g., `POST` to `/admin/nurseries` page route) instead of the API endpoint (e.g., `/api/nurseries` or `http://localhost:8000/nurseries`). Another possibility is the frontend issuing a `GET` when backend expects `POST` (or vice-versa).
   - Quick manager-level checklist to resolve 405 issues:
     1. Ensure the Save button issues a POST request to the API URL (e.g., `POST http://localhost:8000/nurseries` or the proxied `/api/nurseries`).
     2. Confirm frontend base URL / proxy configuration (Vite `devServer.proxy` or `vite.config.js`) targets the backend origin.
     3. Check network tab for the actual request method & URL; if it's hitting `localhost:5173/admin/nurseries` the request is going to the frontend dev server (wrong origin).
     4. Ensure CORS on the backend allows the frontend origin (e.g., `http://localhost:5173`).
     5. If using CSRF tokens (session-based auth), ensure the token is present in the request headers.
   - Typical fix for developers: update frontend to call the API endpoint (example in frontend code):

```
// Example (frontend JS):
await fetch("http://localhost:8000/nurseries", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  body: JSON.stringify(payload)
});
```

or if using a proxy in Vite (`vite.config.js`):

```
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api/, ''),
  }
}
```

Then the frontend can POST to `/api/nurseries` and the dev server will forward to the backend.

---

## Example requests for Admins / Ops (curl)

- Create nursery (example payload trimmed):

```
curl -X POST "http://localhost:8000/nurseries" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Al Zaytoonah",
    "main_address": { "street": "Street 1", "city": "Amman", "governorate":"Amman", "postalCode":"11111" },
    "main_phone": "0780337514",
    "email": "waeljumah83@gmail.com",
    "age_range": { "minAge": 3, "maxAge": 52 },
    "branches": []
  }'
```

- Expected success: HTTP 200 with nursery object and `manager.temporaryPassword`. If you receive 405, check the request method and URL.

---

## Appendix: Mapping between UI fields and DB columns (summary)

- UI `name` -> DB `Nursery.name`
- UI `main_address.street` -> DB `Nursery.main_street`
- UI `main_address.city` -> DB `Nursery.main_city`
- UI `main_address.governorate` -> DB `Nursery.main_governorate`
- UI `main_address.postalCode` -> DB `Nursery.main_postal_code`
- UI `main_phone` -> DB `Nursery.main_phone`
- UI `email` -> DB `Nursery.email`
- UI `age_range.minAge` -> DB `Nursery.min_age_days` (verify units!)
- UI `age_range.maxAge` -> DB `Nursery.max_age_months` (verify units!)

---

## Next steps / Recommendations for product managers

1. Confirm desired age units and update both UI schemas and backend field names to avoid confusion (e.g., use `minAgeMonths`/`maxAgeMonths` or `minAgeDays` consistently).
2. Replace plaintext temporary-password return with a secure invite flow: create invitation token -> email manager -> require password setup.
3. Add soft-delete for nurseries/branches to avoid irreversible data loss.
4. Ensure frontend calls the correct API origin (use Vite proxy in development, or set API base URL in environment variables for deployed envs).
5. Add audit entries when Admins create/update/delete nurseries and branches (so operations appear in audit logs and can be reviewed).

---

If you’d like, I can:
- Produce the same level of documentation for `auth_router.py`, `file_router.py`, `notification_router.py`, and `audit_router.py`.
- Create a short one-page checklist for QA to validate the Add Nursery flow (network tab steps and acceptance criteria).

Tell me which of these follow-ups you want next and I’ll continue.

---

## Authentication Router (`auth_router.py`) — User Login & Session Management

This section covers endpoints for user authentication, OTP verification, password changes, and session management.

### Roles & permissions (Auth)
- All users: Can login, request OTP, verify OTP, refresh tokens, logout, get own profile, change password.
- Rate limiting: Authentication endpoints are rate-limited (configurable per minute, default 5 requests/minute).

### Auth Endpoints

#### 1) POST /auth/login
- Purpose: Direct login with email/password (bypasses OTP for development).
- Permission: Any authenticated user (but rate-limited).
- Inputs: `LoginRequest` body with `email` and `password`.
- Outputs: `TokenResponse` with `access_token`, `refresh_token`, `token_type`, `expires_in`.
- Workflow: Authenticate user -> create JWT tokens -> return tokens.
- Errors: 401 for invalid credentials, 429 for rate limit exceeded.
- Manager notes: This is the primary login endpoint. In production, consider enforcing OTP for all logins.

#### 2) POST /auth/login/otp
- Purpose: Initiate OTP-based login after password verification.
- Permission: Any user (rate-limited).
- Inputs: `LoginRequest` with email/password.
- Outputs: `BaseResponse` message "OTP sent to your registered phone/email".
- Workflow: Verify credentials -> create OTP request -> TODO: send via SMS/email -> return success.
- Errors: 401 for invalid credentials.
- Manager notes: OTP sending is not implemented (marked as TODO); integrate with SMS/email service for production.

#### 3) POST /auth/otp/request
- Purpose: Request new OTP for login.
- Permission: Any user (rate-limited).
- Inputs: `OTPRequest` with `email`.
- Outputs: `BaseResponse` message.
- Workflow: Create OTP request -> TODO: send OTP.
- Manager notes: Similar to above, OTP delivery needs implementation.

#### 4) POST /auth/otp/verify
- Purpose: Verify OTP and get tokens.
- Permission: Any user (rate-limited).
- Inputs: `OTPVerifyRequest` with `email` and `otp_code`.
- Outputs: `TokenResponse` with tokens.
- Workflow: Verify OTP -> create tokens -> return.
- Errors: 401 for invalid/expired OTP.
- Manager notes: OTP codes are not exposed in responses for security.

#### 5) POST /auth/refresh
- Purpose: Refresh access token using refresh token.
- Permission: Any user with valid refresh token.
- Inputs: `RefreshTokenRequest` with `refresh_token`.
- Outputs: `TokenResponse` with new access token.
- Workflow: Validate refresh token -> generate new access token -> return.
- Errors: 401 for invalid token.
- Manager notes: Refresh tokens are long-lived; implement proper revocation in production.

#### 6) POST /auth/logout
- Purpose: Logout (placeholder implementation).
- Permission: Any authenticated user.
- Inputs: None (body empty).
- Outputs: `BaseResponse` message.
- Workflow: Currently just returns success; TODO: revoke refresh token.
- Manager notes: Implement token revocation for security.

#### 7) GET /auth/me
- Purpose: Get current user profile information.
- Permission: Any authenticated user.
- Inputs: None (uses JWT token).
- Outputs: `UserResponse` with user details.
- Workflow: Extract user from token -> return profile.
- Manager notes: Used by frontend to display user info and permissions.

#### 8) POST /auth/password/change
- Purpose: Change user password.
- Permission: Any authenticated user.
- Inputs: `PasswordChangeRequest` with `current_password`, `new_password`.
- Outputs: `BaseResponse` message.
- Workflow: Verify current password -> hash new password -> update DB -> commit.
- Errors: 401 for incorrect current password, 422 for validation (e.g., new password same as old).
- Manager notes: Validates new password differs from current; enforces 8+ char minimum.

---

## File Router (`file_router.py`) — File Upload & Management

Handles file uploads, downloads, and management with validation and permissions.

### Roles & permissions (Files)
- Users: Can upload/download/delete their own files.
- Admins: Can access all files.
- Validation: File size limit (10MB), allowed MIME types (images, PDFs, docs).

### File Endpoints

#### 1) POST /files/upload
- Purpose: Upload a file with optional description.
- Permission: Any authenticated user.
- Inputs: Multipart form with `file` (UploadFile) and optional `description`.
- Outputs: `FileAssetResponse` with file metadata.
- Workflow: Validate file -> save to user directory -> create DB record -> return metadata.
- Errors: 413 for oversized files, 415 for invalid types, 500 for save failures.
- Manager notes: Files stored in user-specific directories; generates unique filenames.

#### 2) GET /files/{file_id}
- Purpose: Get file metadata.
- Permission: File owner or admin.
- Inputs: `file_id` path param.
- Outputs: `FileAssetResponse`.
- Workflow: Query file -> check permissions -> return metadata.
- Errors: 404 not found, 403 forbidden.
- Manager notes: Does not return file content; use download endpoint for that.

#### 3) GET /files/{file_id}/download
- Purpose: Download file content.
- Permission: File owner or admin.
- Inputs: `file_id` path param.
- Outputs: FileResponse with file content.
- Workflow: Query file -> check permissions -> verify file exists on disk -> return file.
- Errors: 404 if file missing from DB or disk.
- Manager notes: Returns original filename and MIME type.

#### 4) DELETE /files/{file_id}
- Purpose: Delete file and metadata.
- Permission: File owner or admin.
- Inputs: `file_id` path param.
- Outputs: `BaseResponse` message.
- Workflow: Query file -> check permissions -> delete from disk -> delete DB record -> commit.
- Errors: 404 not found, 403 forbidden, 500 delete failure.
- Manager notes: Permanently deletes file; consider soft-delete for recovery.

#### 5) GET /files/
- Purpose: List user's files (or all for admins).
- Permission: Any authenticated user.
- Inputs: Query params `skip`, `limit`.
- Outputs: Array of `FileAssetResponse`.
- Workflow: Query files (filtered by user if not admin) -> order by creation date -> paginate -> return.
- Manager notes: Admins see all files; users see only theirs.

---

## Notification Router (`notification_router.py`) — User Notifications

Manages user notifications with read/unread status and admin broadcasting.

### Roles & permissions (Notifications)
- Users: Can view/read/delete their own notifications.
- Admins: Can create notifications and broadcast to users.

### Notification Endpoints

#### 1) GET /notifications/
- Purpose: Get user's notifications.
- Permission: Any authenticated user.
- Inputs: Query params `skip`, `limit`, `unread_only`.
- Outputs: Array of `NotificationResponse`.
- Workflow: Query notifications for user -> filter unread if requested -> paginate -> return.
- Manager notes: Ordered by creation date (newest first).

#### 2) GET /notifications/unread-count
- Purpose: Get count of unread notifications.
- Permission: Any authenticated user.
- Inputs: None.
- Outputs: JSON with `count`.
- Workflow: Count unread notifications for user.
- Manager notes: Used for notification badge in UI.

#### 3) GET /notifications/{notification_id}
- Purpose: Get specific notification.
- Permission: Notification owner.
- Inputs: `notification_id` path param.
- Outputs: `NotificationResponse`.
- Workflow: Query notification -> verify ownership -> return.
- Errors: 404 not found.
- Manager notes: Users can only access their own notifications.

#### 4) PATCH /notifications/{notification_id}/read
- Purpose: Mark notification as read.
- Permission: Notification owner.
- Inputs: `notification_id` path param.
- Outputs: `BaseResponse` message.
- Workflow: Query notification -> set `is_read=true`, `read_at=now` -> commit.
- Errors: 404 not found.
- Manager notes: Only updates if not already read.

#### 5) PATCH /notifications/read-all
- Purpose: Mark all user's notifications as read.
- Permission: Any authenticated user.
- Inputs: None.
- Outputs: `BaseResponse` message.
- Workflow: Bulk update all unread notifications for user -> commit.
- Manager notes: Efficient bulk operation.

#### 6) DELETE /notifications/{notification_id}
- Purpose: Delete notification.
- Permission: Notification owner.
- Inputs: `notification_id` path param.
- Outputs: `BaseResponse` message.
- Workflow: Query notification -> verify ownership -> delete -> commit.
- Errors: 404 not found.
- Manager notes: Permanent deletion.

#### 7) POST /notifications/
- Purpose: Create notification for user (admin only).
- Permission: Admin only.
- Inputs: `NotificationCreate` body with `user_id`, `title`, `message`, `type`, `link`.
- Outputs: `NotificationResponse`.
- Workflow: Verify user exists -> create notification -> commit -> return.
- Errors: 404 if user not found.
- Manager notes: Types: info, success, warning, error.

#### 8) POST /notifications/broadcast
- Purpose: Send notification to all users or specific role.
- Permission: Admin only.
- Inputs: Form params `title`, `message`, `type`, `link`, `role` (optional).
- Outputs: `BaseResponse` with count of recipients.
- Workflow: Query users (filter by role if provided) -> bulk create notifications -> commit.
- Manager notes: Efficient bulk insert; logs recipient count.

---

## Audit Router (`audit_router.py`) — System Audit Logging

Provides comprehensive audit trails for system actions.

### Roles & permissions (Audit)
- Admins: Full access to all audit logs and statistics.

### Audit Endpoints

#### 1) GET /audit-logs/
- Purpose: Get audit logs with filters.
- Permission: Admin only.
- Inputs: Query params `skip`, `limit`, `user_id`, `action`, `resource_type`, `days`.
- Outputs: Array of `AuditLogResponse`.
- Workflow: Query logs with date range and filters -> order by recent -> paginate -> return.
- Manager notes: Default 30-day range; actions include create, update, delete, login, logout.

#### 2) GET /audit-logs/stats
- Purpose: Get audit statistics.
- Permission: Admin only.
- Inputs: Query param `days` (default 7).
- Outputs: JSON with total actions, actions by type, most active users.
- Workflow: Aggregate counts and user activity over date range.
- Manager notes: Shows top 10 most active users by action count.

#### 3) GET /audit-logs/{log_id}
- Purpose: Get specific audit log.
- Permission: Admin only.
- Inputs: `log_id` path param.
- Outputs: `AuditLogResponse`.
- Workflow: Query log by ID -> return.
- Errors: 404 not found.
- Manager notes: Detailed view of individual actions.

#### 4) GET /audit-logs/user/{user_id}
- Purpose: Get audit logs for specific user.
- Permission: Admin only.
- Inputs: `user_id` path param, query params `skip`, `limit`, `days`.
- Outputs: Array of `AuditLogResponse`.
- Workflow: Query user's logs within date range -> paginate -> return.
- Manager notes: Useful for investigating user activity.

### Helper Function: create_audit_log()
- Purpose: Internal function to log actions.
- Inputs: `db`, `request`, `user_id`, `action`, `resource_type`, `resource_id`, `details`.
- Workflow: Create `AuditLog` record with IP, user agent -> commit.
- Manager notes: Called from other endpoints to track changes; fails silently if logging fails to avoid breaking main operations.

---

## Cross-System Notes

- **Rate Limiting**: Applied to auth endpoints; configurable in settings.
- **Logging**: All routers use logging; audit router provides system-wide activity tracking.
- **Permissions**: Consistent use of `require_admin` and user ownership checks.
- **Error Handling**: Standardized HTTP status codes and error messages.
- **Database**: All operations use SQLAlchemy with proper transactions and rollbacks.

This completes the comprehensive manager guide for all backend routers. The system now has full CRUD operations, authentication, file management, notifications, and audit logging.
