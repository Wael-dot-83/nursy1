# Zero-Downtime Rollout Strategy
## Nursery Management System v2.0.0

**Migration Type:** Major schema changes with new business logic  
**Downtime Target:** Zero (rolling deployment with backward compatibility)  
**Rollback Strategy:** Complete reversibility at each stage

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Phase 1: Database Migration](#2-phase-1-database-migration)
3. [Phase 2: Gradual Enforcement](#3-phase-2-gradual-enforcement)
4. [Phase 3: Backend Deployment](#4-phase-3-backend-deployment)
5. [Phase 4: Frontend Update](#5-phase-4-frontend-update)
6. [Monitoring & Validation](#6-monitoring--validation)
7. [Rollback Procedures](#7-rollback-procedures)

---

## 1. Pre-Deployment Checklist

### 1.1 Environment Verification

**Production Environment Requirements:**

- [ ] MySQL 8.0+ installed and running
- [ ] Database backup completed (full dump + binary logs enabled)
- [ ] Disk space available (at least 50% free on DB volume)
- [ ] Connection pooling configured (min: 10, max: 50 connections)
- [ ] Read replicas in sync (if applicable)

**Backup Command:**

```bash
# Full database backup
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  nursery_db > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
mysql -u root -p -e "CHECKSUM TABLE nursery_db.*"
```

---

### 1.2 Code Verification

- [ ] All tests passing (60+ tests, 85%+ coverage)
- [ ] Performance tests meet thresholds (dashboard <1s, queries ≤5)
- [ ] Security tests pass (nursery boundaries, RBAC)
- [ ] Migration script tested on staging database
- [ ] Rollback script tested on staging database
- [ ] Code review completed by 2+ developers
- [ ] API documentation updated (OpenAPI schema)

---

### 1.3 Communication Plan

- [ ] Maintenance window scheduled (suggested: 2am-6am local time)
- [ ] Notification sent to all users 48 hours in advance
- [ ] Support team on standby during deployment
- [ ] Rollback decision-maker identified (Tech Lead/CTO)
- [ ] Post-deployment communication template prepared

**Sample Notification:**

```
Subject: System Upgrade - Enhanced Features Coming This Weekend

Dear Nursery Partners,

We're excited to announce a system upgrade on [DATE] from 2:00 AM to 6:00 AM.

New Features:
✅ Enhanced report approval workflow
✅ Automated capacity management
✅ Age-based classroom validation
✅ Improved performance (3x faster dashboards)

Expected Impact: No downtime for end users
Action Required: None - all changes are automatic

Questions? Contact support@nurserysystem.com

Thank you,
The Nursery Management Team
```

---

## 2. Phase 1: Database Migration

**Duration:** 15-30 minutes  
**Downtime:** None (additive changes only)

### 2.1 Add Columns (Nullable, No Defaults)

**Objective:** Add all new columns as NULLABLE to avoid locking tables

**Migration Script Section:** Run `01_Migration.sql` Part 1

```sql
-- Add columns without constraints (NULLABLE)
ALTER TABLE daily_reports
  ADD COLUMN supervisor_id INT NULL AFTER child_id,
  ADD COLUMN status ENUM('draft', 'submitted', 'approved', 'revision_needed') NULL DEFAULT 'draft',
  ADD COLUMN manager_notes TEXT NULL,
  ADD COLUMN reviewed_by INT NULL,
  ADD COLUMN reviewed_at TIMESTAMP NULL;

ALTER TABLE classrooms
  ADD COLUMN supervisor_id INT NULL,
  ADD COLUMN min_age_days INT NULL DEFAULT 0,
  ADD COLUMN max_age_months INT NULL DEFAULT 72,
  ADD COLUMN is_active BOOLEAN NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN branch_id INT NULL,
  ADD COLUMN last_login TIMESTAMP NULL,
  ADD COLUMN temp_password VARCHAR(255) NULL;

ALTER TABLE branches
  ADD COLUMN is_active BOOLEAN NULL DEFAULT TRUE,
  ADD COLUMN max_capacity INT NULL;

ALTER TABLE attendance
  ADD COLUMN notes TEXT NULL;

ALTER TABLE notifications
  ADD COLUMN nursery_id INT NULL,
  ADD COLUMN target_role ENUM('all', 'manager', 'supervisor', 'parent') NULL DEFAULT 'all';
```

**Expected Time:** 5-10 minutes (depending on table sizes)

**Monitoring:**

```sql
-- Check for blocking locks
SELECT * FROM information_schema.innodb_trx;
SELECT * FROM information_schema.processlist WHERE command = 'Query';
```

---

### 2.2 Create Indexes (Non-Blocking)

**Objective:** Add indexes using `ALGORITHM=INPLACE` for online operation

```sql
-- Add indexes with ALGORITHM=INPLACE (MySQL 8.0+)
ALTER TABLE children 
  ADD INDEX idx_children_classroom_status (classroom_id, status) ALGORITHM=INPLACE;

ALTER TABLE daily_reports
  ADD INDEX idx_daily_reports_nursery_date_status (child_id, date, status) ALGORITHM=INPLACE,
  ADD INDEX idx_daily_reports_supervisor_date (supervisor_id, date) ALGORITHM=INPLACE;

ALTER TABLE users
  ADD INDEX idx_users_nursery_role_active (nursery_id, role, is_active) ALGORITHM=INPLACE;

-- Continue for all 15 indexes...
```

**Expected Time:** 10-15 minutes

**Verification:**

```sql
-- Verify indexes created
SHOW INDEX FROM children;
SHOW INDEX FROM daily_reports;
```

---

### 2.3 Backfill Data

**Objective:** Populate new columns with historical data

#### 2.3.1 Backfill `daily_reports.supervisor_id`

**Strategy:** Use audit logs or infer from classroom assignments

```sql
-- Option 1: From audit logs (if available)
UPDATE daily_reports dr
JOIN audit_logs al ON al.table_name = 'daily_reports' AND al.record_id = dr.id
SET dr.supervisor_id = al.user_id
WHERE dr.supervisor_id IS NULL
  AND al.action = 'INSERT';

-- Option 2: Infer from classroom assignment at time of report
UPDATE daily_reports dr
JOIN children c ON dr.child_id = c.id
JOIN classrooms cl ON c.classroom_id = cl.id
SET dr.supervisor_id = cl.supervisor_id
WHERE dr.supervisor_id IS NULL
  AND cl.supervisor_id IS NOT NULL;

-- Option 3: Default to first active supervisor in nursery (fallback)
UPDATE daily_reports dr
JOIN children c ON dr.child_id = c.id
JOIN classrooms cl ON c.classroom_id = cl.id
JOIN branches b ON cl.branch_id = b.id
LEFT JOIN users u ON u.nursery_id = b.nursery_id AND u.role = 'supervisor' AND u.is_active = TRUE
SET dr.supervisor_id = u.id
WHERE dr.supervisor_id IS NULL
LIMIT 1;

-- Verify backfill
SELECT 
  COUNT(*) AS total_reports,
  COUNT(supervisor_id) AS reports_with_supervisor,
  COUNT(*) - COUNT(supervisor_id) AS orphaned_reports
FROM daily_reports;
```

**Expected Orphaned Reports:** <5% (manually review these)

---

#### 2.3.2 Backfill `daily_reports.status`

**Strategy:** Set all existing reports to `'approved'` (assume historical data is approved)

```sql
UPDATE daily_reports
SET status = 'approved'
WHERE status IS NULL;

-- Verify
SELECT status, COUNT(*) FROM daily_reports GROUP BY status;
-- Expected: All rows have status='approved'
```

---

#### 2.3.3 Backfill `classrooms.supervisor_id`

**Strategy:** Use current assignments or leave NULL for manual assignment

```sql
-- If supervisor assignments exist in another table, use that
-- Otherwise, leave NULL for managers to assign manually

UPDATE classrooms
SET supervisor_id = NULL  -- Explicitly NULL, requiring manual assignment
WHERE supervisor_id IS NULL;
```

---

#### 2.3.4 Backfill `users.branch_id`

**Strategy:** Infer from child-classroom-branch relationships

```sql
-- For parents: infer from their children's classroom branches
UPDATE users u
JOIN children c ON c.parent_id = u.id
JOIN classrooms cl ON c.classroom_id = cl.id
SET u.branch_id = cl.branch_id
WHERE u.role = 'parent'
  AND u.branch_id IS NULL
LIMIT 1;  -- Take first branch if child in multiple

-- For supervisors: manually assigned (leave NULL)
-- For managers: NULL (they have access to all branches)
```

---

#### 2.3.5 Backfill `notifications.nursery_id`

**Strategy:** Infer from recipient user's nursery

```sql
UPDATE notifications n
JOIN users u ON n.user_id = u.id
SET n.nursery_id = u.nursery_id
WHERE n.nursery_id IS NULL;

-- Verify
SELECT 
  COUNT(*) AS total_notifications,
  COUNT(nursery_id) AS notifications_with_nursery
FROM notifications;
```

---

### 2.4 Add Foreign Keys

**Objective:** Enforce referential integrity after backfill

```sql
-- Add foreign keys (will fail if orphaned records exist)
ALTER TABLE daily_reports
  ADD CONSTRAINT fk_daily_reports_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_daily_reports_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE classrooms
  ADD CONSTRAINT fk_classrooms_supervisor
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD CONSTRAINT fk_users_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_nursery
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) ON DELETE CASCADE;
```

**Error Handling:**

If foreign key creation fails due to orphaned records:

```sql
-- Find orphaned records
SELECT dr.id, dr.supervisor_id
FROM daily_reports dr
LEFT JOIN users u ON dr.supervisor_id = u.id
WHERE dr.supervisor_id IS NOT NULL AND u.id IS NULL;

-- Fix orphaned records (set to NULL or assign valid supervisor)
UPDATE daily_reports SET supervisor_id = NULL WHERE id IN (...);
```

---

### 2.5 Add NOT NULL Constraints (Gradual)

**Objective:** Make critical columns required after backfill

**WARNING:** This will lock tables briefly. Do during low-traffic window.

```sql
-- Only make columns NOT NULL if 100% populated
ALTER TABLE daily_reports
  MODIFY COLUMN supervisor_id INT NOT NULL,
  MODIFY COLUMN status ENUM('draft', 'submitted', 'approved', 'revision_needed') NOT NULL DEFAULT 'draft';

ALTER TABLE classrooms
  MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Verify no NULL values before making NOT NULL
SELECT COUNT(*) FROM daily_reports WHERE supervisor_id IS NULL;  -- Should be 0
```

---

### 2.6 Create Triggers

**Objective:** Enforce business rules at database level

```sql
-- Create triggers (see 01_Migration.sql for full definitions)
DELIMITER //

CREATE TRIGGER trg_children_before_insert_capacity_check
BEFORE INSERT ON children
FOR EACH ROW
BEGIN
  -- Capacity check logic (see 01_Migration.sql)
END//

CREATE TRIGGER trg_children_before_insert_age_check
BEFORE INSERT ON children
FOR EACH ROW
BEGIN
  -- Age validation logic (see 01_Migration.sql)
END//

DELIMITER ;
```

**Test Triggers:**

```sql
-- Test capacity trigger (should fail)
INSERT INTO children (first_name, last_name, date_of_birth, classroom_id, parent_id, status)
VALUES ('Test', 'Child', '2023-01-01', <full_classroom_id>, 1, 'active');
-- Expected: ERROR 1644 (45000): Classroom capacity exceeded

-- Test age trigger (should fail)
INSERT INTO children (first_name, last_name, date_of_birth, classroom_id, parent_id, status)
VALUES ('Too', 'Young', CURRENT_DATE - INTERVAL 30 DAY, <toddler_classroom_id>, 1, 'active');
-- Expected: ERROR 1644 (45000): Child age does not meet classroom requirements
```

---

### 2.7 Create Stored Procedures

**Objective:** Add analytics procedures for performance

```sql
-- Create stored procedures (see 01_Migration.sql)
DELIMITER //

CREATE PROCEDURE sp_get_classroom_capacity_stats(IN p_nursery_id INT)
BEGIN
  -- Capacity report logic
END//

CREATE PROCEDURE sp_get_supervisor_performance(
  IN p_nursery_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  -- Supervisor metrics logic
END//

DELIMITER ;
```

**Test Procedures:**

```sql
-- Test capacity stats
CALL sp_get_classroom_capacity_stats(1);

-- Test supervisor performance
CALL sp_get_supervisor_performance(1, '2025-10-01', '2025-10-31');
```

---

**Phase 1 Validation:**

```sql
-- Verify all changes applied
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'nursery_db'
  AND TABLE_NAME IN ('daily_reports', 'classrooms', 'users', 'branches', 'attendance', 'notifications')
  AND COLUMN_NAME IN ('supervisor_id', 'status', 'min_age_days', 'branch_id', 'nursery_id')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Expected: All new columns exist with correct types
```

---

## 3. Phase 2: Gradual Enforcement

**Duration:** 1-3 days  
**Objective:** Enable features progressively with monitoring

### 3.1 Day 1: Shadow Mode (Logging Only)

**Backend Configuration:**

```python
# config.py
ENFORCEMENT_MODE = "shadow"  # Logs violations but allows operations

# services/capacity_service.py
def enforce_classroom_capacity(self, classroom, classroom_name):
    if not self.check_classroom_capacity(classroom)["has_space"]:
        if ENFORCEMENT_MODE == "shadow":
            logger.warning(f"SHADOW: Would block enrollment in {classroom_name} (capacity exceeded)")
            # Continue without raising exception
        else:
            raise CapacityExceededError(...)
```

**Monitoring Queries:**

```sql
-- Check for capacity violations
SELECT 
    cl.id,
    cl.name,
    cl.capacity,
    COUNT(c.id) AS current_enrollment
FROM classrooms cl
JOIN children c ON c.classroom_id = cl.id AND c.status = 'active'
GROUP BY cl.id, cl.name, cl.capacity
HAVING COUNT(c.id) > cl.capacity;

-- Expected: 0-5 violations (fix manually)
```

---

### 3.2 Day 2: Soft Enforcement (Warnings)

**Backend Configuration:**

```python
ENFORCEMENT_MODE = "soft"  # Shows warnings to users but allows override

# Router endpoint
@router.post("/children/")
async def create_child(...):
    try:
        capacity_service.enforce_classroom_capacity(classroom)
    except CapacityExceededError as e:
        if ENFORCEMENT_MODE == "soft":
            return JSONResponse(
                status_code=200,  # Success with warning
                content={
                    "warning": str(e),
                    "child": child_data,
                    "message": "Enrollment succeeded but capacity exceeded. Please redistribute children."
                }
            )
        else:
            raise HTTPException(status_code=400, detail=str(e))
```

**User Communication:**

Send email/notification to managers:

```
⚠️ Capacity Alert

The following classrooms are over capacity:
- Toddlers A: 16/15 children (107%)
- Infants B: 9/8 children (113%)

Action Required: Please redistribute children by [DATE] to comply with regulations.
```

---

### 3.3 Day 3: Full Enforcement

**Backend Configuration:**

```python
ENFORCEMENT_MODE = "strict"  # Blocks violations with 400 errors
```

**Expected Behavior:**

- New child enrollments blocked if classroom full
- Age validation rejects children outside range
- Broadcast notifications scoped to nursery only
- Report approval requires manager role

**Monitoring:**

```sql
-- Track blocked operations
SELECT DATE(created_at), error_type, COUNT(*)
FROM audit_logs
WHERE action = 'ERROR'
  AND error_type IN ('CapacityExceeded', 'AgeRequirement', 'NurseryBoundary')
GROUP BY DATE(created_at), error_type;
```

---

## 4. Phase 3: Backend Deployment

**Duration:** 10-15 minutes  
**Downtime:** None (rolling deployment)

### 4.1 Deploy New Backend Code

**Deployment Strategy: Blue-Green**

#### Step 1: Deploy to "Green" Environment

```bash
# SSH to green server
ssh deploy@nursery-backend-green

# Pull latest code
cd /var/www/nursery-backend
git pull origin main

# Install dependencies
pip install -r requirements.txt

# Apply environment variables
export ENFORCEMENT_MODE=strict
export DATABASE_URL=mysql://user:pass@db-server/nursery_db

# Restart application (systemd)
sudo systemctl restart nursery-backend

# Verify health
curl http://localhost:8002/health
# Expected: {"status": "healthy", "database": "connected"}
```

---

#### Step 2: Test Green Environment

```bash
# Run smoke tests
pytest tests/smoke/ -v

# Test critical endpoints
curl -X GET http://localhost:8002/manager/children/my-nursery/ \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Expected: 200 OK with children data
```

---

#### Step 3: Switch Load Balancer

```bash
# Update NGINX or cloud load balancer to route traffic to green
sudo vi /etc/nginx/sites-available/nursery-backend

# Change upstream server
upstream backend {
    server nursery-backend-green:8002;  # Changed from blue
}

# Reload NGINX (no downtime)
sudo nginx -t && sudo nginx -s reload
```

---

#### Step 4: Monitor for Errors

```bash
# Tail logs for errors
tail -f /var/log/nursery-backend/app.log | grep ERROR

# Watch database connections
mysql -e "SHOW PROCESSLIST;"

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8002/manager/dashboard/stats/
```

---

#### Step 5: Decommission Blue (After 24 Hours)

Once confirmed stable:

```bash
# Stop blue environment
ssh deploy@nursery-backend-blue
sudo systemctl stop nursery-backend
```

---

## 5. Phase 4: Frontend Update

**Duration:** 5 minutes  
**Downtime:** None (cached assets)

### 5.1 Deploy Frontend Changes

**Deployment Strategy: CDN Cache Invalidation**

```bash
# Build frontend with new schemas
cd nursery-system/frontend
npm run build

# Upload to CDN/S3
aws s3 sync dist/ s3://nursery-frontend-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Expected: Users get new version on next page load (no hard refresh needed)
```

---

### 5.2 Frontend Changes Checklist

- [ ] Report approval UI shows status badges (draft/submitted/approved)
- [ ] Manager sees "Approve" and "Request Revision" buttons
- [ ] Supervisor sees "Submit" and "Resubmit" buttons
- [ ] Capacity warnings displayed when enrolling children
- [ ] Age validation shows user-friendly error messages
- [ ] Broadcast notifications show target role dropdown

---

## 6. Monitoring & Validation

### 6.1 Key Metrics to Track

**Database Performance:**

```sql
-- Query response times
SELECT 
    DIGEST_TEXT,
    COUNT_STAR AS exec_count,
    AVG_TIMER_WAIT/1000000000 AS avg_ms,
    MAX_TIMER_WAIT/1000000000 AS max_ms
FROM performance_schema.events_statements_summary_by_digest
WHERE DIGEST_TEXT LIKE '%daily_reports%'
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 10;

-- Expected: avg_ms < 100ms for all queries
```

**Application Metrics:**

```python
# Monitor with Prometheus/Datadog
from prometheus_client import Counter, Histogram

capacity_rejections = Counter('capacity_rejections_total', 'Capacity checks that blocked enrollment')
age_rejections = Counter('age_rejections_total', 'Age validations that blocked enrollment')
report_approvals = Counter('report_approvals_total', 'Reports approved by managers')
dashboard_load_time = Histogram('dashboard_load_seconds', 'Manager dashboard load time')
```

**Expected Values (First 24 Hours):**

- Capacity rejections: 0-10 (should be rare if data cleaned in Phase 2)
- Age rejections: 0-5 (should be rare)
- Report approvals: 20-50/day (normal workflow)
- Dashboard load time: p95 < 800ms, p99 < 1.5s

---

### 6.2 Validation Checklist

**Day 1 After Deployment:**

- [ ] No 500 errors in application logs (check Sentry/logs)
- [ ] Database CPU usage stable (<40% baseline)
- [ ] All triggers firing correctly (no constraint violations in logs)
- [ ] Foreign keys enforced (no orphaned records)
- [ ] Dashboard loads in <1 second (p95)
- [ ] Manager can approve reports successfully
- [ ] Supervisor can submit/resubmit reports
- [ ] Capacity enforcement blocks over-enrollment
- [ ] Age validation rejects out-of-range children
- [ ] Broadcast notifications scoped to nursery

---

**Week 1 After Deployment:**

- [ ] 85%+ test coverage maintained
- [ ] Zero data integrity issues reported
- [ ] Average query count per request ≤10
- [ ] No performance degradation (compare to pre-deployment baseline)
- [ ] User feedback collected (5+ manager interviews)
- [ ] Support tickets reviewed (should be <10 related to new features)

---

## 7. Rollback Procedures

### 7.1 Backend Rollback (If Errors Detected)

**Decision Criteria:** Rollback if:
- 5xx error rate >2%
- Dashboard load time p95 >3 seconds
- Database deadlocks occurring
- Critical business operation blocked

**Procedure:**

```bash
# Step 1: Switch load balancer back to blue environment
sudo vi /etc/nginx/sites-available/nursery-backend
# Change upstream to blue
sudo nginx -s reload

# Step 2: Verify blue environment healthy
curl http://nursery-backend-blue:8002/health

# Step 3: Investigate errors on green
ssh deploy@nursery-backend-green
tail -f /var/log/nursery-backend/app.log

# Step 4: Fix issues and re-deploy to green (don't rush)
```

**Expected Time:** 2-5 minutes

---

### 7.2 Database Rollback (If Critical Data Issues)

**Decision Criteria:** Rollback if:
- Foreign key constraints causing data loss
- Triggers blocking critical operations
- Data corruption detected

**Procedure:**

```sql
-- Step 1: Disable triggers immediately
ALTER TABLE children DISABLE TRIGGER trg_children_before_insert_capacity_check;
ALTER TABLE children DISABLE TRIGGER trg_children_before_insert_age_check;

-- Step 2: Drop foreign keys (if causing issues)
ALTER TABLE daily_reports DROP FOREIGN KEY fk_daily_reports_supervisor;
ALTER TABLE daily_reports DROP FOREIGN KEY fk_daily_reports_reviewed_by;

-- Step 3: Remove NOT NULL constraints (make columns optional again)
ALTER TABLE daily_reports
  MODIFY COLUMN supervisor_id INT NULL,
  MODIFY COLUMN status ENUM('draft', 'submitted', 'approved', 'revision_needed') NULL;

-- Step 4: Full rollback (if necessary - use backup)
-- WARNING: This loses all data since migration
mysql -u root -p nursery_db < backup_pre_migration_20251102_020000.sql
```

**Expected Time:** 10-20 minutes

---

### 7.3 Complete Rollback Script

**File:** `01_Migration_ROLLBACK.sql`

```sql
-- EMERGENCY ROLLBACK SCRIPT
-- Run this only if critical issues detected

-- 1. Drop triggers
DROP TRIGGER IF EXISTS trg_children_before_insert_capacity_check;
DROP TRIGGER IF EXISTS trg_children_before_update_capacity_check;
DROP TRIGGER IF EXISTS trg_children_before_insert_age_check;
DROP TRIGGER IF EXISTS trg_children_before_update_age_check;
DROP TRIGGER IF EXISTS trg_daily_reports_before_insert_status;

-- 2. Drop stored procedures
DROP PROCEDURE IF EXISTS sp_get_classroom_capacity_stats;
DROP PROCEDURE IF EXISTS sp_get_supervisor_performance;
DROP PROCEDURE IF EXISTS sp_get_attendance_summary;

-- 3. Drop foreign keys
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_supervisor;
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_reviewed_by;
ALTER TABLE classrooms DROP FOREIGN KEY IF EXISTS fk_classrooms_supervisor;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_branch;
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS fk_notifications_nursery;

-- 4. Drop indexes
ALTER TABLE children DROP INDEX IF EXISTS idx_children_nursery_classroom_status;
ALTER TABLE children DROP INDEX IF EXISTS idx_children_parent_status;
ALTER TABLE children DROP INDEX IF EXISTS idx_children_classroom_status;
ALTER TABLE daily_reports DROP INDEX IF EXISTS idx_daily_reports_nursery_date_status;
ALTER TABLE daily_reports DROP INDEX IF EXISTS idx_daily_reports_supervisor_date;
-- ... (continue for all indexes)

-- 5. Drop new columns (WARNING: Data loss!)
ALTER TABLE daily_reports
  DROP COLUMN supervisor_id,
  DROP COLUMN status,
  DROP COLUMN manager_notes,
  DROP COLUMN reviewed_by,
  DROP COLUMN reviewed_at;

ALTER TABLE classrooms
  DROP COLUMN supervisor_id,
  DROP COLUMN min_age_days,
  DROP COLUMN max_age_months,
  DROP COLUMN is_active;

ALTER TABLE users
  DROP COLUMN branch_id,
  DROP COLUMN last_login,
  DROP COLUMN temp_password;

ALTER TABLE branches
  DROP COLUMN is_active,
  DROP COLUMN max_capacity;

ALTER TABLE attendance
  DROP COLUMN notes;

ALTER TABLE notifications
  DROP COLUMN nursery_id,
  DROP COLUMN target_role;

-- 6. Verify rollback
SELECT 'Rollback complete' AS status;
```

**CRITICAL WARNING:** Running this script will **permanently delete** all data in the new columns. Only use if:
1. Migration caused critical production issues
2. Data can be recovered from backup
3. Authorized by Tech Lead/CTO

---

## 8. Post-Deployment

### 8.1 Success Criteria

**Week 1:**
- ✅ Zero critical bugs reported
- ✅ Dashboard load time <1s (p95)
- ✅ All tests passing (85%+ coverage)
- ✅ <10 support tickets related to new features
- ✅ Positive feedback from 5+ manager users

**Month 1:**
- ✅ 20% reduction in manual data entry (report approval workflow)
- ✅ Zero capacity violations reported
- ✅ Zero age validation issues escalated
- ✅ 50+ reports approved using new workflow
- ✅ Database performance stable (CPU <40%)

---

### 8.2 Lessons Learned Document

**Template:**

```markdown
# Deployment Post-Mortem: v2.0.0 Migration

## What Went Well
- Zero downtime achieved
- All tests passed before deployment
- Backfill completed successfully

## What Could Be Improved
- [List any issues encountered]
- [E.g., "Forgot to test trigger on read replica"]

## Action Items
- [ ] Update deployment checklist with new steps
- [ ] Add missing test cases
- [ ] Document edge cases discovered

## Metrics
- Total deployment time: [X hours]
- Rollbacks required: [0]
- Bugs found in production: [X]
```

---

**Summary:**

✅ **Pre-Deployment:** Backup, tests, communication (1 day)  
✅ **Phase 1 (Database):** Add columns, indexes, triggers (30 min)  
✅ **Phase 2 (Gradual Enforcement):** Shadow → Soft → Strict (3 days)  
✅ **Phase 3 (Backend):** Blue-green deployment (15 min)  
✅ **Phase 4 (Frontend):** CDN update (5 min)  
✅ **Monitoring:** 24/7 for first week  
✅ **Rollback:** Complete script available (<20 min)

**Total Timeline:** 4-5 days (including gradual enforcement)  
**User-Facing Downtime:** Zero  
**Risk Level:** Low (fully reversible at each stage)

**Status:** Production Ready  
**Version:** 2.0.0  
**Last Updated:** 2025-11-02
