# 🔐 Role-Based Function Mapping & Integration

## Overview
Complete mapping of all system functions by user role with integration points.

---

## 1. Role Hierarchy & Permissions

```
Admin (Level 4)
  ├── Full system access
  ├── All CRUD operations
  └── System configuration
      │
      ├── Manager (Level 3)
      │     ├── Nursery-level access
      │     ├── Staff management
      │     └── Reports & analytics
      │         │
      │         ├── Supervisor (Level 2)
      │         │     ├── Classroom operations
      │         │     ├── Daily reports
      │         │     └── Attendance tracking
      │         │
      │         └── Parent (Level 1)
      │               ├── View own children
      │               ├── Read reports
      │               └── Basic communication
```

---

## 2. Function Access Matrix

| Function | Admin | Manager | Supervisor | Parent |
|----------|-------|---------|------------|--------|
| **Authentication** |
| Login | ✅ | ✅ | ✅ | ✅ |
| Change Password | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ |
| Revoke Tokens | ✅ | ❌ | ❌ | ❌ |
| **Nursery Management** |
| Create Nursery | ✅ | ❌ | ❌ | ❌ |
| View Nurseries | ✅ | 🔸 Own | ❌ | ❌ |
| Update Nursery | ✅ | ❌ | ❌ | ❌ |
| Delete Nursery | ✅ | ❌ | ❌ | ❌ |
| **Branch Management** |
| Create Branch | ✅ | ❌ | ❌ | ❌ |
| View Branches | ✅ | 🔸 Own | ❌ | ❌ |
| Update Branch | ✅ | ❌ | ❌ | ❌ |
| Delete Branch | ✅ | ❌ | ❌ | ❌ |
| **Classroom Management** |
| Create Classroom | ✅ | ❌ | ❌ | ❌ |
| View Classrooms | ✅ | 🔸 Own | 🔸 Own | ❌ |
| Update Classroom | ✅ | ❌ | ❌ | ❌ |
| Delete Classroom | ✅ | ❌ | ❌ | ❌ |
| **User Management** |
| Create User | ✅ | ❌ | ❌ | ❌ |
| View Users | ✅ | 🔸 Nursery | ❌ | ❌ |
| Update User | ✅ | ❌ | ❌ | ❌ |
| Delete User | ✅ | ❌ | ❌ | ❌ |
| Activate/Deactivate | ✅ | ❌ | ❌ | ❌ |
| **Children Management** |
| Register Child | ✅ | ✅ | ❌ | ❌ |
| View Children | ✅ | 🔸 Nursery | 🔸 Classroom | 🔸 Own |
| Update Child | ✅ | ✅ | ❌ | 🔸 Limited |
| Delete Child | ✅ | ❌ | ❌ | ❌ |
| Transfer Child | ✅ | ✅ | ❌ | ❌ |
| **Attendance** |
| View All Attendance | ✅ | 🔸 Nursery | 🔸 Classroom | 🔸 Own |
| Create Attendance | ✅ | ✅ | ✅ | ❌ |
| Update Attendance | ✅ | ✅ | ✅ | ❌ |
| Delete Attendance | ✅ | ❌ | ❌ | ❌ |
| Check-In/Out | ✅ | ✅ | ✅ | ❌ |
| **Reports** |
| View All Reports | ✅ | 🔸 Nursery | 🔸 Classroom | 🔸 Own |
| Create Report | ✅ | ✅ | ✅ | ❌ |
| Update Report | ✅ | ✅ | ✅ | ❌ |
| Delete Report | ✅ | ❌ | ❌ | ❌ |
| **Notifications** |
| View Notifications | ✅ | ✅ | ✅ | ✅ |
| Create Notification | ✅ | ✅ | ✅ | ❌ |
| Broadcast | ✅ | ✅ | ❌ | ❌ |
| **Files** |
| Upload Files | ✅ | ✅ | ✅ | ❌ |
| View Files | ✅ | 🔸 Nursery | 🔸 Related | 🔸 Own |
| Delete Files | ✅ | ✅ | 🔸 Own | ❌ |
| **Audit Logs** |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |
| **System Settings** |
| Manage Settings | ✅ | ❌ | ❌ | ❌ |
| Backup/Restore | ✅ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full Access
- 🔸 Limited/Scoped Access
- ❌ No Access

