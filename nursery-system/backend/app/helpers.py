"""Helper functions for Phase 2 - Supervisor scoping and validations"""
from sqlalchemy.orm import Session
from typing import List
from .models import User, supervisors_classrooms

def get_supervisor_classroom_ids(db: Session, user_id: int) -> List[int]:
    """Get list of classroom IDs assigned to a supervisor"""
    result = db.execute(
        supervisors_classrooms.select().where(
            supervisors_classrooms.c.supervisor_id == user_id
        )
    )
    return [row.classroom_id for row in result]

def validate_child_parent_names(child_second_name: str, child_last_name: str, 
                                  parent_first_name: str, parent_last_name: str) -> tuple[bool, str]:
    """Validate Child.second_name == Parent.first_name and Child.last_name == Parent.last_name"""
    if child_second_name != parent_first_name:
        return False, f"Child's second name must match parent's first name"
    if child_last_name != parent_last_name:
        return False, f"Child's last name must match parent's last name"
    return True, ""

def validate_nationality_id(nationality: str, national_id: str, passport_no: str) -> tuple[bool, str]:
    """Validate nationality-based ID requirements"""
    if nationality == "Jordan":
        if not national_id:
            return False, "National ID is required for Jordanian nationals"
        if passport_no:
            return False, "Passport number must be empty for Jordanian nationals"
    else:
        if not passport_no:
            return False, "Passport number is required for non-Jordanian nationals"
        if national_id:
            return False, "National ID must be empty for non-Jordanian nationals"
    return True, ""
