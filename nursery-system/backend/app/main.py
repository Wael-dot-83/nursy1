from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi.errors import RateLimitExceeded
from .database import engine, get_db
from .models import Base
from .settings import settings
from .middleware.rate_limiter import limiter, rate_limit_exceeded_handler
from .auth_router import router as auth_router
from .nursery_router import router as nursery_router
from .user_router import router as user_router
from .children_router import router as children_router
from .attendance_router import router as attendance_router
from .reports_router import router as reports_router
from .admin_router import router as admin_router
from .file_router import router as file_router
from .notification_router import router as notification_router
from .audit_router import router as audit_router
from .settings_router import router as settings_router
from .backup_router import router as backup_router
from .dependencies import get_current_user
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create database tables
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nursery Management System API",
    description="A comprehensive API for managing nursery operations",
    version=settings.version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    debug=settings.debug
)

print("FastAPI app created successfully")

# Add rate limiter to app state
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

print("Adding CORS middleware...")
# CORS - Use settings instead of allowing all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Temporarily restrict to frontend only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

print("Including routers...")
# Include routers
try:
    app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    print("[OK] Auth router included")
    app.include_router(nursery_router, prefix="/admin", tags=["Nurseries"])
    print("[OK] Nursery router included")
    app.include_router(user_router, prefix="/admin/users", tags=["Users"])
    print("[OK] User router included")
    app.include_router(children_router, prefix="/children", tags=["Children"])
    print("[OK] Children router included")
    app.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
    print("[OK] Attendance router included")
    app.include_router(reports_router, prefix="/reports", tags=["Reports"])
    print("[OK] Reports router included")
    app.include_router(admin_router, prefix="/system", tags=["Admin"])
    print("[OK] Admin router included")
    app.include_router(file_router, prefix="/files", tags=["Files"])
    print("[OK] File router included")
    app.include_router(notification_router, prefix="/notifications", tags=["Notifications"])
    print("[OK] Notification router included")
    app.include_router(audit_router, prefix="/audit-logs", tags=["Audit Logs"])
    print("[OK] Audit router included")
    app.include_router(settings_router, prefix="/admin/settings", tags=["Settings"])
    print("[OK] Settings router included")
    app.include_router(backup_router, prefix="/admin/backup", tags=["Backup"])
    print("[OK] Backup router included")
    print("[SUCCESS] All routers included successfully")
except Exception as e:
    print(f"[ERROR] Error including routers: {e}")
    import traceback
    traceback.print_exc()

@app.get("/")
async def root():
    return {"message": "Nursery Management System API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/protected")
async def protected_route():
    return {"message": "This should work without auth"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )