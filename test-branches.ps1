# PowerShell script to test branch creation
Write-Host "Testing nursery branch creation..." -ForegroundColor Cyan

cd nursery-system\backend

# Run pytest if available
if (Get-Command pytest -ErrorAction SilentlyContinue) {
    Write-Host "`nRunning unit tests..." -ForegroundColor Cyan
    pytest tests\test_nursery_branches.py -v
} else {
    Write-Host "`nRunning tests with Python..." -ForegroundColor Cyan
    python -m pytest tests\test_nursery_branches.py -v
}

cd ..\..
