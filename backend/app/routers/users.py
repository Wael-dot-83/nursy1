
# ... existing imports
from fastapi import APIRouter, Depends, HTTPException, Request, status
from .. import models, schemas
from ..database import get_db
from sqlalchemy.orm import Session
from ..auth import get_current_user
# Import your audit helpers as per the generated instructions
from .audit_helper import log_update

# ... existing router setup

@router.patch("/{user_id}/toggle-status", response_model=schemas.User)
async def toggle_user_active_status(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Ensure the current user has permission to do this
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot change your own active status."
        )

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_status = db_user.is_active
    new_status = not old_status
    db_user.is_active = new_status

    # Log the update action before committing
    log_update(
        db=db,
        user=current_user,
        resource_type="user",
        resource_id=db_user.id,
        details={"change": f"Toggled active status from {old_status} to {new_status}"},
        request=request
    )

    db.commit()
    db.refresh(db_user)
    return db_user

# ... other user routes
