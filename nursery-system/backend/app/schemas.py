from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from .models import RoleEnum, AttendanceStatus, ChildStatus

# Base schemas
class BaseResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class ErrorResponse(BaseResponse):
    success: bool = False
    error: str

# Authentication schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def validate_new_password(cls, v, values):
        if 'current_password' in values and v == values['current_password']:
            raise ValueError('New password must be different from current password')
        return v

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    role: RoleEnum

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    nursery_id: Optional[int] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    nursery_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserListResponse(BaseResponse):
    data: List[UserResponse]
    total: int
    page: int
    per_page: int

# Branch schemas
class BranchBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: Dict[str, Any] = Field(default_factory=dict)  # {street, city, governorate, postalCode}
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    nursery_id: int

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[Dict[str, Any]] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=15)

class BranchResponse(BranchBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Nursery schemas
class NurseryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    main_phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    main_address: Dict[str, Any] = Field(default_factory=dict)  # {street, city, governorate, postalCode}
    age_range: Dict[str, int] = Field(default_factory=lambda: {"minAge": 70, "maxAge": 52})  # {minAge, maxAge}
    notes: Optional[str] = None

class NurseryCreate(NurseryBase):
    branches: Optional[List[Dict[str, Any]]] = Field(default_factory=list)  # List of branch data

class NurseryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    main_phone: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    main_address: Optional[Dict[str, Any]] = None
    age_range: Optional[Dict[str, int]] = None
    notes: Optional[str] = None
    branches: Optional[List[Dict[str, Any]]] = None

class NurseryResponse(NurseryBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    branches: Optional[List[BranchResponse]] = None
    manager: Optional[Dict[str, Any]] = None  # Manager credentials for new nurseries

    class Config:
        from_attributes = True

# Classroom schemas
class ClassroomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    capacity: int = Field(..., gt=0)
    branch_id: int

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    capacity: Optional[int] = Field(None, gt=0)

class ClassroomResponse(ClassroomBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Child schemas
class ChildBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    date_of_birth: date
    gender: str = Field(..., pattern="^(male|female|other)$")
    medical_info: Optional[str] = None
    emergency_contact: str = Field(..., min_length=1, max_length=100)
    emergency_phone: str = Field(..., min_length=10, max_length=15)
    classroom_id: int
    parent_id: int

class ChildCreate(ChildBase):
    pass

class ChildUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    medical_info: Optional[str] = None
    emergency_contact: Optional[str] = Field(None, min_length=1, max_length=100)
    emergency_phone: Optional[str] = Field(None, min_length=10, max_length=15)
    classroom_id: Optional[int] = None
    status: Optional[ChildStatus] = None

class ChildResponse(ChildBase):
    id: int
    status: ChildStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Attendance schemas
class AttendanceBase(BaseModel):
    child_id: int
    date: date
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    status: AttendanceStatus

class AttendanceCreate(BaseModel):
    child_id: int
    date: date
    check_in_time: Optional[time] = None
    status: AttendanceStatus = AttendanceStatus.PRESENT

class AttendanceUpdate(BaseModel):
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    status: Optional[AttendanceStatus] = None

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Daily Report schemas
class DailyReportBase(BaseModel):
    child_id: int
    date: date
    activities: Optional[str] = None
    meals: Optional[str] = None
    naps: Optional[str] = None
    mood: Optional[str] = Field(None, pattern="^(happy|sad|excited|tired|calm)$")
    notes: Optional[str] = None

class DailyReportCreate(DailyReportBase):
    pass

class DailyReportUpdate(BaseModel):
    activities: Optional[str] = None
    meals: Optional[str] = None
    naps: Optional[str] = None
    mood: Optional[str] = Field(None, pattern="^(happy|sad|excited|tired|calm)$")
    notes: Optional[str] = None

class DailyReportResponse(DailyReportBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# File Asset schemas
class FileAssetResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    content_type: str
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Notification schemas
class NotificationCreate(BaseModel):
    user_id: int
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    type: str = Field(default="info", pattern="^(info|success|warning|error)$")
    link: Optional[str] = Field(None, max_length=500)

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str]
    created_at: datetime
    read_at: Optional[datetime]

    class Config:
        from_attributes = True

# Audit Log schemas
class AuditLogCreate(BaseModel):
    user_id: Optional[int] = None
    action: str = Field(..., min_length=1, max_length=100)
    resource_type: str = Field(..., min_length=1, max_length=50)
    resource_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = Field(None, max_length=500)

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[int]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard/Statistics schemas
class NurseryStats(BaseModel):
    total_children: int
    total_staff: int
    total_classrooms: int
    present_today: int
    absent_today: int

class ChildStats(BaseModel):
    total_children: int
    active_children: int
    by_classroom: Dict[str, int]
    attendance_rate: float

class AttendanceStats(BaseModel):
    date: date
    present: int
    absent: int
    late: int
    total: int

# Pagination schemas
class PaginationParams(BaseModel):
    page: int = Field(1, gt=0)
    per_page: int = Field(10, gt=0, le=100)

class PaginatedResponse(BaseResponse):
    data: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int
