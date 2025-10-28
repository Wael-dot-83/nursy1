from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, get_db
from .models import Base
# from .settings import settings
from .auth_router import router as auth_router
from .nursery_router import router as nursery_router
from .user_router import router as user_router
from .children_router import router as children_router
from .attendance_router import router as attendance_router
from .reports_router import router as reports_router
from .admin_router import router as admin_router
from .dependencies import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nursery Management System API",
    description="A comprehensive API for managing nursery operations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(nursery_router, prefix="/admin", tags=["Nurseries"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(children_router, prefix="/children", tags=["Children"])
app.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])

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