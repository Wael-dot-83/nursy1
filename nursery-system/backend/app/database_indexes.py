"""
Additional database indexes for performance optimization
Run this after models are created to add missing indexes
"""
from sqlalchemy import create_index, Index
from .database import engine
from .models import (
    User, Nursery, Branch, Classroom, Child,
    Attendance, DailyReport, FileAsset, Notification, AuditLog
)


def create_additional_indexes():
    """Create additional indexes for performance"""

    # User indexes
    Index('idx_users_email_active', User.email, User.is_active).create(engine, checkfirst=True)
    Index('idx_users_created_at', User.created_at).create(engine, checkfirst=True)

    # Nursery indexes
    Index('idx_nurseries_name', Nursery.name).create(engine, checkfirst=True)
    Index('idx_nurseries_active', Nursery.is_active).create(engine, checkfirst=True)

    # Branch indexes
    Index('idx_branches_nursery', Branch.nursery_id).create(engine, checkfirst=True)

    # Classroom indexes
    Index('idx_classrooms_branch', Classroom.branch_id).create(engine, checkfirst=True)
    Index('idx_classrooms_capacity', Classroom.capacity).create(engine, checkfirst=True)

    # Child indexes
    Index('idx_children_status', Child.status).create(engine, checkfirst=True)
    Index('idx_children_nursery', Child.nursery_id).create(engine, checkfirst=True)
    Index('idx_children_dob', Child.date_of_birth).create(engine, checkfirst=True)
    Index('idx_children_parent_status', Child.parent_id, Child.status).create(engine, checkfirst=True)

    # Attendance indexes
    Index('idx_attendance_date', Attendance.date).create(engine, checkfirst=True)
    Index('idx_attendance_status', Attendance.status).create(engine, checkfirst=True)
    Index('idx_attendance_child_status', Attendance.child_id, Attendance.status).create(engine, checkfirst=True)
    Index('idx_attendance_date_status', Attendance.date, Attendance.status).create(engine, checkfirst=True)

    # Daily Report indexes
    Index('idx_reports_date', DailyReport.date).create(engine, checkfirst=True)
    Index('idx_reports_supervisor', DailyReport.supervisor_id).create(engine, checkfirst=True)

    # FileAsset indexes
    Index('idx_files_uploaded_by', FileAsset.uploaded_by).create(engine, checkfirst=True)
    Index('idx_files_created_at', FileAsset.created_at).create(engine, checkfirst=True)
    Index('idx_files_content_type', FileAsset.content_type).create(engine, checkfirst=True)

    print("✅ Additional indexes created successfully")


if __name__ == "__main__":
    create_additional_indexes()
