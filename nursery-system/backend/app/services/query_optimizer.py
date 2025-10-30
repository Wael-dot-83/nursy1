"""
Query optimization utilities to prevent N+1 problems
"""
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional

from ..models import User, Child, Attendance, DailyReport, Nursery, Branch, Classroom


def get_children_with_relationships(
    db: Session,
    filters: Optional[dict] = None
) -> List[Child]:
    """
    Get children with all relationships eagerly loaded
    Prevents N+1 queries when accessing parent, classroom, nursery
    """
    query = db.query(Child).options(
        joinedload(Child.parent),
        joinedload(Child.classroom).joinedload(Classroom.branch),
        joinedload(Child.nursery)
    )

    if filters:
        if 'status' in filters:
            query = query.filter(Child.status == filters['status'])
        if 'nursery_id' in filters:
            query = query.filter(Child.nursery_id == filters['nursery_id'])
        if 'parent_id' in filters:
            query = query.filter(Child.parent_id == filters['parent_id'])

    return query.all()


def get_attendance_with_relationships(
    db: Session,
    filters: Optional[dict] = None
) -> List[Attendance]:
    """
    Get attendance records with child and related data eagerly loaded
    Prevents N+1 when accessing child.parent, child.classroom
    """
    query = db.query(Attendance).options(
        joinedload(Attendance.child)
        .joinedload(Child.parent),
        joinedload(Attendance.child)
        .joinedload(Child.classroom)
        .joinedload(Classroom.branch)
    )

    if filters:
        if 'date' in filters:
            query = query.filter(Attendance.date == filters['date'])
        if 'child_id' in filters:
            query = query.filter(Attendance.child_id == filters['child_id'])
        if 'status' in filters:
            query = query.filter(Attendance.status == filters['status'])

    return query.all()


def get_daily_reports_with_relationships(
    db: Session,
    filters: Optional[dict] = None
) -> List[DailyReport]:
    """
    Get daily reports with child and supervisor eagerly loaded
    """
    query = db.query(DailyReport).options(
        joinedload(DailyReport.child)
        .joinedload(Child.parent),
        joinedload(DailyReport.supervisor)
    )

    if filters:
        if 'date' in filters:
            query = query.filter(DailyReport.date == filters['date'])
        if 'child_id' in filters:
            query = query.filter(DailyReport.child_id == filters['child_id'])
        if 'supervisor_id' in filters:
            query = query.filter(DailyReport.supervisor_id == filters['supervisor_id'])

    return query.all()


def get_users_with_nursery(
    db: Session,
    filters: Optional[dict] = None
) -> List[User]:
    """
    Get users with nursery relationship eagerly loaded
    """
    query = db.query(User).options(
        joinedload(User.nursery)
    )

    if filters:
        if 'role' in filters:
            query = query.filter(User.role == filters['role'])
        if 'nursery_id' in filters:
            query = query.filter(User.nursery_id == filters['nursery_id'])
        if 'is_active' in filters:
            query = query.filter(User.is_active == filters['is_active'])

    return query.all()


def get_nurseries_with_branches(
    db: Session,
    nursery_id: Optional[int] = None
) -> List[Nursery]:
    """
    Get nurseries with branches and classrooms eagerly loaded
    """
    query = db.query(Nursery).options(
        selectinload(Nursery.branches)
        .selectinload(Branch.classrooms)
    )

    if nursery_id:
        query = query.filter(Nursery.id == nursery_id)

    return query.all()


def get_classrooms_with_children_count(db: Session, branch_id: Optional[int] = None):
    """
    Get classrooms with children count
    Uses efficient aggregation instead of loading all children
    """
    from sqlalchemy import func

    query = db.query(
        Classroom,
        func.count(Child.id).label('children_count')
    ).outerjoin(
        Child,
        (Classroom.id == Child.classroom_id) & (Child.status == 'active')
    ).group_by(Classroom.id)

    if branch_id:
        query = query.filter(Classroom.branch_id == branch_id)

    return query.all()
