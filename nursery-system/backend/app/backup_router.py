"""
Backup and restore router
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .dependencies import require_admin
from .models import User
from .schemas import BaseResponse
import os
import shutil
import datetime
import zipfile
import sqlite3

router = APIRouter()

BACKUP_DIR = "backups"
DB_PATH = "nursery.db"

# Ensure backup directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

@router.post("/manual")
async def create_manual_backup(
    backup_type: str = "full",  # "full" or "db_only"
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(require_admin)
):
    """Create a manual backup (Admin only)"""
    try:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{backup_type}_backup_{timestamp}"

        if backup_type == "db_only":
            # Database-only backup
            backup_file = os.path.join(BACKUP_DIR, f"{backup_name}.db")
            shutil.copy2(DB_PATH, backup_file)
            file_size = os.path.getsize(backup_file)

            return {
                "message": "Database backup created successfully",
                "backup_file": backup_name + ".db",
                "size_bytes": file_size,
                "type": "db_only",
                "timestamp": timestamp
            }

        elif backup_type == "full":
            # Full backup (DB + files + settings)
            backup_file = os.path.join(BACKUP_DIR, f"{backup_name}.zip")

            with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Add database
                if os.path.exists(DB_PATH):
                    zipf.write(DB_PATH, "nursery.db")

                # Add settings file
                if os.path.exists("app_settings.json"):
                    zipf.write("app_settings.json", "app_settings.json")

                # Add uploads directory if exists
                if os.path.exists("uploads"):
                    for root, dirs, files in os.walk("uploads"):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, ".")
                            zipf.write(file_path, arcname)

            file_size = os.path.getsize(backup_file)

            return {
                "message": "Full backup created successfully",
                "backup_file": backup_name + ".zip",
                "size_bytes": file_size,
                "type": "full",
                "timestamp": timestamp
            }

        else:
            raise HTTPException(status_code=400, detail="Invalid backup type. Use 'full' or 'db_only'")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.get("/list")
async def list_backups(
    current_user: User = Depends(require_admin)
):
    """List all available backups (Admin only)"""
    try:
        backups = []
        for filename in os.listdir(BACKUP_DIR):
            file_path = os.path.join(BACKUP_DIR, filename)
            if os.path.isfile(file_path):
                stat = os.stat(file_path)
                backups.append({
                    "filename": filename,
                    "size_bytes": stat.st_size,
                    "created_at": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "type": "full" if filename.endswith(".zip") else "db_only"
                })

        backups.sort(key=lambda x: x["created_at"], reverse=True)
        return {"backups": backups, "backup_dir": BACKUP_DIR}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

@router.post("/restore")
async def restore_backup(
    backup_filename: str,
    confirm: bool = False,
    current_user: User = Depends(require_admin)
):
    """Restore from a backup (Admin only) - DESTRUCTIVE OPERATION"""
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Restore operation requires confirmation. Set confirm=true"
        )

    try:
        backup_path = os.path.join(BACKUP_DIR, backup_filename)

        if not os.path.exists(backup_path):
            raise HTTPException(status_code=404, detail="Backup file not found")

        # Create a safety backup before restore
        safety_backup = os.path.join(BACKUP_DIR, f"before_restore_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
        shutil.copy2(DB_PATH, safety_backup)

        if backup_filename.endswith(".db"):
            # Restore DB-only backup
            shutil.copy2(backup_path, DB_PATH)
            return {
                "message": "Database restored successfully",
                "restored_from": backup_filename,
                "safety_backup": os.path.basename(safety_backup),
                "warning": "Server restart may be required"
            }

        elif backup_filename.endswith(".zip"):
            # Restore full backup
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                # Extract database
                zipf.extract("nursery.db", ".")

                # Extract settings if exists
                if "app_settings.json" in zipf.namelist():
                    zipf.extract("app_settings.json", ".")

                # Extract uploads if exists
                upload_files = [f for f in zipf.namelist() if f.startswith("uploads/")]
                for file in upload_files:
                    zipf.extract(file, ".")

            return {
                "message": "Full system restored successfully",
                "restored_from": backup_filename,
                "safety_backup": os.path.basename(safety_backup),
                "warning": "Server restart required"
            }

        else:
            raise HTTPException(status_code=400, detail="Invalid backup file format")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@router.delete("/delete/{backup_filename}")
async def delete_backup(
    backup_filename: str,
    current_user: User = Depends(require_admin)
):
    """Delete a backup file (Admin only)"""
    try:
        backup_path = os.path.join(BACKUP_DIR, backup_filename)

        if not os.path.exists(backup_path):
            raise HTTPException(status_code=404, detail="Backup file not found")

        os.remove(backup_path)

        return {
            "message": "Backup deleted successfully",
            "deleted_file": backup_filename
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/stats")
async def get_backup_stats(
    current_user: User = Depends(require_admin)
):
    """Get backup statistics (Admin only)"""
    try:
        backups = []
        total_size = 0

        for filename in os.listdir(BACKUP_DIR):
            file_path = os.path.join(BACKUP_DIR, filename)
            if os.path.isfile(file_path):
                size = os.path.getsize(file_path)
                total_size += size
                backups.append(filename)

        return {
            "total_backups": len(backups),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "backup_dir": BACKUP_DIR,
            "latest_backup": max(backups, key=lambda x: os.path.getmtime(os.path.join(BACKUP_DIR, x))) if backups else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
