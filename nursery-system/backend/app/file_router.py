"""
File upload and download router
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid
from pathlib import Path
from datetime import datetime

from .database import get_db
from .dependencies import get_current_user
from .models import FileAsset, User
from .schemas import FileAssetResponse, BaseResponse
from .settings import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Ensure storage directory exists
STORAGE_DIR = Path(settings.files_base_dir)
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def validate_file_upload(file: UploadFile) -> None:
    """Validate uploaded file"""
    # Check file size
    if file.size and file.size > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.max_file_size / (1024*1024):.1f}MB"
        )

    # Check content type
    if file.content_type not in settings.allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{file.content_type}' is not allowed. Allowed types: {', '.join(settings.allowed_mime_types)}"
        )


def save_upload_file(file: UploadFile, user_id: int) -> dict:
    """Save uploaded file to storage"""
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # Create user-specific directory
        user_dir = STORAGE_DIR / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        file_path = user_dir / unique_filename

        # Save file
        with file_path.open("wb") as buffer:
            content = file.file.read()
            buffer.write(content)

        # Get file size
        file_size = file_path.stat().st_size

        return {
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": str(file_path),
            "file_size": file_size,
            "content_type": file.content_type
        }

    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file"
        )


@router.post("/upload", response_model=FileAssetResponse)
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file

    Allowed file types:
    - Images: JPEG, PNG, GIF, WebP
    - Documents: PDF, Word (.doc, .docx)

    Maximum file size: 10MB
    """
    try:
        # Validate file
        validate_file_upload(file)

        # Save file
        file_data = save_upload_file(file, current_user.id)

        # Create database record
        db_file = FileAsset(
            filename=file_data["filename"],
            original_filename=file_data["original_filename"],
            file_path=file_data["file_path"],
            file_size=file_data["file_size"],
            content_type=file_data["content_type"],
            uploaded_by=current_user.id
        )

        db.add(db_file)
        db.commit()
        db.refresh(db_file)

        logger.info(f"File uploaded successfully: {db_file.id} by user {current_user.id}")

        return FileAssetResponse.from_orm(db_file)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{file_id}", response_model=FileAssetResponse)
async def get_file_info(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information"""
    file_asset = db.query(FileAsset).filter(FileAsset.id == file_id).first()

    if not file_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check permissions (users can only access their own files, admins can access all)
    if current_user.role.value != "admin" and file_asset.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this file"
        )

    return FileAssetResponse.from_orm(file_asset)


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file"""
    file_asset = db.query(FileAsset).filter(FileAsset.id == file_id).first()

    if not file_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check permissions
    if current_user.role.value != "admin" and file_asset.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to download this file"
        )

    # Check if file exists on disk
    file_path = Path(file_asset.file_path)
    if not file_path.exists():
        logger.error(f"File not found on disk: {file_path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )

    return FileResponse(
        path=file_path,
        filename=file_asset.original_filename,
        media_type=file_asset.content_type
    )


@router.delete("/{file_id}", response_model=BaseResponse)
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file"""
    file_asset = db.query(FileAsset).filter(FileAsset.id == file_id).first()

    if not file_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check permissions
    if current_user.role.value != "admin" and file_asset.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this file"
        )

    try:
        # Delete file from disk
        file_path = Path(file_asset.file_path)
        if file_path.exists():
            file_path.unlink()

        # Delete database record
        db.delete(file_asset)
        db.commit()

        logger.info(f"File deleted: {file_id} by user {current_user.id}")

        return BaseResponse(message="File deleted successfully")

    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )


@router.get("/", response_model=List[FileAssetResponse])
async def list_user_files(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List files uploaded by current user (or all files for admins)"""
    query = db.query(FileAsset)

    # Admins can see all files, others only their own
    if current_user.role.value != "admin":
        query = query.filter(FileAsset.uploaded_by == current_user.id)

    files = query.order_by(FileAsset.created_at.desc()).offset(skip).limit(limit).all()

    return [FileAssetResponse.from_orm(f) for f in files]