---

## 3. API Endpoint Mapping by Role

### 3.1 Admin Endpoints

```javascript
const ADMIN_ENDPOINTS = {
  // Authentication
  auth: {
    login: 'POST /auth/login',
    logout: 'POST /auth/logout',
    changePassword: 'POST /auth/password/change',
    revokeTokens: 'POST /auth/admin/revoke-tokens/{user_id}'
  },
  
  // System
  system: {
    analytics: 'GET /system/analytics',
    health: 'GET /system/system-health'
  },
  
  // Nurseries
  nurseries: {
    list: 'GET /admin/nurseries',
    create: 'POST /admin/nurseries',
    get: 'GET /admin/nurseries/{id}',
    update: 'PUT /admin/nurseries/{id}',
    delete: 'DELETE /admin/nurseries/{id}'
  },
  
  // Branches
  branches: {
    list: 'GET /admin/nurseries/{nursery_id}/branches',
    create: 'POST /admin/nurseries/{nursery_id}/branches',
    get: 'GET /admin/branches/{id}',
    update: 'PUT /admin/branches/{id}',
    delete: 'DELETE /admin/branches/{id}'
  },
  
  // Classrooms
  classrooms: {
    list: 'GET /admin/branches/{branch_id}/classrooms',
    create: 'POST /admin/branches/{branch_id}/classrooms',
    get: 'GET /admin/classrooms/{id}',
    update: 'PUT /admin/classrooms/{id}',
    delete: 'DELETE /admin/classrooms/{id}'
  },
  
  // Users
  users: {
    list: 'GET /admin/users/',
    create: 'POST /admin/users/',
    get: 'GET /admin/users/{id}',
    update: 'PUT /admin/users/{id}',
    delete: 'DELETE /admin/users/{id}',
    activate: 'PUT /admin/users/{id}/activate',
    deactivate: 'PUT /admin/users/{id}/deactivate',
    resetPassword: 'PUT /admin/users/{id}/password'
  },
  
  // Children
  children: {
    list: 'GET /children/',
    create: 'POST /children/',
    get: 'GET /children/{id}',
    update: 'PUT /children/{id}',
    delete: 'DELETE /children/{id}'
  },
  
  // Attendance
  attendance: {
    list: 'GET /attendance/',
    create: 'POST /attendance/',
    get: 'GET /attendance/{id}',
    update: 'PUT /attendance/{id}',
    delete: 'DELETE /attendance/{id}',
    stats: 'GET /attendance/stats/daily'
  },
  
  // Reports
  reports: {
    list: 'GET /reports/',
    create: 'POST /reports/',
    get: 'GET /reports/{id}',
    update: 'PUT /reports/{id}',
    delete: 'DELETE /reports/{id}'
  },
  
  // Files
  files: {
    upload: 'POST /files/upload',
    list: 'GET /files/',
    get: 'GET /files/{id}',
    download: 'GET /files/{id}/download',
    delete: 'DELETE /files/{id}'
  },
  
  // Notifications
  notifications: {
    list: 'GET /notifications/',
    create: 'POST /notifications/',
    broadcast: 'POST /notifications/broadcast',
    markRead: 'PATCH /notifications/{id}/read',
    delete: 'DELETE /notifications/{id}'
  },
  
  // Audit Logs
  auditLogs: {
    list: 'GET /audit-logs/',
    get: 'GET /audit-logs/{id}',
    stats: 'GET /audit-logs/stats',
    byUser: 'GET /audit-logs/user/{user_id}'
  },
  
  // Settings
  settings: {
    getAll: 'GET /admin/settings/',
    security: 'GET /admin/settings/security',
    updateSecurity: 'PATCH /admin/settings/security',
    organization: 'GET /admin/settings/organization',
    updateOrganization: 'PATCH /admin/settings/organization'
  },
  
  // Backup
  backup: {
    create: 'POST /admin/backup/manual',
    list: 'GET /admin/backup/list',
    restore: 'POST /admin/backup/restore',
    delete: 'DELETE /admin/backup/delete/{filename}',
    stats: 'GET /admin/backup/stats'
  }
};
```

### 3.2 Manager Endpoints

