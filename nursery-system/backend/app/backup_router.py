"""
Backup and restore router
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .dependencies import require_admin
from .models import User
from .schemas import BaseResponse
from .audit_helper import log_create, log_delete, log_audit
import os
import shutil
import datetime
import zipfile
import sqlite3
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

BACKUP_DIR = "backups"
DB_PATH = "nursery.db"

# Ensure backup directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

@router.post("/manual")
async def create_manual_backup(
    backup_type: str = "full",  # "full" or "db_only"
    request: Request = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a manual backup (Admin only)"""
    try:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{backup_type}_backup_{timestamp}"

        if backup_type == "db_only":
            backup_file = os.path.join(BACKUP_DIR, f"{backup_name}.db")
            shutil.copy2(DB_PATH, backup_file)
            file_size = os.path.getsize(backup_file)
            details = {
                "type": "db_only",
                "filename": backup_name + ".db",
                "size_bytes": file_size,
            }
            log_create(db, current_user, "backup", None, details=details, request=request)
            db.commit()
            logger.info("Database backup created", extra=details)
            return {
                "message": "Database backup created successfully",
                "backup_file": details["filename"],
                "size_bytes": file_size,
                "type": "db_only",
                "timestamp": timestamp,
            }

        if backup_type == "full":
            backup_file = os.path.join(BACKUP_DIR, f"{backup_name}.zip")
            with zipfile.ZipFile(backup_file, "w", zipfile.ZIP_DEFLATED) as zipf:
                if os.path.exists(DB_PATH):
                    zipf.write(DB_PATH, "nursery.db")

                if os.path.exists("app_settings.json"):
                    zipf.write("app_settings.json", "app_settings.json")

                if os.path.exists("uploads"):
                    for root, _, files in os.walk("uploads"):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, ".")
                            zipf.write(file_path, arcname)

            file_size = os.path.getsize(backup_file)
            details = {
                "type": "full",
                "filename": backup_name + ".zip",
                "size_bytes": file_size,
            }
            log_create(db, current_user, "backup", None, details=details, request=request)
            db.commit()
            logger.info("Full backup created", extra=details)
            return {
                "message": "Full backup created successfully",
                "backup_file": details["filename"],
                "size_bytes": file_size,
                "type": "full",
                "timestamp": timestamp,
            }

        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_BACKUP_TYPE",
                "message": "Invalid backup type. Use 'full' or 'db_only'",
            },
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Backup creation failed")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "BACKUP_CREATION_FAILED",
                "message": "Backup creation failed",
            },
        )

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

    except Exception:
        logger.exception("Failed to list backups")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "BACKUP_LIST_FAILED",
                "message": "Failed to list backups",
            },
        )

@router.post("/restore")
async def restore_backup(
    backup_filename: str,
    confirm: bool = False,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Restore from a backup (Admin only) - DESTRUCTIVE OPERATION"""
    if not confirm:
        logger.warning("Restore requested without confirmation")
        raise HTTPException(
            status_code=400,
            detail={
                "code": "RESTORE_NOT_CONFIRMED",
                "message": "Restore operation requires confirmation. Set confirm=true",
            },
        )

    try:
        backup_path = os.path.join(BACKUP_DIR, backup_filename)

        if not os.path.exists(backup_path):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "BACKUP_NOT_FOUND",
                    "message": "Backup file not found",
                },
            )

        # Create a safety backup before restore
        safety_backup = os.path.join(BACKUP_DIR, f"before_restore_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
        shutil.copy2(DB_PATH, safety_backup)

        if backup_filename.endswith(".db"):
            # Restore DB-only backup
            shutil.copy2(backup_path, DB_PATH)

            # Log the restore operation
            log_audit(
                db, current_user, "restore", "backup", None,
                details={"filename": backup_filename, "type": "db_only", "safety_backup": os.path.basename(safety_backup)},
                request=request
            )
            db.commit()

            response = {
                "message": "Database restored successfully",
                "restored_from": backup_filename,
                "safety_backup": os.path.basename(safety_backup),
                "warning": "Server restart may be required"
            }
            logger.info("Database backup restored", extra={"filename": backup_filename})
            return response

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

            # Log the restore operation
            log_audit(
                db, current_user, "restore", "backup", None,
                details={"filename": backup_filename, "type": "full", "safety_backup": os.path.basename(safety_backup)},
                request=request
            )
            db.commit()

            response = {
                "message": "Full system restored successfully",
                "restored_from": backup_filename,
                "safety_backup": os.path.basename(safety_backup),
                "warning": "Server restart required"
            }
            logger.info("Full backup restored", extra={"filename": backup_filename})
            return response

        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_BACKUP_FILE",
                "message": "Invalid backup file format",
            },
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Backup restore failed")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "BACKUP_RESTORE_FAILED",
                "message": "Backup restore failed",
            },
        )

@router.delete("/delete/{backup_filename}")
async def delete_backup(
    backup_filename: str,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a backup file (Admin only)"""
    try:
        backup_path = os.path.join(BACKUP_DIR, backup_filename)

        if not os.path.exists(backup_path):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "BACKUP_NOT_FOUND",
                    "message": "Backup file not found",
                },
            )

        file_size = os.path.getsize(backup_path)
        os.remove(backup_path)

        # Log the backup deletion
        log_delete(
            db, current_user, "backup", None,
            details={"filename": backup_filename, "size_bytes": file_size},
            request=request
        )
        db.commit()

        logger.info("Backup deleted", extra={"filename": backup_filename, "size_bytes": file_size})
        return {
            "message": "Backup deleted successfully",
            "deleted_file": backup_filename
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to delete backup")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "BACKUP_DELETE_FAILED",
                "message": "Failed to delete backup",
            },
        )

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

        latest_backup = (
            max(backups, key=lambda x: os.path.getmtime(os.path.join(BACKUP_DIR, x)))
            if backups
            else None
        )
        return {
            "total_backups": len(backups),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "backup_dir": BACKUP_DIR,
            "latest_backup": latest_backup,
        }

    except Exception:
        logger.exception("Failed to compute backup statistics")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "BACKUP_STATS_FAILED",
                "message": "Failed to compute backup statistics",
            },
        )
