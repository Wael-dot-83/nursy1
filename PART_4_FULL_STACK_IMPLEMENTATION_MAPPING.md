# 🗺️ PART 4: Full-Stack Implementation Mapping
## Nursery Management System - Complete Architecture Reference

**Document Date:** 2025-01-15
**System Version:** 1.0.0
**Stack:** React 18 + FastAPI + SQLite/MySQL
**Purpose:** Complete mapping between frontend, backend, and database layers

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack Details](#2-technology-stack-details)
3. [Frontend-to-Backend Mapping](#3-frontend-to-backend-mapping)
4. [Backend-to-Database Mapping](#4-backend-to-database-mapping)
5. [Authentication & Authorization Flow](#5-authentication--authorization-flow)
6. [Role-Based Feature Matrix](#6-role-based-feature-matrix)
7. [Data Transformation Layers](#7-data-transformation-layers)
8. [Error Handling Architecture](#8-error-handling-architecture)
9. [File Upload Flow](#9-file-upload-flow)
10. [State Management Patterns](#10-state-management-patterns)
11. [Request Lifecycle](#11-request-lifecycle)
12. [API Client Architecture](#12-api-client-architecture)
13. [Directory Structure](#13-directory-structure)
14. [Component Hierarchy](#14-component-hierarchy)

---

## 1. System Architecture Overview

### 1.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React 18 Frontend (Port 5174)                      │  │
│  │   - Component-based UI                               │  │
│  │   - React Router for navigation                      │  │
│  │   - Context API for state management                 │  │
│  │   - Axios for API communication                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   FastAPI Backend (Port 8002)                        │  │
│  │   - RESTful API endpoints                            │  │
│  │   - JWT authentication                               │  │
│  │   - Pydantic validation                              │  │
│  │   - SQLAlchemy ORM                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   SQLite (Current) / MySQL 8.0+ (Planned)            │  │
│  │   - 12 tables                                        │  │
│  │   - Foreign key constraints                          │  │
│  │   - Indexed queries                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Request Flow (High-Level)

```
User Action (Browser)
    ↓
React Component Event Handler
    ↓
API Client Function (apiClient.js)
    ↓
Axios HTTP Request
    ↓
FastAPI Router Endpoint
    ↓
Pydantic Schema Validation
    ↓
Service Layer (Business Logic)
    ↓
SQLAlchemy ORM Query
    ↓
Database (SQLite/MySQL)
    ↓
Response Data (JSON)
    ↓
React Component State Update
    ↓
UI Re-render
```

---

## 2. Technology Stack Details

### 2.1 Frontend Technologies

| Technology | Version | Purpose | Files |
|------------|---------|---------|-------|
| **React** | 18.3.1 | UI framework | `src/**/*.jsx` |
| **React Router** | 6.22.0 | Client-side routing | `src/App.jsx` |
| **Vite** | 5.1.0 | Build tool & dev server | `vite.config.js` |
| **Axios** | 1.6.7 | HTTP client | `src/lib/apiClient.js` |
| **Tailwind CSS** | 3.4.1 | Styling framework | `tailwind.config.js` |
| **Lucide React** | 0.344.0 | Icon library | Various components |
| **date-fns** | 3.3.1 | Date utilities | `src/lib/utils.js` |

### 2.2 Backend Technologies

| Technology | Version | Purpose | Files |
|------------|---------|---------|-------|
| **FastAPI** | 0.109.2 | Web framework | `app/main.py` |
| **SQLAlchemy** | 2.0.25 | ORM | `app/models.py`, `app/database.py` |
| **Pydantic** | 2.6.1 | Data validation | `app/schemas.py` |
| **PyJWT** | 2.8.0 | JWT tokens | `app/auth_service.py` |
| **bcrypt** | 4.1.2 | Password hashing | `app/auth_service.py` |
| **python-multipart** | 0.0.6 | File uploads | `app/routers/file_router.py` |

### 2.3 Database Schema

| Table | Rows (Est.) | Primary Use | Key Relationships |
|-------|-------------|-------------|-------------------|
| `users` | 100-1000 | Authentication & user management | → `nurseries`, `branches` |
| `nurseries` | 10-100 | Organization structure | ← `branches`, `users` |
| `branches` | 20-500 | Location management | → `nurseries`, ← `classrooms` |
| `classrooms` | 50-1000 | Child organization | → `branches`, ← `children` |
| `children` | 500-10000 | Child records | → `users` (parent), `nurseries`, `classrooms` |
| `attendance` | 10000-100000 | Daily tracking | → `children` |
| `daily_reports` | 10000-100000 | Activity logs | → `children`, `users` (supervisor) |
| `file_assets` | 1000-50000 | File metadata | → `users`, `children` |
| `refresh_tokens` | 100-1000 | Auth sessions | → `users` |
| `notifications` | 1000-10000 | User alerts | → `users` |
| `audit_logs` | 10000-1000000 | Audit trail | → `users` |
| `login_attempts` | 1000-100000 | Security tracking | None |

---

## 3. Frontend-to-Backend Mapping

### 3.1 Admin User Management

**Frontend:** `src/pages/admin/UserManagement.jsx`

| UI Action | Component Function | API Call | HTTP Method | Backend Endpoint | Backend File |
|-----------|-------------------|----------|-------------|------------------|--------------|
| Load users | `fetchUsers()` | `apiClient.get()` | GET | `/admin/users` | `app/routers/admin_router.py:123` |
| Create user | `handleSubmit()` → `handleSave()` | `apiClient.post()` | POST | `/admin/users` | `app/routers/admin_router.py:145` |
| Update user | `handleSubmit()` → `handleSave()` | `apiClient.put()` | PUT | `/admin/users/{user_id}` | `app/routers/admin_router.py:167` |
| Delete user | `handleDelete()` | `apiClient.delete()` | DELETE | `/admin/users/{user_id}` | `app/routers/admin_router.py:189` |
| Toggle active status | `handleToggleStatus()` | `apiClient.patch()` | PATCH | `/admin/users/{user_id}/activation` | `app/routers/admin_router.py:210` |
| Bulk delete | `handleBulkAction()` | `Promise.all()` | DELETE (multiple) | `/admin/users/{user_id}` | `app/routers/admin_router.py:189` |
| Bulk activate | `handleBulkAction()` | `Promise.all()` | PATCH (multiple) | `/admin/users/{user_id}/activation` | `app/routers/admin_router.py:210` |
| Export users | `handleExport()` | `apiClient.get()` | GET | `/admin/users?limit=10000` | `app/routers/admin_router.py:123` |

**Data Flow:**
```
UserManagement.jsx (React Component)
    ↓
apiClient.get(getEndpoint('/admin/users'))
    ↓
axios HTTP GET request to http://localhost:8002/admin/users
    ↓
FastAPI: @router.get("/users") in admin_router.py:123
    ↓
AdminController.get_users() in admin_controller.py:45
    ↓
db.query(User).filter(...).all()
    ↓
SELECT * FROM users WHERE ...
    ↓
UserResponse schema serialization
    ↓
JSON response: {users: [...], total: 123}
    ↓
setUsers(response.data.users) in React
```

### 3.2 Nursery Management

**Frontend:** `src/pages/admin/NurseryManagement.jsx`

| UI Action | Component Function | API Call | Backend Endpoint | Backend File | Database Query |
|-----------|-------------------|----------|------------------|--------------|----------------|
| Load nurseries | `fetchNurseries()` | GET `/admin/nurseries` | `app/routers/nursery_router.py:56` | `SELECT * FROM nurseries` |
| Create nursery | `handleSaveNursery()` | POST `/admin/nurseries` | `app/routers/nursery_router.py:78` | `INSERT INTO nurseries` + `INSERT INTO users` (manager) |
| Update nursery | `handleSaveNursery()` | PUT `/admin/nurseries/{id}` | `app/routers/nursery_router.py:102` | `UPDATE nurseries WHERE id=?` |
| Delete nursery | `handleDeleteNursery()` | DELETE `/admin/nurseries/{id}` | `app/routers/nursery_router.py:125` | `DELETE FROM nurseries WHERE id=?` |
| Create branch | `handleSaveBranch()` | POST `/admin/nurseries/{nursery_id}/branches` | `app/routers/nursery_router.py:145` | `INSERT INTO branches` |

**Complex Workflow: Create Nursery with Manager**

```python
# Backend: app/routers/nursery_router.py:78
@router.post("/nurseries", response_model=NurseryResponse)
def create_nursery(nursery: NurseryCreate, db: Session = Depends(get_db)):
    # 1. START TRANSACTION (implicit with SQLAlchemy session)

    # 2. Create nursery record
    new_nursery = Nursery(
        name=nursery.name,
        phone=nursery.phone,
        # ... other fields
    )
    db.add(new_nursery)
    db.flush()  # Get nursery.id without committing

    # 3. Create manager user
    temp_password = generate_temp_password()
    manager = User(
        username=f"manager_{new_nursery.id}",
        password_hash=hash_password(temp_password),
        temp_password=temp_password,  # Store for display
        first_name=nursery.manager_first_name,
        last_name=nursery.manager_last_name,
        role="manager",
        nursery_id=new_nursery.id
    )
    db.add(manager)

    # 4. Log audit trail
    audit_log = AuditLog(
        user_id=current_user.id,
        action="nursery.create",
        resource_type="nursery",
        resource_id=new_nursery.id,
        details={"name": nursery.name}
    )
    db.add(audit_log)

    # 5. COMMIT TRANSACTION
    db.commit()

    # 6. Return response
    return NurseryResponse(
        **new_nursery.__dict__,
        manager_username=manager.username,
        manager_temp_password=temp_password  # One-time display
    )
```

### 3.3 Authentication Flow

**Frontend:** `src/pages/auth/Login.jsx` + `src/contexts/AuthContext.jsx`

| Step | Frontend | API Call | Backend | Response |
|------|----------|----------|---------|----------|
| 1. User enters credentials | `handleSubmit()` | - | - | - |
| 2. Form submission | `login(username, password)` | POST `/auth/login` | `app/routers/auth_router.py:45` | - |
| 3. Backend validation | - | - | Verify bcrypt hash | - |
| 4. Generate tokens | - | - | Create JWT access + refresh tokens | - |
| 5. Set httpOnly cookie | - | - | `response.set_cookie('refresh_token', ...)` | - |
| 6. Return access token | - | - | - | `{access_token: "eyJ..."}` |
| 7. Store token | `setAccessToken(data.access_token)` | - | - | - |
| 8. Fetch user profile | `apiClient.get('/auth/me')` | GET `/auth/me` | `app/routers/auth_router.py:78` | `{id, username, role, ...}` |
| 9. Update state | `setUser(userData)` | - | - | - |
| 10. Navigate to dashboard | `navigate('/dashboard')` | - | - | - |

**Token Refresh Flow:**

```javascript
// Frontend: src/lib/apiClient.js:59
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried and not a refresh request
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint (sends httpOnly cookie automatically)
        const { data } = await apiClient.post('/auth/refresh', {}, { withCredentials: true });

        if (data.access_token) {
          // Update access token
          setAccessToken(data.access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        resetAuth();
      }
    }

    return Promise.reject(error);
  }
);
```

### 3.4 Child Registration

**Frontend:** `src/pages/manager/ManagerChildren.jsx`

| Field | Frontend Validation | Backend Schema | Database Column | Data Type |
|-------|---------------------|----------------|-----------------|-----------|
| First Name | Required, max 50 chars | `first_name: str = Field(..., max_length=50)` | `first_name VARCHAR(50)` | String |
| Last Name | Required, max 50 chars | `last_name: str = Field(..., max_length=50)` | `last_name VARCHAR(50)` | String |
| Date of Birth | Required, must be valid date | `date_of_birth: date` | `date_of_birth DATE` | Date |
| Gender | Required, 'male' or 'female' | `gender: GenderEnum` | `gender ENUM('male', 'female')` | Enum |
| Parent | Required, select from list | `parent_id: int` | `parent_id INT` | Foreign Key |
| Classroom | Optional | `classroom_id: Optional[int]` | `classroom_id INT` | Foreign Key (nullable) |
| Medical Notes | Optional | `medical_notes: Optional[str]` | `medical_notes TEXT` | Text |
| Allergies | Optional | `allergies: Optional[str]` | `allergies TEXT` | Text |

**Complete Flow:**

```
1. Manager opens "Add Child" form
   ↓
2. Frontend fetches parent users:
   GET /manager/parents → filters users WHERE role='parent' AND nursery_id={manager_nursery_id}
   ↓
3. Frontend fetches classrooms:
   GET /manager/classrooms → filters classrooms by manager's nursery
   ↓
4. Manager fills form and submits
   ↓
5. Frontend validation (yup/zod schema)
   ↓
6. POST /manager/children with payload:
   {
     first_name: "أحمد",
     last_name: "محمد",
     date_of_birth: "2022-05-15",
     gender: "male",
     parent_id: 123,
     nursery_id: 5,  // Auto-set from manager's nursery
     classroom_id: 42,
     medical_notes: "No allergies",
     allergies: null
   }
   ↓
7. Backend: app/routers/manager_router.py:234
   - Validate parent exists and has role='parent'
   - Validate classroom exists and belongs to manager's nursery
   - Check age against nursery age limits
   ↓
8. Backend: INSERT INTO children (...) VALUES (...)
   ↓
9. Backend: Log audit trail:
   INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
   VALUES ({manager_id}, 'child.create', 'child', {new_child_id}, '{...}')
   ↓
10. Backend: Return ChildResponse
   ↓
11. Frontend: Update children list, show success message
```

### 3.5 Attendance Recording

**Frontend:** `src/pages/supervisor/SupervisorDashboard.jsx`

| Action | Frontend Function | API Endpoint | Backend Logic | Database Update |
|--------|------------------|--------------|---------------|-----------------|
| Mark present | `handleAttendance('present')` | POST `/supervisor/attendance` | Create or update attendance record | `INSERT OR UPDATE attendance SET status='present', check_in_time=NOW()` |
| Mark absent | `handleAttendance('absent')` | POST `/supervisor/attendance` | Create or update attendance record | `INSERT OR UPDATE attendance SET status='absent'` |
| Mark late | `handleAttendance('late')` | POST `/supervisor/attendance` | Create or update attendance record | `INSERT OR UPDATE attendance SET status='late', check_in_time=NOW()` |
| Record checkout | `handleCheckout()` | PATCH `/supervisor/attendance/{id}` | Update check_out_time | `UPDATE attendance SET check_out_time=NOW() WHERE id=?` |
| View attendance | `fetchAttendance()` | GET `/supervisor/attendance?date={date}` | Query attendance by date | `SELECT * FROM attendance WHERE date=? AND child_id IN (...)` |

**Constraint Handling:**

```sql
-- Database constraint
UNIQUE KEY uk_attendance_child_date (child_id, date)

-- Backend handling in app/routers/supervisor_router.py:156
existing = db.query(Attendance).filter(
    Attendance.child_id == attendance.child_id,
    Attendance.date == attendance.date
).first()

if existing:
    # UPDATE instead of INSERT
    existing.status = attendance.status
    existing.check_in_time = datetime.now()
else:
    # INSERT new record
    new_attendance = Attendance(**attendance.dict())
    db.add(new_attendance)

db.commit()
```

---

## 4. Backend-to-Database Mapping

### 4.1 SQLAlchemy Model to Database Table

**Example: User Model**

```python
# app/models.py:15
class User(Base):
    __tablename__ = "users"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(15), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    temp_password = Column(String(255), nullable=True)
    nursery_id = Column(Integer, ForeignKey('nurseries.id'), nullable=True)
    branch_id = Column(Integer, ForeignKey('branches.id'), nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships (not in database, ORM only)
    nursery = relationship("Nursery", back_populates="users")
    branch = relationship("Branch", back_populates="users")
    children = relationship("Child", back_populates="parent")

    # Indexes
    __table_args__ = (
        Index('idx_users_role', 'role'),
        Index('idx_users_nursery', 'nursery_id'),
    )
```

**Generated SQL (SQLite):**

```sql
CREATE TABLE users (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(150) UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  role VARCHAR(20) NOT NULL,  -- Enum stored as VARCHAR
  temp_password VARCHAR(255),
  nursery_id INTEGER,
  branch_id INTEGER,
  active BOOLEAN NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(nursery_id) REFERENCES nurseries(id),
  FOREIGN KEY(branch_id) REFERENCES branches(id)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_nursery ON users(nursery_id);
```

### 4.2 Query Translation Examples

**ORM Query:**
```python
# Get all active managers for a nursery
managers = db.query(User).filter(
    User.role == RoleEnum.MANAGER,
    User.nursery_id == nursery_id,
    User.active == True
).all()
```

**Generated SQL:**
```sql
SELECT * FROM users
WHERE role = 'manager'
  AND nursery_id = ?
  AND active = 1;
```

---

**ORM Query with Join:**
```python
# Get all children with parent info
children_with_parents = db.query(Child, User).join(
    User, Child.parent_id == User.id
).filter(
    Child.nursery_id == nursery_id,
    Child.status == ChildStatus.ACTIVE
).all()
```

**Generated SQL:**
```sql
SELECT children.*, users.*
FROM children
INNER JOIN users ON children.parent_id = users.id
WHERE children.nursery_id = ?
  AND children.status = 'active';
```

---

**ORM Query with Aggregation:**
```python
# Count children by classroom
classroom_counts = db.query(
    Classroom.id,
    Classroom.name,
    func.count(Child.id).label('child_count')
).outerjoin(
    Child, Classroom.id == Child.classroom_id
).group_by(
    Classroom.id
).all()
```

**Generated SQL:**
```sql
SELECT
  classrooms.id,
  classrooms.name,
  COUNT(children.id) AS child_count
FROM classrooms
LEFT OUTER JOIN children ON classrooms.id = children.classroom_id
GROUP BY classrooms.id;
```

### 4.3 Relationship Loading Strategies

| Strategy | Code Example | Generated SQL | Use Case |
|----------|--------------|---------------|----------|
| **Lazy (default)** | `user.children` | Separate query when accessed | When relationship rarely accessed |
| **Eager (joinedload)** | `db.query(User).options(joinedload(User.children))` | JOIN in single query | When relationship always needed |
| **Eager (subqueryload)** | `db.query(User).options(subqueryload(User.children))` | Subquery for related objects | For collections with many items |
| **Select in load** | `db.query(User).options(selectinload(User.children))` | Separate SELECT IN query | Balanced approach |

**Example:**

```python
# Without eager loading (N+1 query problem)
users = db.query(User).filter(User.role == 'parent').all()
for user in users:  # 1 query
    print(user.children)  # N queries (1 per user) = N+1 total queries

# With eager loading (2 queries total)
users = db.query(User).options(joinedload(User.children)).filter(User.role == 'parent').all()
for user in users:  # 1 query with JOIN
    print(user.children)  # No additional queries
```

---

## 5. Authentication & Authorization Flow

### 5.1 Complete Authentication Sequence

```
┌─────────┐                  ┌──────────┐                 ┌─────────┐
│ Browser │                  │  Backend │                 │Database │
└────┬────┘                  └────┬─────┘                 └────┬────┘
     │                            │                            │
     │ POST /auth/login           │                            │
     │ {username, password}       │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ SELECT * FROM users        │
     │                            │ WHERE username=?           │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ User record                │
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │ Verify bcrypt hash         │
     │                            │ (in-memory)                │
     │                            │                            │
     │                            │ Generate JWT access token  │
     │                            │ Generate JWT refresh token │
     │                            │                            │
     │                            │ INSERT INTO refresh_tokens │
     │                            ├───────────────────────────>│
     │                            │                            │
     │ Set-Cookie: refresh_token  │                            │
     │ {access_token: "eyJ..."}   │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ GET /auth/me               │                            │
     │ Authorization: Bearer eyJ..│                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ Decode JWT (in-memory)     │
     │                            │                            │
     │                            │ SELECT * FROM users        │
     │                            │ WHERE id=?                 │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ User data                  │
     │                            │<───────────────────────────┤
     │                            │                            │
     │ {id, username, role, ...}  │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
```

### 5.2 Token Structure

**Access Token (JWT):**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "123",           // User ID
    "username": "admin",
    "role": "admin",
    "exp": 1705334400,      // Expiration (30 minutes)
    "iat": 1705332600       // Issued at
  },
  "signature": "..."
}
```

**Refresh Token:**
- Stored in database as hashed value
- Sent via httpOnly cookie (cannot be accessed by JavaScript)
- Longer expiration (7 days)
- Used to obtain new access token

### 5.3 Authorization Middleware

**File:** `app/auth_controller.py:45`

```python
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Verify JWT and return current user"""
    try:
        # Decode JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))

        # Fetch user from database
        user = db.query(User).filter(User.id == user_id, User.active == True).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found or inactive")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*allowed_roles: RoleEnum):
    """Decorator to enforce role-based access"""
    def decorator(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user

    return decorator
```

**Usage in Routes:**

```python
@router.get("/admin/users")
def get_users(
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
    db: Session = Depends(get_db)
):
    """Only admins can access this endpoint"""
    users = db.query(User).all()
    return {"users": users}


@router.get("/manager/children")
def get_children(
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.MANAGER)),
    db: Session = Depends(get_db)
):
    """Admins and managers can access this endpoint"""
    children = db.query(Child).filter(Child.nursery_id == current_user.nursery_id).all()
    return {"children": children}
```

---

## 6. Role-Based Feature Matrix

### 6.1 Complete Permission Grid

| Feature | Admin | Manager | Supervisor | Parent | Frontend Route | Backend Endpoint |
|---------|-------|---------|------------|--------|----------------|------------------|
| **User Management** | | | | | | |
| Create Admin | ✅ | ❌ | ❌ | ❌ | `/admin/users` | POST `/admin/users` |
| Create Manager | ✅ | ❌ | ❌ | ❌ | `/admin/users` | POST `/admin/users` |
| Create Supervisor | ✅ | ✅ | ❌ | ❌ | `/admin/users`, `/manager/supervisors` | POST `/admin/users`, POST `/manager/supervisors` |
| Create Parent | ✅ | ✅ | ❌ | ❌ | `/admin/users`, `/manager/parents` | POST `/admin/users`, POST `/manager/parents` |
| Update User | ✅ | ✅* | ❌ | ❌ | `/admin/users`, `/manager/users` | PUT `/admin/users/{id}` |
| Delete User | ✅ | ✅* | ❌ | ❌ | `/admin/users`, `/manager/users` | DELETE `/admin/users/{id}` |
| View All Users | ✅ | ❌ | ❌ | ❌ | `/admin/users` | GET `/admin/users` |
| View Nursery Users | ✅ | ✅ | ❌ | ❌ | `/manager/users` | GET `/manager/users` |
| **Nursery Management** | | | | | | |
| Create Nursery | ✅ | ❌ | ❌ | ❌ | `/admin/nurseries` | POST `/admin/nurseries` |
| Update Nursery | ✅ | ✅* | ❌ | ❌ | `/admin/nurseries`, `/manager/settings` | PUT `/admin/nurseries/{id}` |
| Delete Nursery | ✅ | ❌ | ❌ | ❌ | `/admin/nurseries` | DELETE `/admin/nurseries/{id}` |
| View All Nurseries | ✅ | ❌ | ❌ | ❌ | `/admin/nurseries` | GET `/admin/nurseries` |
| View Own Nursery | ✅ | ✅ | ✅ | ✅ | `/manager/nursery`, `/parent/nursery` | GET `/nursery/{id}` |
| **Branch Management** | | | | | | |
| Create Branch | ✅ | ✅ | ❌ | ❌ | `/admin/nurseries`, `/manager/branches` | POST `/admin/branches` |
| Update Branch | ✅ | ✅ | ❌ | ❌ | `/admin/nurseries`, `/manager/branches` | PUT `/admin/branches/{id}` |
| Delete Branch | ✅ | ✅ | ❌ | ❌ | `/admin/nurseries`, `/manager/branches` | DELETE `/admin/branches/{id}` |
| **Classroom Management** | | | | | | |
| Create Classroom | ✅ | ✅ | ❌ | ❌ | `/manager/classrooms` | POST `/manager/classrooms` |
| Update Classroom | ✅ | ✅ | ❌ | ❌ | `/manager/classrooms` | PUT `/manager/classrooms/{id}` |
| Delete Classroom | ✅ | ✅ | ❌ | ❌ | `/manager/classrooms` | DELETE `/manager/classrooms/{id}` |
| View Classrooms | ✅ | ✅ | ✅ | ✅ | All roles have access | GET `/classrooms` |
| **Child Management** | | | | | | |
| Register Child | ✅ | ✅ | ❌ | ❌ | `/manager/children` | POST `/manager/children` |
| Update Child | ✅ | ✅ | ✅* | ❌ | `/manager/children`, `/supervisor/children` | PUT `/children/{id}` |
| Delete Child | ✅ | ✅ | ❌ | ❌ | `/manager/children` | DELETE `/children/{id}` |
| View All Children (Nursery) | ✅ | ✅ | ✅ | ❌ | `/manager/children`, `/supervisor/children` | GET `/children` |
| View Own Children | ✅ | ✅ | ✅ | ✅ | `/parent/children` | GET `/parent/children` |
| Assign to Classroom | ✅ | ✅ | ❌ | ❌ | `/manager/children` | PATCH `/children/{id}/classroom` |
| **Attendance** | | | | | | |
| Record Attendance | ✅ | ✅ | ✅ | ❌ | `/supervisor/attendance` | POST `/attendance` |
| View Attendance (All) | ✅ | ✅ | ✅ | ❌ | `/manager/attendance`, `/supervisor/attendance` | GET `/attendance` |
| View Own Child Attendance | ✅ | ✅ | ✅ | ✅ | `/parent/attendance` | GET `/parent/children/{id}/attendance` |
| **Daily Reports** | | | | | | |
| Create Report | ✅ | ✅ | ✅ | ❌ | `/supervisor/reports` | POST `/daily-reports` |
| Update Report | ✅ | ✅ | ✅ | ❌ | `/supervisor/reports` | PUT `/daily-reports/{id}` |
| Delete Report | ✅ | ✅ | ❌ | ❌ | `/manager/reports` | DELETE `/daily-reports/{id}` |
| View Reports (All) | ✅ | ✅ | ✅ | ❌ | `/manager/reports`, `/supervisor/reports` | GET `/daily-reports` |
| View Own Child Reports | ✅ | ✅ | ✅ | ✅ | `/parent/reports` | GET `/parent/children/{id}/reports` |
| **File Management** | | | | | | |
| Upload File | ✅ | ✅ | ✅ | ✅ | All roles | POST `/files/upload` |
| Delete File | ✅ | ✅ | ✅ | ✅* | All roles | DELETE `/files/{id}` |
| View Files | ✅ | ✅ | ✅ | ✅ | All roles | GET `/files` |
| **Notifications** | | | | | | |
| Send Notification | ✅ | ✅ | ❌ | ❌ | `/manager/notifications` | POST `/notifications` |
| View Notifications | ✅ | ✅ | ✅ | ✅ | `/notifications` | GET `/notifications` |
| Mark as Read | ✅ | ✅ | ✅ | ✅ | `/notifications` | PATCH `/notifications/{id}/read` |
| **Audit Logs** | | | | | | |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ | `/admin/audit-logs` | GET `/admin/audit-logs` |
| **Reports & Analytics** | | | | | | |
| System Analytics | ✅ | ❌ | ❌ | ❌ | `/admin/reports` | GET `/admin/analytics` |
| Nursery Analytics | ✅ | ✅ | ❌ | ❌ | `/manager/reports` | GET `/manager/analytics` |
| Attendance Reports | ✅ | ✅ | ✅ | ❌ | `/manager/reports`, `/supervisor/reports` | GET `/reports/attendance` |

**Legend:**
- ✅ Full access
- ✅* Limited access (own nursery/branch only)
- ❌ No access

---

## 7. Data Transformation Layers

### 7.1 Three-Layer Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UI State (Component State)                           │  │
│  │  {                                                    │  │
│  │    firstName: "أحمد",                                 │  │
│  │    lastName: "محمد",                                  │  │
│  │    displayName: "أحمد محمد"  ← Computed              │  │
│  │  }                                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕ Transform                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Request/Response (JSON camelCase)                │  │
│  │  {                                                    │  │
│  │    firstName: "أحمد",                                 │  │
│  │    lastName: "محمد",                                  │  │
│  │    dateOfBirth: "2022-05-15"                          │  │
│  │  }                                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Pydantic Schema (snake_case)                         │  │
│  │  class UserCreate(BaseModel):                         │  │
│  │    first_name: str                                    │  │
│  │    last_name: str                                     │  │
│  │    date_of_birth: date                                │  │
│  │                                                       │  │
│  │    class Config:                                      │  │
│  │      alias_generator = to_camel  ← Converts to JSON  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕ ORM Mapping                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  SQLAlchemy Model (Python Objects)                    │  │
│  │  user = User(                                         │  │
│  │    first_name="أحمد",                                 │  │
│  │    last_name="محمد",                                  │  │
│  │    date_of_birth=date(2022, 5, 15)                    │  │
│  │  )                                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite/MySQL)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Table Row (Binary Storage)                           │  │
│  │  first_name: VARCHAR → UTF-8 bytes                    │  │
│  │  last_name: VARCHAR → UTF-8 bytes                     │  │
│  │  date_of_birth: DATE → Integer (days since epoch)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Naming Convention Transformations

| Layer | Convention | Example | Transformation |
|-------|------------|---------|----------------|
| **Database** | `snake_case` | `first_name`, `date_of_birth` | N/A (stored as-is) |
| **Backend (Python)** | `snake_case` | `first_name`, `date_of_birth` | N/A (matches DB) |
| **API (JSON)** | `camelCase` | `firstName`, `dateOfBirth` | Pydantic `alias_generator` |
| **Frontend (JS)** | `camelCase` | `firstName`, `dateOfBirth` | N/A (matches API) |

**Pydantic Configuration:**

```python
# app/schemas.py:12
from pydantic import BaseModel, Field, ConfigDict

def to_camel(string: str) -> str:
    """Convert snake_case to camelCase"""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

class UserBase(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    phone: str = Field(..., max_length=15)
    role: RoleEnum

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,  # Allow both snake_case and camelCase in input
        from_attributes=True    # Allow ORM objects
    )

# Usage:
user_data = {
    "firstName": "أحمد",  # Frontend sends camelCase
    "lastName": "محمد",
    "phone": "0791234567",
    "role": "parent"
}

user = UserCreate(**user_data)  # Pydantic converts to snake_case
# user.first_name == "أحمد"
# user.last_name == "محمد"

# Response
user_response = UserResponse.from_orm(db_user)
print(user_response.model_dump())  # {'firstName': 'أحمد', 'lastName': 'محمد', ...}
```

### 7.3 Date/Time Handling

| Layer | Format | Example | Timezone |
|-------|--------|---------|----------|
| **Database** | ISO 8601 (string) or Unix timestamp | `2025-01-15 14:30:00` | UTC |
| **Backend** | Python `datetime` object | `datetime(2025, 1, 15, 14, 30)` | UTC |
| **API** | ISO 8601 string | `"2025-01-15T14:30:00Z"` | UTC (Z suffix) |
| **Frontend** | JavaScript `Date` object | `new Date("2025-01-15T14:30:00Z")` | Local (auto-converted) |
| **UI Display** | Localized string | `"١٥ يناير ٢٠٢٥"` (Arabic) | Local |

**Frontend Date Formatting:**

```javascript
// src/lib/utils.js:45
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';

export function formatDate(dateString, formatStr = 'dd/MM/yyyy') {
  if (!dateString) return '';

  // Parse ISO string from API
  const date = parseISO(dateString);

  // Format with Arabic locale
  return format(date, formatStr, { locale: arSA });
}

// Usage in component:
<td>{formatDate(child.dateOfBirth, 'dd MMMM yyyy')}</td>
// Output: "١٥ يناير ٢٠٢٥"
```

---

## 8. Error Handling Architecture

### 8.1 Error Flow

```
Backend Error (Exception)
    ↓
FastAPI Exception Handler
    ↓
HTTP Error Response (JSON)
    ↓
Axios Interceptor (Frontend)
    ↓
Error Extraction Utility
    ↓
User-Friendly Message
    ↓
Toast Notification / Form Error Display
```

### 8.2 Backend Error Structure

**File:** `app/errors.py:15`

```python
from fastapi import HTTPException, status

class NurseryException(HTTPException):
    """Base exception for nursery system"""
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class ValidationException(NurseryException):
    """Validation error with field-level details"""
    def __init__(self, errors: dict):
        detail = {
            "message": "Validation failed",
            "field_errors": errors
        }
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class ResourceNotFoundException(NurseryException):
    """Resource not found"""
    def __init__(self, resource_type: str, resource_id: int):
        detail = f"{resource_type} with ID {resource_id} not found"
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(NurseryException):
    """Authentication failed"""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(NurseryException):
    """Authorization failed"""
    def __init__(self, detail: str = "Access denied"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)
```

**Usage:**

```python
# app/routers/manager_router.py:234
@router.post("/children")
def create_child(
    child: ChildCreate,
    current_user: User = Depends(require_role(RoleEnum.MANAGER)),
    db: Session = Depends(get_db)
):
    # Validate parent exists
    parent = db.query(User).filter(User.id == child.parent_id).first()
    if not parent:
        raise ResourceNotFoundException("User", child.parent_id)

    # Validate parent role
    if parent.role != RoleEnum.PARENT:
        raise ValidationException({
            "parent_id": f"User {child.parent_id} is not a parent"
        })

    # Validate parent belongs to same nursery
    if parent.nursery_id != current_user.nursery_id:
        raise ForbiddenException("Cannot assign child to parent from different nursery")

    # Create child
    new_child = Child(**child.dict(), nursery_id=current_user.nursery_id)
    db.add(new_child)
    db.commit()

    return ChildResponse.from_orm(new_child)
```

### 8.3 Frontend Error Handling

**File:** `src/lib/apiClient.js:95`

```javascript
// Extract error message from various error formats
export function extractErrorMessage(error) {
  if (!error) return 'An unknown error occurred';

  // Axios error with response
  if (error.response?.data) {
    const { data } = error.response;

    // FastAPI validation error (422)
    if (error.response.status === 422 && data.detail) {
      if (Array.isArray(data.detail)) {
        // Pydantic validation errors
        return data.detail.map(err => `${err.loc[1]}: ${err.msg}`).join(', ');
      }

      // Custom validation error
      if (data.detail.message && data.detail.field_errors) {
        return data.detail.message;  // Handle field_errors separately
      }

      return data.detail;
    }

    // Simple error message
    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (typeof data.message === 'string') {
      return data.message;
    }
  }

  // Network error
  if (error.request && !error.response) {
    return 'Network error. Please check your connection.';
  }

  // Generic fallback
  return error.message || 'An error occurred';
}

// Extract field-level errors for form display
export function extractFieldErrors(error) {
  if (!error?.response?.data) return {};

  const { data } = error.response;

  // Custom validation error
  if (data.detail?.field_errors) {
    return data.detail.field_errors;
  }

  // Pydantic validation errors
  if (error.response.status === 422 && Array.isArray(data.detail)) {
    const errors = {};
    data.detail.forEach(err => {
      const field = err.loc[1];  // Field name is at index 1
      errors[field] = err.msg;
    });
    return errors;
  }

  return {};
}
```

**Usage in Components:**

```javascript
// src/pages/admin/UserManagement.jsx:477
const handleSave = async (formData) => {
  try {
    const response = user
      ? await apiClient.put(getEndpoint(`/admin/users/${user.id}`), formData)
      : await apiClient.post(getEndpoint('/admin/users'), formData);

    // Success
    toast.success(user ? 'User updated successfully' : 'User created successfully');
    fetchUsers();  // Refresh list
    setShowForm(false);

  } catch (error) {
    // Extract user-friendly message
    const message = extractErrorMessage(error);
    toast.error(message);

    // Extract field-level errors for form highlighting
    const fieldErrors = extractFieldErrors(error);
    setFormErrors(fieldErrors);
    // Example fieldErrors: { username: "Username already exists", email: "Invalid email format" }
  }
};
```

---

## 9. File Upload Flow

### 9.1 Complete Upload Sequence

```
1. User selects file (input type="file")
   ↓
2. Frontend validates:
   - File size (< 10MB)
   - File type (allowed MIME types)
   ↓
3. Create FormData object:
   const formData = new FormData();
   formData.append('file', file);
   formData.append('file_type', 'photo');
   formData.append('child_id', childId);
   ↓
4. POST /files/upload (multipart/form-data)
   ↓
5. Backend: File router receives upload
   app/routers/file_router.py:45
   ↓
6. Backend validation:
   - File size check
   - MIME type verification
   - Virus scan (optional)
   ↓
7. Generate unique filename:
   {timestamp}_{uuid}_{original_name}
   ↓
8. Save to disk:
   ./uploads/{nursery_id}/{file_type}/{filename}
   ↓
9. Create database record:
   INSERT INTO file_assets (...)
   ↓
10. Return metadata:
    {
      id: 123,
      filename: "2025-01-15_abc123_photo.jpg",
      file_path: "/uploads/5/photo/2025-01-15_abc123_photo.jpg",
      file_size: 245678,
      mime_type: "image/jpeg"
    }
    ↓
11. Frontend displays preview/confirmation
```

### 9.2 Backend Implementation

**File:** `app/routers/file_router.py:45`

```python
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/files", tags=["Files"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", 10)) * 1024 * 1024  # 10MB in bytes

ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]

@router.post("/upload", response_model=FileAssetResponse)
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = "other",
    child_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )

    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed"
        )

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    file_extension = os.path.splitext(file.filename)[1]
    new_filename = f"{timestamp}_{unique_id}_{file.filename}"

    # Create directory structure
    upload_path = os.path.join(
        UPLOAD_DIR,
        str(current_user.nursery_id),
        file_type
    )
    os.makedirs(upload_path, exist_ok=True)

    # Save file to disk
    file_path = os.path.join(upload_path, new_filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Create database record
    file_asset = FileAsset(
        uploaded_by=current_user.id,
        child_id=child_id,
        filename=new_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        file_type=file_type
    )
    db.add(file_asset)
    db.commit()

    # Log audit trail
    audit_log = AuditLog(
        user_id=current_user.id,
        action="file.upload",
        resource_type="file_asset",
        resource_id=file_asset.id,
        details={"filename": file.filename, "size": file_size}
    )
    db.add(audit_log)
    db.commit()

    return FileAssetResponse.from_orm(file_asset)


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download file by ID"""
    file_asset = db.query(FileAsset).filter(FileAsset.id == file_id).first()

    if not file_asset:
        raise HTTPException(status_code=404, detail="File not found")

    # Authorization check (can user access this file?)
    if file_asset.child_id:
        child = db.query(Child).filter(Child.id == file_asset.child_id).first()

        # Only parent of child, supervisors/managers of nursery, or admin can access
        can_access = (
            current_user.role == RoleEnum.ADMIN or
            (current_user.role == RoleEnum.PARENT and child.parent_id == current_user.id) or
            (current_user.role in [RoleEnum.MANAGER, RoleEnum.SUPERVISOR] and child.nursery_id == current_user.nursery_id)
        )

        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")

    # Return file
    return FileResponse(
        path=file_asset.file_path,
        filename=file_asset.original_filename,
        media_type=file_asset.mime_type
    )
```

### 9.3 Frontend Implementation

**File:** `src/pages/manager/ManagerChildren.jsx:567`

```javascript
const handleFileUpload = async (file, childId) => {
  // Validate file size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    toast.error('File too large. Maximum size is 10MB');
    return;
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    toast.error('File type not allowed');
    return;
  }

  try {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', 'photo');
    formData.append('child_id', childId);

    // Upload
    const response = await apiClient.post(
      getEndpoint('/files/upload'),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      }
    );

    toast.success('File uploaded successfully');
    setUploadedFiles([...uploadedFiles, response.data]);

  } catch (error) {
    const message = extractErrorMessage(error);
    toast.error(`Upload failed: ${message}`);
  }
};
```

---

## 10. State Management Patterns

### 10.1 AuthContext (Global Authentication State)

**File:** `src/contexts/AuthContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, getEndpoint } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Expose setAccessToken to apiClient for token refresh
  useEffect(() => {
    window.setAccessToken = setAccessToken;
  }, []);

  // Refresh access token using httpOnly refresh cookie
  const refreshAccessToken = useCallback(async () => {
    try {
      const { data } = await apiClient.post(getEndpoint('/auth/refresh'), {}, {
        withCredentials: true,  // Send httpOnly cookies
      });

      if (data.access_token) {
        setAccessToken(data.access_token);
        return data.access_token;
      }

      resetAuth();
      return null;
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Token refresh failed:', err);
      }
      resetAuth();
      return null;
    }
  }, []);

  // Initialize auth on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await refreshAccessToken();

        if (token) {
          const { data: userData } = await apiClient.get(getEndpoint('/auth/me'));
          setUser(userData);
        }
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error('Auth initialization failed:', err);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [refreshAccessToken]);

  // Login function
  const login = async (username, password) => {
    const { data } = await apiClient.post(getEndpoint('/auth/login'), {
      username,
      password,
    });

    setAccessToken(data.access_token);

    // Fetch user profile
    const { data: userData } = await apiClient.get(getEndpoint('/auth/me'));
    setUser(userData);

    return userData;
  };

  // Logout function
  const logout = async () => {
    try {
      await apiClient.post(getEndpoint('/auth/logout'), {}, {
        withCredentials: true,
      });
    } finally {
      resetAuth();
    }
  };

  const resetAuth = () => {
    setUser(null);
    setAccessToken(null);
  };

  const value = {
    user,
    accessToken,
    isInitializing,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Usage in Components:**

```javascript
// src/pages/auth/Login.jsx
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const { login, isInitializing } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = await login(username, password);

      // Navigate based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } // ... etc
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };

  // ... rest of component
}
```

### 10.2 Component-Level State

**Example:** User Management with local state

```javascript
// src/pages/admin/UserManagement.jsx
function UserManagement() {
  // List state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [filters, setFilters] = useState({
    role: '',
    nursery_id: '',
    active: '',
    search: ''
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(getEndpoint('/admin/users'), {
        params: {
          page: currentPage,
          limit: 20,
          ...filters
        }
      });

      setUsers(response.data.users);
      setTotalPages(Math.ceil(response.data.total / 20));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ... handlers, render logic
}
```

---

## 11. Request Lifecycle

### 11.1 Complete Request Example: Create User

**Step-by-step with file references:**

```
1. User fills form and clicks "Save"
   File: src/pages/admin/UserManagement.jsx:477
   Handler: handleSubmit()

2. Form validation (client-side)
   - Check required fields
   - Validate phone format
   - Validate email format

3. API call
   Code: apiClient.post(getEndpoint('/admin/users'), formData)
   File: src/lib/apiClient.js:15
   ↓
4. Axios request interceptor
   File: src/lib/apiClient.js:30
   - Add Authorization header: `Bearer ${accessToken}`
   - Add Content-Type: application/json
   ↓
5. HTTP POST to http://localhost:8002/admin/users
   ↓
6. Backend receives request
   File: app/main.py:45
   - CORS middleware checks origin
   - Request ID middleware adds X-Request-ID
   ↓
7. Router matches endpoint
   File: app/routers/admin_router.py:145
   @router.post("/users", response_model=UserResponse)
   ↓
8. Dependency injection
   - current_user = Depends(require_role(RoleEnum.ADMIN))
     File: app/auth_controller.py:67
     - Decodes JWT from Authorization header
     - Fetches user from database
     - Verifies user is admin
   - db = Depends(get_db)
     File: app/database.py:25
     - Creates database session
   ↓
9. Pydantic validation
   - user: UserCreate schema
   File: app/schemas.py:45
   - Validates data types
   - Validates field constraints (length, format)
   - Converts camelCase to snake_case
   ↓
10. Controller logic
    File: app/controllers/admin_controller.py:78
    - Check if username already exists
    - Check if email already exists (if provided)
    - Hash password with bcrypt
    - Generate temp_password
    ↓
11. Database insert
    Code: db.add(new_user); db.flush()
    SQL: INSERT INTO users (...) VALUES (...)
    ↓
12. Audit logging
    Code: db.add(audit_log)
    SQL: INSERT INTO audit_logs (...) VALUES (...)
    ↓
13. Transaction commit
    Code: db.commit()
    ↓
14. Response serialization
    Code: return UserResponse.from_orm(new_user)
    - Converts ORM object to Pydantic schema
    - Converts snake_case to camelCase
    - Omits sensitive fields (password_hash)
    ↓
15. HTTP Response: 200 OK
    Headers:
      Content-Type: application/json
      X-Request-ID: abc123...
    Body:
      {
        "id": 123,
        "username": "newuser",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "manager",
        "active": true,
        "tempPassword": "TempPass123!",  // One-time display
        "createdAt": "2025-01-15T14:30:00Z"
      }
    ↓
16. Axios response interceptor
    File: src/lib/apiClient.js:59
    - No action (only handles errors)
    ↓
17. Component receives response
    File: src/pages/admin/UserManagement.jsx:480
    - toast.success("User created successfully")
    - fetchUsers() to refresh list
    - setShowForm(false) to close modal
    ↓
18. React re-renders
    - User list updated with new user
    - Success toast displayed
```

### 11.2 Error Scenario Example

**What happens if username already exists:**

```
Steps 1-9: Same as above

10. Controller logic
    File: app/controllers/admin_controller.py:78

    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise ValidationException({
            "username": "Username already exists"
        })
    ↓
11. FastAPI exception handler
    File: app/main.py:78
    - Catches ValidationException
    - Returns HTTP 422 Unprocessable Entity
    ↓
12. HTTP Response: 422 Unprocessable Entity
    Body:
      {
        "detail": {
          "message": "Validation failed",
          "field_errors": {
            "username": "Username already exists"
          }
        }
      }
    ↓
13. Axios response interceptor (error path)
    File: src/lib/apiClient.js:70
    - Checks if 401 (no, it's 422)
    - Returns Promise.reject(error)
    ↓
14. Component catch block
    File: src/pages/admin/UserManagement.jsx:486
    catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);  // "Validation failed"

      const fieldErrors = extractFieldErrors(error);
      setFormErrors(fieldErrors);
      // formErrors = { username: "Username already exists" }
    }
    ↓
15. React re-renders
    - Form stays open
    - Username field shows red border with error message
    - Toast shows "Validation failed"
```

---

## 12. API Client Architecture

### 12.1 API Client Configuration

**File:** `src/lib/apiClient.js`

```javascript
import axios from 'axios';

// Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,  // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get full endpoint path
export function getEndpoint(path) {
  // In direct connection mode, prepend nothing
  // In proxy mode, prepend /api
  // Current: direct connection
  return path;
}

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = window.accessToken;  // Set by AuthContext
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried and not a refresh request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // Call global refresh function (set by AuthContext)
        if (window.refreshAccessTokenFn) {
          const newToken = await window.refreshAccessTokenFn();

          if (newToken) {
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 12.2 Specialized API Modules

**File:** `src/lib/api/admin.js`

```javascript
import { apiClient } from '../apiClient';

// Admin-specific API calls
export const adminAPI = {
  // Users
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  createUser: (data) => apiClient.post('/admin/users', data),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  // Nurseries
  getNurseries: () => apiClient.get('/admin/nurseries'),
  createNursery: (data) => apiClient.post('/admin/nurseries', data),
  updateNursery: (id, data) => apiClient.put(`/admin/nurseries/${id}`, data),
  deleteNursery: (id) => apiClient.delete(`/admin/nurseries/${id}`),

  // Audit Logs
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),

  // Analytics
  getSystemAnalytics: () => apiClient.get('/admin/analytics'),
};
```

**Usage:**

```javascript
// Instead of:
const response = await apiClient.get(getEndpoint('/admin/users'));

// Use:
import { adminAPI } from '../lib/api/admin';
const response = await adminAPI.getUsers({ page: 1, limit: 20 });
```

---

## 13. Directory Structure

### 13.1 Backend Structure

```
nursery-system/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app initialization
│   ├── database.py                # SQLAlchemy engine and session
│   ├── models.py                  # Database models (ORM)
│   ├── schemas.py                 # Pydantic schemas (validation)
│   ├── errors.py                  # Custom exceptions
│   ├── auth_controller.py         # Auth logic and dependencies
│   ├── auth_service.py            # JWT and password utilities
│   ├── auth_router.py             # Auth endpoints
│   ├── sanitization.py            # Input sanitization
│   ├── exceptions.py              # Additional exception handlers
│   │
│   ├── routers/                   # Feature-specific routers
│   │   ├── admin_router.py        # Admin endpoints
│   │   ├── manager_router.py      # Manager endpoints
│   │   ├── supervisor_router.py   # Supervisor endpoints
│   │   ├── parent_router.py       # Parent endpoints
│   │   ├── nursery_router.py      # Nursery management
│   │   ├── children_router.py     # Child management
│   │   ├── attendance_router.py   # Attendance tracking
│   │   ├── report_router.py       # Daily reports
│   │   ├── file_router.py         # File upload/download
│   │   ├── notification_router.py # Notifications
│   │   └── audit_router.py        # Audit logs
│   │
│   └── controllers/               # Business logic layer
│       ├── admin_controller.py
│       ├── manager_controller.py
│       ├── supervisor_controller.py
│       └── parent_controller.py
│
├── tests/                         # Test suite
│   ├── conftest.py                # Pytest fixtures
│   ├── test_auth.py
│   ├── test_users.py
│   └── ...
│
├── uploads/                       # File storage
│   └── {nursery_id}/
│       ├── photo/
│       ├── document/
│       └── other/
│
├── .env                           # Environment configuration
├── .env.example                   # Template
├── requirements.txt               # Python dependencies
├── pytest.ini                     # Pytest configuration
├── run.py                         # Development server script
└── nursery.db                     # SQLite database file
```

### 13.2 Frontend Structure

```
nursery-system/frontend/
├── public/                        # Static assets
│   └── favicon.ico
│
├── src/
│   ├── main.jsx                   # Entry point
│   ├── App.jsx                    # Root component + routing
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # Base UI components
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ...
│   │   │
│   │   ├── ChildGuardianModal.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingOverlay.jsx
│   │   └── Spinner.jsx
│   │
│   ├── contexts/                  # React contexts (global state)
│   │   ├── AuthContext.jsx        # Authentication state
│   │   └── I18nContext.jsx        # Internationalization (future)
│   │
│   ├── pages/                     # Route components
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── ChangePasswordPage.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── NurseryManagement.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   └── Reports.jsx
│   │   │
│   │   ├── manager/
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── ManagerChildren.jsx
│   │   │   ├── ManagerSupervisors.jsx
│   │   │   └── ManagerReports.jsx
│   │   │
│   │   ├── supervisor/
│   │   │   ├── SupervisorDashboard.jsx
│   │   │   └── SupervisorReports.jsx
│   │   │
│   │   ├── parent/
│   │   │   ├── ParentDashboard.jsx
│   │   │   ├── ParentChildren.jsx
│   │   │   ├── ParentNotifications.jsx
│   │   │   └── ParentReports.jsx
│   │   │
│   │   ├── profile/
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   └── settings/
│   │       └── SettingsPage.jsx
│   │
│   ├── lib/                       # Utilities and helpers
│   │   ├── api/                   # API client modules
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── children.js
│   │   │   ├── attendance.js
│   │   │   ├── reports.js
│   │   │   ├── notifications.js
│   │   │   ├── file.js
│   │   │   ├── nursery.js
│   │   │   └── user.js
│   │   │
│   │   ├── apiClient.js           # Axios configuration
│   │   ├── api.js                 # Legacy API exports
│   │   ├── sanitization.js        # Input sanitization
│   │   └── utils.js               # General utilities
│   │
│   ├── __tests__/                 # Frontend tests
│   │   ├── AuthContext.test.jsx
│   │   └── Login.test.jsx
│   │
│   └── index.css                  # Global styles (Tailwind)
│
├── .env                           # Environment configuration
├── .env.example                   # Template
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── package.json                   # Node dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── postcss.config.js              # PostCSS configuration
```

---

## 14. Component Hierarchy

### 14.1 Admin Flow Component Tree

```
App.jsx
└── <AuthProvider>
    └── <Router>
        └── <ProtectedRoute role="admin">
            └── AdminLayout
                ├── <Sidebar>
                │   ├── <NavLink to="/admin/dashboard">
                │   ├── <NavLink to="/admin/users">
                │   ├── <NavLink to="/admin/nurseries">
                │   ├── <NavLink to="/admin/audit-logs">
                │   └── <NavLink to="/admin/reports">
                │
                └── <Outlet>
                    └── UserManagement.jsx
                        ├── <PageHeader title="User Management">
                        ├── <Filters>
                        │   ├── <Select name="role">
                        │   ├── <Select name="nursery_id">
                        │   ├── <Select name="active">
                        │   └── <Input type="search">
                        │
                        ├── <ActionBar>
                        │   ├── <Button onClick={handleCreate}>Add User</Button>
                        │   ├── <Button onClick={handleBulkDelete}>Bulk Delete</Button>
                        │   └── <Button onClick={handleExport}>Export</Button>
                        │
                        ├── {showForm && <UserFormModal>
                        │   ├── <Modal>
                        │   │   └── <Form onSubmit={handleSubmit}>
                        │   │       ├── <Input name="username">
                        │   │       ├── <Input name="firstName">
                        │   │       ├── <Input name="lastName">
                        │   │       ├── <Input name="email">
                        │   │       ├── <Input name="phone">
                        │   │       ├── <Select name="role">
                        │   │       ├── <Select name="nursery_id">
                        │   │       ├── <Select name="branch_id">
                        │   │       └── <Button type="submit">Save</Button>
                        │   └── }
                        │
                        ├── {loading ? <LoadingOverlay /> : <Table>
                        │   ├── <thead>
                        │   │   └── <tr>
                        │   │       ├── <th><Checkbox /></th>
                        │   │       ├── <th>Username</th>
                        │   │       ├── <th>Name</th>
                        │   │       ├── <th>Role</th>
                        │   │       ├── <th>Status</th>
                        │   │       └── <th>Actions</th>
                        │   │
                        │   └── <tbody>
                        │       └── {users.map(user =>
                        │           <tr key={user.id}>
                        │               ├── <td><Checkbox /></td>
                        │               ├── <td>{user.username}</td>
                        │               ├── <td>{user.firstName} {user.lastName}</td>
                        │               ├── <td><Badge>{user.role}</Badge></td>
                        │               ├── <td><Badge variant={user.active ? 'success' : 'danger'}></Badge></td>
                        │               └── <td>
                        │                   ├── <Button onClick={handleEdit}>Edit</Button>
                        │                   ├── <Button onClick={handleToggleStatus}>Toggle</Button>
                        │                   └── <Button onClick={handleDelete}>Delete</Button>
                        │               </td>
                        │           </tr>
                        │       )}
                        │
                        └── <Pagination
                            current={currentPage}
                            total={totalPages}
                            onChange={setCurrentPage}
                        />
```

---

## Summary

This document provides a complete reference for understanding how the nursery management system's three tiers (Frontend, Backend, Database) connect and communicate.

**Key Takeaways:**

1. **Frontend ↔ Backend:** React components call FastAPI endpoints via Axios, with automatic token refresh
2. **Backend ↔ Database:** SQLAlchemy ORM translates Python code to SQL queries
3. **Data Flow:** User actions → API calls → Backend logic → Database queries → JSON responses → UI updates
4. **Authentication:** JWT access tokens (30min) + httpOnly refresh tokens (7 days)
5. **Authorization:** Role-based access control enforced at both frontend (routing) and backend (decorators)
6. **Error Handling:** Backend exceptions → HTTP error responses → Frontend error extraction → User-friendly messages
7. **File Uploads:** FormData → Multipart endpoint → Disk storage + Database metadata
8. **State Management:** AuthContext for global auth, component state for local UI

**File Navigation:**
- Frontend components: `src/pages/{role}/{Feature}.jsx`
- Backend endpoints: `app/routers/{feature}_router.py`
- Database models: `app/models.py`
- API client: `src/lib/apiClient.js`

---

**Document Version:** 1.0
**Created:** 2025-01-15
**Status:** ✅ Complete
