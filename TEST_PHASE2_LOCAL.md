# Phase 2 Local Testing Guide

## Quick Start (5 minutes)

### 1. Start Backend
```bash
cd d:\nursy\nursery-system\backend
python run.py
```

### 2. Start Frontend (new terminal)
```bash
cd d:\nursy\nursery-system\frontend
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Test Scenarios

### Scenario 1: Supervisor Scoping (10 min)

**Login as Supervisor**:
- Email: `supervisor@nursery.com`
- Password: `Supervisor123!`

**Test**:
1. Go to "My Children" page
2. **Expected**: Should only see children in assigned classrooms (not all nursery children)
3. Try to check-in a child
4. **Expected**: Should only work for children in assigned classrooms

**API Test**:
```bash
# Get supervisor token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supervisor@nursery.com","password":"Supervisor123!"}'

# Get supervisor's children (should be filtered by classrooms)
curl -X GET http://localhost:8000/api/children/my-children/ \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Scenario 2: Manager CRUD - Children (15 min)

**Login as Manager**:
- Email: `manager@nursery.com`
- Password: `Manager123!`

**Test Create Child**:
```bash
# Get manager token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@nursery.com","password":"Manager123!"}'

# Create child (should validate names and nationality)
curl -X POST http://localhost:8000/api/children/manager/children \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "second_name": "Mohammad",
    "last_name": "Ali",
    "date_of_birth": "2020-01-15",
    "gender": "male",
    "nationality": "Jordan",
    "national_id": "1234567890",
    "emergency_contact": "Mother",
    "emergency_phone": "0791234567",
    "classroom_id": 1,
    "parent_id": 4
  }'
```

**Expected**: Should succeed if parent's first_name is "Mohammad" and last_name is "Ali"

**Test Validation Failure**:
```bash
# Try with wrong second_name (should fail)
curl -X POST http://localhost:8000/api/children/manager/children \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "second_name": "WrongName",
    "last_name": "Ali",
    "date_of_birth": "2020-01-15",
    "gender": "male",
    "nationality": "Jordan",
    "national_id": "1234567890",
    "emergency_contact": "Mother",
    "emergency_phone": "0791234567",
    "classroom_id": 1,
    "parent_id": 4
  }'
```

**Expected**: Should fail with "Child's second name must match parent's first name"

**Test Nationality Validation**:
```bash
# Try Jordan with passport (should fail)
curl -X POST http://localhost:8000/api/children/manager/children \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "second_name": "Mohammad",
    "last_name": "Ali",
    "date_of_birth": "2020-01-15",
    "gender": "male",
    "nationality": "Jordan",
    "passport_no": "P123456",
    "emergency_contact": "Mother",
    "emergency_phone": "0791234567",
    "classroom_id": 1,
    "parent_id": 4
  }'
```

**Expected**: Should fail with "Passport number must be empty for Jordanian nationals"

---

### Scenario 3: Manager CRUD - Attendance (10 min)

**Test Create Attendance**:
```bash
curl -X POST http://localhost:8000/api/attendance/manager/attendance \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "date": "2024-01-15",
    "status": "present"
  }'
```

**Test Update Attendance**:
```bash
curl -X PUT http://localhost:8000/api/attendance/manager/attendance/1 \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "late"
  }'
```

**Test Delete Attendance**:
```bash
curl -X DELETE http://localhost:8000/api/attendance/manager/attendance/1 \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

---

### Scenario 4: Manager Report Moderation (15 min)

**Test Get Pending Reports**:
```bash
curl -X GET http://localhost:8000/api/reports/manager/reports/pending \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**Test Approve Report**:
```bash
curl -X PUT http://localhost:8000/api/reports/manager/reports/1/approve \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**Test Request Revision**:
```bash
curl -X PUT "http://localhost:8000/api/reports/manager/reports/2/request-revision?feedback=Please%20add%20more%20details%20about%20lunch" \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

---

### Scenario 5: Audit Logging (5 min)

**Check Audit Logs** (Admin only):
```bash
# Login as admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nursery.com","password":"Admin123!"}'

# Get audit logs
curl -X GET http://localhost:8000/api/audit-logs \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected**: Should see logs for all Manager/Supervisor actions (create child, check-in, approve report, etc.)

---

## Quick Test Script

Save as `test_phase2.ps1`:

```powershell
# Test Phase 2 Endpoints

$baseUrl = "http://localhost:8000/api"

# 1. Login as Manager
Write-Host "1. Login as Manager..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
    email = "manager@nursery.com"
    password = "Manager123!"
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginResponse.access_token
Write-Host "Token: $token" -ForegroundColor Green

# 2. Test Manager Create Child (should validate)
Write-Host "`n2. Test Manager Create Child..." -ForegroundColor Cyan
try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/children/manager/children" -Method Post `
        -Headers @{Authorization = "Bearer $token"} `
        -Body (@{
            first_name = "Test"
            second_name = "Manager"
            last_name = "Child"
            date_of_birth = "2020-01-15"
            gender = "male"
            nationality = "Jordan"
            national_id = "9999999999"
            emergency_contact = "Mother"
            emergency_phone = "0791234567"
            classroom_id = 1
            parent_id = 4
        } | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "Child created: $($createResponse.id)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test Get Pending Reports
Write-Host "`n3. Test Get Pending Reports..." -ForegroundColor Cyan
try {
    $reportsResponse = Invoke-RestMethod -Uri "$baseUrl/reports/manager/reports/pending" `
        -Headers @{Authorization = "Bearer $token"}
    
    Write-Host "Pending reports: $($reportsResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Login as Supervisor
Write-Host "`n4. Login as Supervisor..." -ForegroundColor Cyan
$supervisorLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
    email = "supervisor@nursery.com"
    password = "Supervisor123!"
} | ConvertTo-Json) -ContentType "application/json"

$supervisorToken = $supervisorLogin.access_token

# 5. Test Supervisor Get Children (should be scoped)
Write-Host "`n5. Test Supervisor Get Children (scoped)..." -ForegroundColor Cyan
try {
    $childrenResponse = Invoke-RestMethod -Uri "$baseUrl/children/my-children/" `
        -Headers @{Authorization = "Bearer $supervisorToken"}
    
    Write-Host "Children in assigned classrooms: $($childrenResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTests complete!" -ForegroundColor Green
```

Run with:
```powershell
.\test_phase2.ps1
```

---

## Expected Results

### ✅ Pass Criteria
- Supervisor only sees children in assigned classrooms
- Manager can create/update/delete children with validation
- Manager can create/update/delete attendance
- Manager can approve/request-revision on reports
- Child name validation works (second_name == parent.first_name)
- Nationality validation works (Jordan → national_id, else → passport_no)
- All actions are logged in audit_logs table

### ❌ Fail Criteria
- Supervisor sees all nursery children (not scoped)
- Manager can create child with wrong parent names
- Manager can create Jordanian child with passport_no
- No audit logs for Manager/Supervisor actions

---

## Troubleshooting

### Backend won't start
```bash
cd d:\nursy\nursery-system\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Migration not applied
```bash
cd d:\nursy\nursery-system\backend
python run_migration.py
```

### Import errors
```bash
# Check if helpers.py exists
ls app/helpers.py

# Check if models.py has ReportStatus
grep "ReportStatus" app/models.py
```

### Database issues
```bash
# Backup database
copy nursery.db nursery.db.backup

# Re-run migration
python run_migration.py
```

---

## Next Steps After Testing

1. ✅ All tests pass → Create PR
2. ❌ Tests fail → Fix issues, commit, push
3. Document any bugs found
4. Update test cases if needed
