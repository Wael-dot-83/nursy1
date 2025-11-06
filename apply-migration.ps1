# PowerShell script to apply migration on Windows
Write-Host "Applying branch_id migration..." -ForegroundColor Cyan

$dbPath = "nursery-system\backend\storage\nursery.db"
$migrationPath = "nursery-system\backend\migrations\004_add_branch_id_to_users.sql"

if (-not (Test-Path $dbPath)) {
    Write-Host "Error: Database not found at $dbPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $migrationPath)) {
    Write-Host "Error: Migration file not found at $migrationPath" -ForegroundColor Red
    exit 1
}

# Apply migration
Get-Content $migrationPath | sqlite3 $dbPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Migration applied successfully!" -ForegroundColor Green
    
    # Verify
    Write-Host "`nVerifying migration..." -ForegroundColor Cyan
    $result = sqlite3 $dbPath "PRAGMA table_info(users);" | Select-String "branch_id"
    
    if ($result) {
        Write-Host "✓ branch_id column exists" -ForegroundColor Green
    } else {
        Write-Host "✗ branch_id column not found" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Migration failed" -ForegroundColor Red
    exit 1
}
