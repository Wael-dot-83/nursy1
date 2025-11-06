# 🚀 Quick Testing Guide (PowerShell)

## Prerequisites Check
```powershell
# Check if you're in the right directory
cd d:\nursy

# Verify Python version (should be 3.8+)
python --version

# Verify Node.js version (should be 16+)
node --version
```

---

## 🐍 Backend Testing

### Install Dependencies
```powershell
cd d:\nursy\nursery-system\backend
pip install -r requirements.txt
```

### Run All Tests
```powershell
cd d:\nursy\nursery-system\backend
python -m pytest
```

### Run Tests with Coverage
```powershell
cd d:\nursy\nursery-system\backend
python -m pytest --cov=app --cov-report=html
```

### View Coverage Report
```powershell
# Open htmlcov/index.html in browser
start htmlcov/index.html
```

### Run Specific Test File
```powershell
cd d:\nursy\nursery-system\backend
python -m pytest tests/test_auth.py -v
```

### Run Linting
```powershell
cd d:\nursy\nursery-system\backend
pip install ruff black
ruff check app/
black --check app/
```

---

## ⚛️ Frontend Testing

### Install Dependencies
```powershell
cd d:\nursy\nursery-system\frontend
npm install
```

### Run All Tests
```powershell
cd d:\nursy\nursery-system\frontend
npm run test:run
```

### Run Tests with Coverage
```powershell
cd d:\nursy\nursery-system\frontend
npm run test:run -- --coverage
```

### View Coverage Report
```powershell
# Open coverage/index.html in browser
start coverage/index.html
```

### Run Tests in Watch Mode (for development)
```powershell
cd d:\nursy\nursery-system\frontend
npm run test
```

### Run Linting
```powershell
cd d:\nursy\nursery-system\frontend
npm run lint
```

---

## 🔄 Running the System

### Option 1: All-in-One Runner (Recommended)
```powershell
cd d:\nursy
.\run-all.bat
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd d:\nursy\nursery-system\backend
python run.py
```

**Terminal 2 - Frontend:**
```powershell
cd d:\nursy\nursery-system\frontend
npm run dev
```

---

## 🧪 Test New Features

### Test Password Change Page
1. Start the system (see above)
2. Open browser: http://localhost:5174
3. Login with: `admin@nursery.com` / `Admin123!`
4. Navigate to: http://localhost:5174/change-password
5. Test the password change flow

### Test API Health
```powershell
# Backend health check
curl http://localhost:8002/health
```

---

## 🐛 Troubleshooting

### "Module not found" Error
```powershell
# Make sure you're in the correct directory
cd d:\nursy\nursery-system\backend
pip install -r requirements.txt
```

### "ENOENT: no such file" (npm)
```powershell
# Make sure you're in frontend directory
cd d:\nursy\nursery-system\frontend
npm install
```

### "Import Error: No module named 'app'"
```powershell
# Run pytest from the backend directory
cd d:\nursy\nursery-system\backend
python -m pytest
```

### Tests Failing Due to Missing Dependencies
```powershell
# Backend
cd d:\nursy\nursery-system\backend
pip install pytest pytest-asyncio pytest-cov httpx faker bleach

# Frontend
cd d:\nursy\nursery-system\frontend
npm install dompurify @types/dompurify
```

---

## 📊 Coverage Goals

- **Backend**: 40% minimum (currently 20+ tests)
- **Frontend**: 30% minimum (currently 14+ tests)

### Check Current Coverage
```powershell
# Backend
cd d:\nursy\nursery-system\backend
python -m pytest --cov=app --cov-report=term-missing

# Frontend
cd d:\nursy\nursery-system\frontend
npm run test:run -- --coverage
```

---

## ✅ Verification Checklist

Run these commands to verify everything works:

```powershell
# 1. Backend tests
cd d:\nursy\nursery-system\backend
python -m pytest --cov=app

# 2. Frontend tests (new terminal)
cd d:\nursy\nursery-system\frontend
npm run test:run

# 3. Backend linting
cd d:\nursy\nursery-system\backend
ruff check app/

# 4. Start backend (new terminal)
cd d:\nursy\nursery-system\backend
python run.py

# 5. Start frontend (new terminal)
cd d:\nursy\nursery-system\frontend
npm run dev

# 6. Open browser
start http://localhost:5174
```

---

## 📝 Common Commands Quick Reference

| Task | Backend | Frontend |
|------|---------|----------|
| **Install** | `pip install -r requirements.txt` | `npm install` |
| **Test** | `python -m pytest` | `npm run test:run` |
| **Coverage** | `pytest --cov=app` | `npm run test:run -- --coverage` |
| **Lint** | `ruff check app/` | `npm run lint` |
| **Start** | `python run.py` | `npm run dev` |
| **Build** | N/A | `npm run build` |

---

## 🎯 Next Steps

1. ✅ Install all dependencies (backend + frontend)
2. ✅ Run tests to verify everything works
3. ✅ Check coverage reports
4. ✅ Start the system and test manually
5. 📚 Read [MVP_FIXES_COMPLETE.md](MVP_FIXES_COMPLETE.md) for full documentation

---

**💡 Tip:** Always run commands from the correct directory!
- Backend commands: `d:\nursy\nursery-system\backend`
- Frontend commands: `d:\nursy\nursery-system\frontend`
