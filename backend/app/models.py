from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Date, DateTime, Boolean, Text, JSON, DECIMAL, SmallInteger, Index
from datetime import datetime
import enum

Base = declarative_base()

# Enums
class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SUPERVISOR = "supervisor"
    PARENT = "parent"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"

class ChildStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    GRADUATED = "graduated"

# Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(150), nullable=True, unique=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(15), nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    temp_password = Column(String(255), nullable=True)  # Temporary password for display/management
    nursery_id = Column(Integer, ForeignKey("nurseries.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    nursery = relationship("Nursery", back_populates="users")
    children = relationship("Child", back_populates="parent")
    notifications = relationship("Notification", back_populates="user", lazy="dynamic")

    __table_args__ = (
        Index('idx_users_role', 'role'),
        Index('idx_users_nursery', 'nursery_id'),
    )

class Nursery(Base):
    __tablename__ = "nurseries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    main_street = Column(String(200), nullable=True)
    main_city = Column(String(100), nullable=True)
    main_governorate = Column(String(50), nullable=True)
    main_postal_code = Column(String(10), nullable=True)
    main_phone = Column(String(15), nullable=False)
    email = Column(String(150), nullable=True)
    min_age_days = Column(Integer, default=70)  # Default 70 days
    max_age_months = Column(Integer, default=52)  # Default 52 months
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="nursery")
    branches = relationship("Branch", back_populates="nursery")
    children = relationship("Child", back_populates="nursery")

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nursery_id = Column(Integer, ForeignKey("nurseries.id"), nullable=False)
    name = Column(String(100), nullable=False)
    address_street = Column(String(200), nullable=True)
    address_city = Column(String(100), nullable=True)
    address_governorate = Column(String(50), nullable=True)
    address_postal_code = Column(String(10), nullable=True)
    phone = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    nursery = relationship("Nursery", back_populates="branches")
    classrooms = relationship("Classroom", back_populates="branch")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    name = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branch = relationship("Branch", back_populates="classrooms")
    children = relationship("Child", back_populates="classroom")

class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)
    medical_info = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=False)
    emergency_phone = Column(String(15), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nursery_id = Column(Integer, ForeignKey("nurseries.id"), nullable=True)
    status = Column(Enum(ChildStatus), default=ChildStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = relationship("User", back_populates="children")
    classroom = relationship("Classroom", back_populates="children")
    nursery = relationship("Nursery", back_populates="children")
    attendance_records = relationship("Attendance", back_populates="child")
    daily_reports = relationship("DailyReport", back_populates="child")

    __table_args__ = (
        Index('idx_children_parent', 'parent_id'),
        Index('idx_children_classroom', 'classroom_id'),
    )

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    date = Column(Date, nullable=False)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    status = Column(Enum(AttendanceStatus), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    child = relationship("Child", back_populates="attendance_records")

    __table_args__ = (
        Index('idx_attendance_child_date', 'child_id', 'date'),
    )

class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    date = Column(Date, nullable=False)
    activities = Column(Text, nullable=True)
    meals = Column(Text, nullable=True)
    naps = Column(Text, nullable=True)
    mood = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    child = relationship("Child", back_populates="daily_reports")

    __table_args__ = (
        Index('idx_daily_reports_child_date', 'child_id', 'date'),
    )

class FileAsset(Base):
    __tablename__ = "file_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# DEPRECATED: OTP authentication feature removed - keeping model for potential future use
# class OTPRequest(Base):
#     __tablename__ = "otp_requests"
#     ...

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")

    __table_args__ = (
        Index('idx_refresh_tokens_user', 'user_id'),
        Index('idx_refresh_tokens_expires', 'expires_at'),
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="info")  # info, success, warning, error
    is_read = Column(Boolean, default=False, nullable=False)
    link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index('idx_notifications_user', 'user_id'),
        Index('idx_notifications_read', 'is_read'),
        Index('idx_notifications_created', 'created_at'),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # create, update, delete, login, logout
    resource_type = Column(String(50), nullable=False)  # user, child, nursery, etc.
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # Additional details about the action
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")

    __table_args__ = (
        Index('idx_audit_logs_user', 'user_id'),
        Index('idx_audit_logs_action', 'action'),
        Index('idx_audit_logs_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_logs_created', 'created_at'),
    )

class LoginAttempt(Base):
    """Track login attempts for brute-force protection"""
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(150), nullable=False)
    ip_address = Column(String(45), nullable=False)
    success = Column(Boolean, default=False, nullable=False)
    failure_reason = Column(String(200), nullable=True)  # Invalid credentials, account locked, etc.
    attempted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_login_attempts_email', 'email'),
        Index('idx_login_attempts_ip', 'ip_address'),
        Index('idx_login_attempts_attempted_at', 'attempted_at'),
    )