```javascript
const MANAGER_ENDPOINTS = {
  // Authentication
  auth: {
    login: 'POST /auth/login',
    logout: 'POST /auth/logout',
    changePassword: 'POST /auth/password/change',
    me: 'GET /auth/me'
  },
  
  // Statistics
  stats: {
    nursery: 'GET /reports/stats/nursery',
    children: 'GET /reports/stats/children'
  },
  
  // Children (Nursery-scoped)
  children: {
    list: 'GET /children/my-nursery/',
    create: 'POST /children/',
    get: 'GET /children/{id}',
    update: 'PUT /children/{id}'
  },
  
  // Attendance (Nursery-scoped)
  attendance: {
    list: 'GET /attendance/my-nursery/',
    create: 'POST /attendance/',
    update: 'PUT /attendance/{id}',
    stats: 'GET /attendance/stats/daily'
  },
  
  // Reports (Nursery-scoped)
  reports: {
    list: 'GET /reports/my-nursery/',
    create: 'POST /reports/',
    update: 'PUT /reports/{id}'
  },
  
  // Staff (View only)
  staff: {
    list: 'GET /admin/users/?nursery_id={nursery_id}&role=supervisor',
    performance: 'GET /audit-logs/user/{user_id}'
  },
  
  // Parents (View only)
  parents: {
    list: 'GET /admin/users/?nursery_id={nursery_id}&role=parent'
  },
  
  // Classrooms (View only)
  classrooms: {
    list: 'GET /admin/branches/{branch_id}/classrooms',
    get: 'GET /admin/classrooms/{id}'
  },
  
  // Files
  files: {
    upload: 'POST /files/upload',
    list: 'GET /files/',
    download: 'GET /files/{id}/download',
    delete: 'DELETE /files/{id}'
  },
  
  // Notifications
  notifications: {
    list: 'GET /notifications/',
    create: 'POST /notifications/',
    broadcast: 'POST /notifications/broadcast',
    markRead: 'PATCH /notifications/{id}/read'
  }
};
```

### 3.3 Supervisor Endpoints

```javascript
const SUPERVISOR_ENDPOINTS = {
  // Authentication
  auth: {
    login: 'POST /auth/login',
    logout: 'POST /auth/logout',
    changePassword: 'POST /auth/password/change',
    me: 'GET /auth/me'
  },
  
  // Children (Classroom-scoped)
  children: {
    list: 'GET /children/my-children/',
    get: 'GET /children/{id}'
  },
  
  // Attendance (Classroom-scoped)
  attendance: {
    list: 'GET /attendance/my-nursery/',
    checkIn: 'POST /attendance/check-in/{child_id}',
    checkOut: 'POST /attendance/check-out/{child_id}',
    create: 'POST /attendance/',
    update: 'PUT /attendance/{id}'
  },
  
  // Reports (Classroom-scoped)
  reports: {
    list: 'GET /reports/my-nursery/',
    create: 'POST /reports/child/{child_id}',
    update: 'PUT /reports/child/{child_id}/date/{date}'
  },
  
  // Files
  files: {
    upload: 'POST /files/upload',
    list: 'GET /files/',
    download: 'GET /files/{id}/download'
  },
  
  // Notifications
  notifications: {
    list: 'GET /notifications/',
    create: 'POST /notifications/',
    markRead: 'PATCH /notifications/{id}/read'
  }
};
```

### 3.4 Parent Endpoints

```javascript
const PARENT_ENDPOINTS = {
  // Authentication
  auth: {
    login: 'POST /auth/login',
    logout: 'POST /auth/logout',
    changePassword: 'POST /auth/password/change',
    me: 'GET /auth/me'
  },
  
  // Children (Own only)
  children: {
    list: 'GET /children/parent/',
    get: 'GET /children/parent/{id}'
  },
  
  // Attendance (Own children only)
  attendance: {
    list: 'GET /attendance/parent/{child_id}',
    stats: 'GET /attendance/parent/{child_id}/stats'
  },
  
  // Reports (Own children only)
  reports: {
    list: 'GET /reports/parent/{child_id}',
    markViewed: 'PATCH /reports/{id}/view'
  },
  
  // Files (Own children only)
  files: {
    list: 'GET /files/?child_id={child_id}',
    download: 'GET /files/{id}/download'
  },
  
  // Notifications
  notifications: {
    list: 'GET /notifications/',
    markRead: 'PATCH /notifications/{id}/read',
    markAllRead: 'PATCH /notifications/read-all',
    unreadCount: 'GET /notifications/unread-count'
  }
};
```

