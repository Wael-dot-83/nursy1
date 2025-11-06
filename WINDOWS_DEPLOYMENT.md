# 🪟 Windows Deployment Guide

## Quick Start (PowerShell)

### 1. Apply Migration

```powershell
# Run the migration script
.\apply-migration.ps1
```

Or manually:

```powershell
Get-Content nursery-system\backend\migrations\004_add_branch_id_to_users.sql | sqlite3 nursery-system\backend\storage\nursery.db
```

### 2. Run Tests

```powershell
# Run the test script
.\test-branches.ps1
```

Or manually:

```powershell
cd nursery-system\backend
python -m pytest tests\test_nursery_branches.py -v
cd ..\..
```

### 3. Restart Backend

```powershell
# If using run-all.bat
# Just restart it - it will pick up the changes

# Or if running manually
cd nursery-system\backend
python run.py
```

## Verification

### Check Migration Applied

```powershell
sqlite3 nursery-system\backend\storage\nursery.db "PRAGMA table_info(users);" | Select-String "branch_id"
```

Should show: `branch_id` column

### Test API Manually

```powershell
# 1. Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8002/auth/login" -Method Post -Body (@{email="admin@nursery.local";password="Admin123!"} | ConvertTo-Json) -ContentType "application/json"
$token = $loginResponse.access_token

# 2. Get governorates
Invoke-RestMethod -Uri "http://localhost:8002/admin/settings/governorates" -Headers @{Authorization="Bearer $token"}

# 3. Create nursery with branches
$nurseryData = @{
    name = "Test Nursery"
    mainPhone = "0791234567"
    governorateId = 1
    city = "Amman"
    minAgeDays = 70
    maxAgeMonths = 52
    hasBranches = $true
    numberOfBranches = 2
    branches = @(
        @{name="فرع 1"; phone="0792345678"},
        @{name="فرع 2"; phone="0793456789"}
    )
    branchManagersEnabled = $true
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:8002/admin/nurseries" -Method Post -Headers @{Authorization="Bearer $token"} -Body $nurseryData -ContentType "application/json"

# Check result
$result | ConvertTo-Json -Depth 10

# 4. Verify managers in users list
$users = Invoke-RestMethod -Uri "http://localhost:8002/admin/users" -Headers @{Authorization="Bearer $token"}
$users.data | Where-Object {$_.role -eq "manager"} | Select-Object email, role
```

## Troubleshooting

### sqlite3 not found

Install SQLite:
```powershell
# Using Chocolatey
choco install sqlite

# Or download from https://www.sqlite.org/download.html
```

### pytest not found

Install pytest:
```powershell
cd nursery-system\backend
pip install pytest
```

### Backend not running

Start backend:
```powershell
cd nursery-system\backend
python run.py
```

Or use the all-in-one runner:
```powershell
.\run-all.bat
```

## Success Criteria

✅ Migration applied (branch_id column exists)  
✅ Tests pass (if pytest available)  
✅ Backend starts without errors  
✅ Can create nursery with branches via UI  
✅ Managers appear in users list  

## Next Steps

1. Open http://localhost:5174/login
2. Login as admin (admin@nursery.local / Admin123!)
3. Go to "إدارة الحضانات"
4. Click "إضافة حضانة"
5. Test creating nursery with branches
6. Verify managers appear in "إدارة المستخدمين"

Done! 🎉
