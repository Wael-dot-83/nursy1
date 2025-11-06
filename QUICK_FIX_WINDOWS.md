# 🚀 Quick Fix for Windows

## One Command to Apply Everything

```cmd
apply-migration.bat
```

That's it! The migration is applied.

## What This Does

- Adds `branch_id` column to users table
- Allows managers to be linked to specific branches
- Fixes nursery creation with branches

## Verify It Worked

```cmd
sqlite3 nursery-system\backend\storage\nursery.db "SELECT name FROM sqlite_master WHERE type='table';"
```

Should show all tables including `users` and `branches`.

## Test It

1. **Start your backend** (if not running):
   ```cmd
   cd nursery-system\backend
   python run.py
   ```

2. **Open frontend**: http://localhost:5174/login

3. **Login as admin**:
   - Email: `admin@nursery.local`
   - Password: `Admin123!`

4. **Create a nursery with branches**:
   - Go to "إدارة الحضانات"
   - Click "إضافة حضانة"
   - Fill in details
   - Select "نعم، الحضانة لها عدة أفرع"
   - Choose 2 branches
   - Submit

5. **Verify managers appear**:
   - Go to "إدارة المستخدمين"
   - You should see 2 new manager accounts

## Troubleshooting

### "sqlite3 is not recognized"

Install SQLite:
1. Download from https://www.sqlite.org/download.html
2. Extract to `C:\sqlite`
3. Add `C:\sqlite` to PATH

Or use Chocolatey:
```cmd
choco install sqlite
```

### Backend not running

Start it:
```cmd
cd nursery-system\backend
python run.py
```

Or use the all-in-one runner:
```cmd
run-all.bat
```

## Done! 🎉

The fix is applied. Your nursery creation with branches should now work perfectly!

## What Changed?

- ✅ Backend can now create branches
- ✅ Managers are linked to their branches
- ✅ Governorate dropdown works
- ✅ No duplicates allowed
- ✅ Everything appears immediately in users list

**No frontend changes needed** - it already works!