---

## 4. Integration Flow Diagrams

### 4.1 User Login Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─► POST /auth/login
     │   {email, password}
     │
     ▼
┌─────────────────┐
│  Auth Service   │
├─────────────────┤
│ 1. Validate     │
│ 2. Check role   │
│ 3. Generate JWT │
│ 4. Set cookie   │
└────┬────────────┘
     │
     ├─► Return token + user info
     │
     ▼
┌─────────────────┐
│   Frontend      │
├─────────────────┤
│ 1. Store token  │
│ 2. Route by role│
│ 3. Load dashboard│
└─────────────────┘
```

### 4.2 Role-Based Routing

```
Login Success
     │
     ├─► Admin? ──► /admin/dashboard
     │              ├─► System Analytics
     │              ├─► User Management
     │              └─► All Functions
     │
     ├─► Manager? ──► /manager/dashboard
     │                ├─► Nursery Stats
     │                ├─► Children List
     │                └─► Reports
     │
     ├─► Supervisor? ──► /supervisor/dashboard
     │                   ├─► My Classroom
     │                   ├─► Attendance
     │                   └─► Daily Reports
     │
     └─► Parent? ──► /parent/dashboard
                     ├─► My Children
                     ├─► Attendance
                     └─► Daily Reports
```

### 4.3 Data Access Flow

```
API Request
     │
     ├─► JWT Validation
     │   └─► Extract user_id, role
     │
     ├─► Role Check
     │   ├─► Admin: Full access
     │   ├─► Manager: nursery_id filter
     │   ├─► Supervisor: classroom_id filter
     │   └─► Parent: parent_id filter
     │
     ├─► Database Query
     │   └─► Apply role-based filters
     │
     └─► Return filtered data
```

---

## 5. Permission Middleware

### 5.1 Backend Permission Decorator

```python
# app/dependencies.py

from functools import wraps
from fastapi import HTTPException, status

