# PHASE 2 EXECUTION PLAN - 5 Critical Gaps

**Branch**: `feat/comprehensive-rbac-pg-migration`
**Estimated Time**: 8-10 hours
**Status**: IN PROGRESS

---

## Gap 1: Database Schema Updates (2 hours)

### 1.1 Add Missing Tables
- [x] `supervisors_classrooms` join table (supervisor_id, classroom_id)

### 1.2 Add Missing Child Fields
- [x] `second_name` VARCHAR(50) - for Parent.First validation
- [x] `nationality` VARCHAR(100) - for ID validation logic
- [x] `national_id` VARCHAR(50) - for Jordanian nationals
- [x] `passport_no` VARCHAR(50) - for non-Jordanians

### 1.3 Add Missing DailyReport Fields
- [x] `status` ENUM('pending', 'approved', 'revision') DEFAULT 'pending'
- [x] `manager_feedback` TEXT - for revision comments

### 1.4 Add Missing User Fields
- [x] `username` VARCHAR(100) UNIQUE - for login (phone or email)

---

## Gap 2: Supervisor Scoping Fix (1 hour)

### 2.1 Create Helper Function
- [ ] `get_supervisor_classroom_ids(db, user_id)` → List[int]

### 2.2 Update Endpoints
- [ ] `children_router.py`: GET /my-children/ - filter by classroom_ids
- [ ] `attendance_router.py`: check-in/check-out - validate classroom_ids
- [ ] `reports_router.py`: GET /my-nursery/, POST /child/{id} - filter by classroom_ids

---

## Gap 3: Manager CRUD Endpoints (2 hours)

### 3.1 Children Router
- [ ] POST /manager/children - create child (scoped to nursery)
- [ ] PUT /manager/children/{id} - update child (scoped to nursery)
- [ ] DELETE /manager/children/{id} - delete child (scoped to nursery)

### 3.2 Attendance Router
- [ ] POST /manager/attendance - create attendance (scoped to nursery)
- [ ] PUT /manager/attendance/{id} - update attendance (scoped to nursery)
- [ ] DELETE /manager/attendance/{id} - delete attendance (scoped to nursery)

### 3.3 Reports Router (Moderation)
- [ ] PUT /manager/reports/{id}/approve - approve report
- [ ] PUT /manager/reports/{id}/request-revision - request changes
- [ ] GET /manager/reports/pending - list pending reports

---

## Gap 4: Validation Rules (2 hours)

### 4.1 Child Name Validation
- [ ] Pydantic validator: `Child.second_name == Parent.first_name`
- [ ] Pydantic validator: `Child.last_name == Parent.last_name`

### 4.2 Nationality-Based ID Validation
- [ ] If `nationality == "Jordan"` → require `national_id`, `passport_no` must be None
- [ ] If `nationality != "Jordan"` → require `passport_no`, `national_id` must be None

### 4.3 Uniqueness Validation
- [ ] `User.phone` unique constraint (already exists, verify)
- [ ] `User.username` unique constraint (add)
- [ ] `User.email` unique constraint (already exists, verify)

---

## Gap 5: Audit Logging (1 hour)

### 5.1 Add Audit to Manager Endpoints
- [ ] Children CRUD: log_create, log_update, log_delete
- [ ] Attendance CRUD: log_create, log_update, log_delete
- [ ] Report moderation: log_update with status change

### 5.2 Add Audit to Supervisor Endpoints
- [ ] Check-in/out: log_create or log_update
- [ ] Report creation: log_create

### 5.3 Add Audit to Parent Endpoints
- [ ] View children: log_read (optional, high volume)
- [ ] View reports: log_read (optional, high volume)

---

## Testing (2 hours)

### Unit Tests
- [ ] Validator tests (Child name, nationality ID)
- [ ] Helper function tests (get_supervisor_classroom_ids)

### Integration Tests
- [ ] Supervisor scoping tests (can only access assigned classrooms)
- [ ] Manager CRUD tests (can only modify nursery data)
- [ ] Validation tests (reject invalid Child data)

### E2E Tests
- [ ] Manager workflow: create child → assign classroom → approve report
- [ ] Supervisor workflow: check-in child → create report → manager approves

---

## Deployment Checklist

- [ ] Run migration script
- [ ] Verify schema changes
- [ ] Seed supervisors_classrooms data (if needed)
- [ ] Update API documentation
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] Smoke test all roles
- [ ] Deploy to production

---

## Current Progress

**Step 1**: Creating database migration ✅ IN PROGRESS
