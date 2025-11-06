# 🚀 Deployment Checklist: Nursery Branches Fix

## Pre-Deployment

### 1. Code Review
- [ ] Review `app/models.py` changes
- [ ] Review `app/nursery_router.py` changes
- [ ] Review `app/schemas.py` changes
- [ ] Review migration script
- [ ] Review test coverage

### 2. Testing
- [ ] Run unit tests: `pytest tests/test_nursery_branches.py -v`
- [ ] Run smoke test: `bash tests/smoke_nursery_branches.sh`
- [ ] Manual test in development environment
- [ ] Verify no regressions in existing features

### 3. Backup
- [ ] Backup production database
- [ ] Backup current backend code
- [ ] Document rollback procedure

## Deployment Steps

### Step 1: Database Migration

#### Development (SQLite)
```bash
cd nursery-system/backend
sqlite3 storage/nursery.db < migrations/004_add_branch_id_to_users.sql
```

#### Production (PostgreSQL)
```bash
# Connect to production server
ssh user@production-server

# Backup database first
pg_dump -U nursery_user nursery_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
psql -U nursery_user -d nursery_db -f migrations/004_add_branch_id_to_users.sql

# Verify migration
psql -U nursery_user -d nursery_db -c "\d users"
# Should show branch_id column
```

**Verification:**
- [ ] Migration completed without errors
- [ ] `branch_id` column exists in `users` table
- [ ] Index `idx_users_branch` created
- [ ] Existing data intact

### Step 2: Deploy Backend Code

#### Option A: Docker
```bash
# Build new image
docker-compose build backend

# Stop old container
docker-compose stop backend

# Start new container
docker-compose up -d backend

# Check logs
docker-compose logs -f backend
```

#### Option B: Direct Deployment
```bash
# Copy files to production
scp app/models.py user@prod:/path/to/app/
scp app/nursery_router.py user@prod:/path/to/app/
scp app/schemas.py user@prod:/path/to/app/

# Restart service
ssh user@prod "systemctl restart nursery-backend"
```

**Verification:**
- [ ] Backend service started successfully
- [ ] No errors in logs
- [ ] Health endpoint responds: `curl http://localhost:8000/health`

### Step 3: Verify Deployment

#### Smoke Test
```bash
# Run automated smoke test
bash tests/smoke_nursery_branches.sh

# Or manual verification
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nursery.local","password":"Admin123!"}'
```

**Verification:**
- [ ] Login works
- [ ] Governorates endpoint works
- [ ] Can create nursery with branches
- [ ] Managers appear in users list
- [ ] Credentials modal displays correctly

### Step 4: Manual Testing

#### Test Case 1: No Branches
- [ ] Login as admin
- [ ] Navigate to "إدارة الحضانات"
- [ ] Click "إضافة حضانة"
- [ ] Fill form, select "لا، الحضانة لها موقع واحد فقط"
- [ ] Submit
- [ ] Verify director credentials shown
- [ ] Verify nursery created
- [ ] Verify director in users list

#### Test Case 2: With Branches
- [ ] Create new nursery
- [ ] Select "نعم، الحضانة لها عدة أفرع"
- [ ] Choose 2 branches
- [ ] Fill branch details
- [ ] Submit
- [ ] Verify 2 manager credentials shown
- [ ] Navigate to users list
- [ ] Verify 2 managers visible
- [ ] Verify each manager has branch association

#### Test Case 3: Governorate
- [ ] Create new nursery
- [ ] Verify governorate dropdown populated
- [ ] Select governorate
- [ ] Submit
- [ ] Verify governorate saved correctly

#### Test Case 4: Validation
- [ ] Try duplicate nursery name → Should fail with 409
- [ ] Try duplicate phone → Should fail with 409
- [ ] Try invalid governorate → Should fail with 400
- [ ] Try invalid phone format → Should fail with validation error

## Post-Deployment

### 1. Monitoring
- [ ] Monitor error logs for 1 hour
- [ ] Check database performance
- [ ] Monitor API response times
- [ ] Check user feedback

### 2. Documentation
- [ ] Update deployment log
- [ ] Update user guide if needed
- [ ] Notify team of deployment
- [ ] Document any issues encountered

### 3. Cleanup
- [ ] Remove old backup files (after 7 days)
- [ ] Archive deployment artifacts
- [ ] Update version number

## Rollback Procedure

If critical issues arise:

### Step 1: Revert Code
```bash
# Restore previous backend code
git checkout HEAD~1 app/models.py app/nursery_router.py app/schemas.py

# Restart service
systemctl restart nursery-backend
```

### Step 2: Rollback Migration (Optional)
```sql
-- Only if necessary
BEGIN TRANSACTION;
DROP INDEX IF EXISTS idx_users_branch;
ALTER TABLE users DROP COLUMN branch_id;
COMMIT;
```

### Step 3: Verify Rollback
- [ ] Backend service running
- [ ] Existing functionality works
- [ ] No errors in logs

## Success Criteria

Deployment is successful when:
- [x] All pre-deployment checks passed
- [x] Migration completed successfully
- [x] Backend deployed without errors
- [x] All smoke tests passed
- [x] Manual testing completed
- [x] No critical errors in logs
- [x] Users can create nurseries with branches
- [x] Managers visible in users list
- [x] No regressions in existing features

## Sign-Off

- [ ] Developer: _________________ Date: _______
- [ ] Reviewer: _________________ Date: _______
- [ ] QA: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______

## Notes

_Add any deployment notes, issues encountered, or special considerations here:_

---

**Deployment Date**: __________  
**Deployed By**: __________  
**Version**: __________  
**Status**: ☐ Success ☐ Partial ☐ Rollback