def require_role(*allowed_roles):
    """Decorator to check user role"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user=None, **kwargs):
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated"
                )
            
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {allowed_roles}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Usage example:
@router.get("/admin/users/")
@require_role("admin")
async def get_users(current_user: User = Depends(get_current_user)):
    return users

@router.get("/children/my-nursery/")
@require_role("manager", "supervisor")
async def get_nursery_children(current_user: User = Depends(get_current_user)):
    return children
```

### 5.2 Frontend Route Guards

```javascript
// src/routes/ProtectedRoute.jsx

const ROLE_ROUTES = {
  admin: ['/admin', '/system', '/users', '/nurseries'],
  manager: ['/manager', '/children', '/attendance', '/reports'],
  supervisor: ['/supervisor', '/classroom', '/daily-reports'],
  parent: ['/parent', '/my-children']
};

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, role } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

// Usage:
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminLayout />
  </ProtectedRoute>
} />
```

---

## 6. Data Filtering by Role

### 6.1 Query Filters

```python
# app/services/data_filter.py

def apply_role_filter(query, user, model):
    """Apply role-based filtering to database queries"""
    
    if user.role == "admin":
        # Admin sees everything
        return query
    
    elif user.role == "manager":
        # Manager sees only their nursery
        return query.filter(model.nursery_id == user.nursery_id)
    
    elif user.role == "supervisor":
        # Supervisor sees only their classroom
        return query.join(Child).filter(
            Child.classroom_id == user.classroom_id
        )
    
    elif user.role == "parent":
        # Parent sees only their children
        return query.filter(model.parent_id == user.id)
    
    return query

# Usage:
def get_children(db: Session, user: User):
    query = db.query(Child)
    query = apply_role_filter(query, user, Child)
    return query.all()
```

### 6.2 Response Filtering

```python
# app/schemas.py

class ChildResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    # ... other fields
    
    @classmethod
    def from_orm_with_role(cls, child, user_role):
        """Filter response based on user role"""
        data = cls.from_orm(child)
        
        if user_role == "parent":
            # Parents don't see internal notes
            data.internal_notes = None
        
        return data
```

---

## 7. Integration Examples

### 7.1 Admin Creates User

```javascript
// Frontend
async function createUser(userData) {
  const response = await apiClient.post('/admin/users/', {
    email: userData.email,
    first_name: userData.firstName,
    last_name: userData.lastName,
    role: userData.role,
    nursery_id: userData.nurseryId,
    password: generateTempPassword()
  });
  
  // Send welcome notification
  await apiClient.post('/notifications/', {
    user_id: response.data.id,
    title: 'Welcome to Nursery System',
    message: 'Your account has been created',
    type: 'info'
  });
  
  return response.data;
}
```

### 7.2 Manager Views Children

```javascript
// Frontend
async function getMyNurseryChildren() {
  // Manager's nursery_id is automatically applied by backend
  const response = await apiClient.get('/children/my-nursery/', {
    params: {
      skip: 0,
      limit: 100,
      status: 'active'
    }
  });
  
  return response.data;
}
```

### 7.3 Supervisor Checks In Child

```javascript
// Frontend
async function checkInChild(childId) {
  const response = await apiClient.post(
    `/attendance/check-in/${childId}`,
    {
      notes: 'Arrived with father'
    }
  );
  
  // Notification sent automatically to parent by backend
  
  return response.data;
}
```

### 7.4 Parent Views Daily Report

```javascript
// Frontend
async function getChildReport(childId, date) {
  const response = await apiClient.get(
    `/reports/parent/${childId}`,
    {
      params: {
        date_from: date,
        date_to: date
      }
    }
  );
  
  // Mark as viewed
  if (response.data.reports.length > 0) {
    await apiClient.patch(
      `/reports/${response.data.reports[0].id}/view`
    );
  }
  
  return response.data;
}
```

---

## 8. Cross-Role Integration Points

### 8.1 Child Registration Flow

```
Admin/Manager Creates Child
         │
         ├─► POST /children/
         │   {child_data, parent_id, classroom_id}
         │
         ▼
    Backend Processing
         │
         ├─► Create child record
         ├─► Link to parent
         ├─► Assign to classroom
         ├─► Initialize attendance
         │
         ├─► Notify Parent
         │   POST /notifications/
         │
         └─► Notify Supervisor
             POST /notifications/
```

### 8.2 Daily Report Flow

```
Supervisor Creates Report
         │
         ├─► POST /reports/child/{child_id}
         │   {activities, meals, naps, mood}
         │
         ▼
    Backend Processing
         │
         ├─► Create report record
         ├─► Upload photos (if any)
         │
         ├─► Notify Parent
         │   POST /notifications/
         │   "Daily report available"
         │
         ▼
Parent Views Report
         │
         ├─► GET /reports/parent/{child_id}
         │
         └─► PATCH /reports/{id}/view
             (Mark as viewed)
```

### 8.3 Attendance Tracking Flow

```
Supervisor Check-In
         │
         ├─► POST /attendance/check-in/{child_id}
         │
         ▼
    Backend Processing
         │
         ├─► Create attendance record
         ├─► Update statistics
         │
         ├─► Notify Parent
         │   "Child checked in at 08:30"
         │
         └─► Update Manager Dashboard
             (Real-time stats)
         
         ▼
Parent Receives Notification
         │
         └─► Views in app
             GET /attendance/parent/{child_id}
```

---

## 9. API Integration Summary

### 9.1 Shared Endpoints (All Roles)

```
POST   /auth/login
POST   /auth/logout
POST   /auth/password/change
GET    /auth/me
GET    /notifications/
PATCH  /notifications/{id}/read
GET    /notifications/unread-count
```

### 9.2 Admin-Only Endpoints

```
POST   /admin/nurseries
POST   /admin/users/
DELETE /admin/users/{id}
GET    /audit-logs/
POST   /admin/backup/manual
GET    /system/analytics
```

### 9.3 Manager + Admin Endpoints

```
GET    /children/my-nursery/
POST   /children/
GET    /reports/stats/nursery
POST   /notifications/broadcast
```

### 9.4 Supervisor + Manager + Admin Endpoints

```
POST   /attendance/check-in/{child_id}
POST   /attendance/check-out/{child_id}
POST   /reports/child/{child_id}
POST   /files/upload
```

### 9.5 Parent-Only Endpoints

```
GET    /children/parent/
GET    /attendance/parent/{child_id}
GET    /reports/parent/{child_id}
PATCH  /reports/{id}/view
```

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
