# Nursery Management System - API Documentation

## Overview

The Nursery Management System API provides comprehensive endpoints for managing nurseries, users, children, attendance, and reporting. The API follows REST principles and uses JWT for authentication.

**Base URL**: `http://localhost:8000`
**API Documentation**: `http://localhost:8000/docs` (Swagger UI)
**Alternative API Documentation**: `http://localhost:8000/redoc` (ReDoc)

## Authentication

### Login
**POST** `/auth/login`

Login with email and password to receive access and refresh tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "YourPassword123!"
}
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Get Current User
**GET** `/auth/me`

Get information about the currently authenticated user.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "ADMIN",
  "is_active": true
}
```

### Change Password
**POST** `/auth/change-password`

Change the password for the currently authenticated user.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

## Admin Endpoints

### Nursery Management

#### List All Nurseries
**GET** `/admin/nurseries`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
[
  {
    "id": 1,
    "name": "Happy Kids Nursery",
    "address": "123 Main St",
    "phone": "+962123456789",
    "email": "info@happykids.com",
    "capacity": 100,
    "is_active": true
  }
]
```

#### Create Nursery
**POST** `/admin/nurseries`

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "name": "New Nursery",
  "address": "456 Oak Ave",
  "phone": "+962987654321",
  "email": "info@newnursery.com",
  "capacity": 50
}
```

#### Update Nursery
**PUT** `/admin/nurseries/{nursery_id}`

**Headers**: `Authorization: Bearer {access_token}`

#### Delete Nursery
**DELETE** `/admin/nurseries/{nursery_id}`

**Headers**: `Authorization: Bearer {access_token}`

### User Management

#### List All Users
**GET** `/admin/users`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `role` (optional): Filter by role (ADMIN, MANAGER, PARENT, SUPERVISOR)
- `nursery_id` (optional): Filter by nursery
- `is_active` (optional): Filter by active status

#### Create User
**POST** `/admin/users`

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+962555123456",
  "role": "MANAGER",
  "nursery_id": 1,
  "password": "TempPassword123!"
}
```

#### Update User
**PUT** `/admin/users/{user_id}`

**Headers**: `Authorization: Bearer {access_token}`

#### Deactivate User
**DELETE** `/admin/users/{user_id}`

**Headers**: `Authorization: Bearer {access_token}`

## Manager Endpoints

### Dashboard
**GET** `/manager/dashboard`

Get dashboard overview with statistics for the manager's nursery.

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "total_children": 45,
  "present_today": 38,
  "absent_today": 7,
  "total_staff": 12,
  "capacity_utilization": 0.45
}
```

### Children Management
**GET** `/manager/children`
**POST** `/manager/children`
**PUT** `/manager/children/{child_id}`
**DELETE** `/manager/children/{child_id}`

### Supervisors Management
**GET** `/manager/supervisors`
**POST** `/manager/supervisors`
**PUT** `/manager/supervisors/{supervisor_id}`

### Reports
**GET** `/manager/reports/attendance`
**GET** `/manager/reports/children`

## Parent Endpoints

### Dashboard
**GET** `/parent/dashboard`

Get overview of parent's children and recent updates.

**Headers**: `Authorization: Bearer {access_token}`

### Children
**GET** `/parent/children`

Get list of parent's children with current status.

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
[
  {
    "id": 1,
    "first_name": "Ahmed",
    "last_name": "Ali",
    "date_of_birth": "2020-05-15",
    "nursery_id": 1,
    "status": "PRESENT",
    "last_attendance": "2025-10-30T08:30:00"
  }
]
```

### Notifications
**GET** `/parent/notifications`

Get notifications related to parent's children.

### Reports
**GET** `/parent/reports`

Get attendance and activity reports for parent's children.

## Supervisor Endpoints

### Dashboard
**GET** `/supervisor/dashboard`

Get supervisor dashboard with assigned children and daily tasks.

**Headers**: `Authorization: Bearer {access_token}`

### Reports
**GET** `/supervisor/reports`

Access and submit daily activity reports.

## Children Management

### List Children
**GET** `/children`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `nursery_id` (optional): Filter by nursery
- `status` (optional): Filter by status

### Get Child Details
**GET** `/children/{child_id}`

**Headers**: `Authorization: Bearer {access_token}`

### Create Child
**POST** `/children`

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "first_name": "Ahmed",
  "last_name": "Ali",
  "date_of_birth": "2020-05-15",
  "gender": "MALE",
  "nursery_id": 1,
  "medical_info": "No known allergies",
  "emergency_contact": "+962999888777"
}
```

## Attendance Management

### Mark Attendance
**POST** `/attendance/check-in`

Mark a child as present for the day.

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "child_id": 1,
  "check_in_time": "2025-10-30T08:30:00",
  "notes": "Arrived with parent"
}
```

### Mark Check-out
**POST** `/attendance/check-out`

Mark a child's departure.

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "child_id": 1,
  "check_out_time": "2025-10-30T15:30:00",
  "notes": "Picked up by mother"
}
```

### Get Attendance Records
**GET** `/attendance`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `nursery_id` (optional): Filter by nursery
- `child_id` (optional): Filter by child
- `date_from` (optional): Start date
- `date_to` (optional): End date

## Reporting

### Attendance Report
**GET** `/reports/attendance`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `nursery_id` (required)
- `start_date` (required)
- `end_date` (required)
- `format` (optional): json, csv, pdf

### Children Report
**GET** `/reports/children`

Get summary report of all children in a nursery.

**Headers**: `Authorization: Bearer {access_token}`

### Financial Report
**GET** `/reports/financial`

Get financial summary for a nursery (admin/manager only).

**Headers**: `Authorization: Bearer {access_token}`

## Notifications

### Get Notifications
**GET** `/notifications`

Get notifications for the current user.

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
[
  {
    "id": 1,
    "title": "Child Absent",
    "message": "Ahmed Ali was marked absent today",
    "type": "ATTENDANCE",
    "is_read": false,
    "created_at": "2025-10-30T09:00:00"
  }
]
```

### Mark Notification as Read
**PUT** `/notifications/{notification_id}/read`

**Headers**: `Authorization: Bearer {access_token}`

## File Management

### Upload File
**POST** `/files/upload`

Upload a file (photo, document, etc.).

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: The file to upload
- `type`: File type (PHOTO, DOCUMENT, REPORT)
- `related_id`: Related entity ID (child_id, user_id, etc.)

### Get File
**GET** `/files/{file_id}`

Download a file.

**Headers**: `Authorization: Bearer {access_token}`

## Audit Logs

### Get Audit Logs
**GET** `/audit/logs`

Get audit trail of system actions (admin only).

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `user_id` (optional): Filter by user
- `action` (optional): Filter by action type
- `start_date` (optional)
- `end_date` (optional)

## Settings

### Get System Settings
**GET** `/settings`

**Headers**: `Authorization: Bearer {access_token}`

### Update System Settings
**PUT** `/settings`

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "notification_enabled": true,
  "auto_backup_enabled": true,
  "max_file_size_mb": 10,
  "session_timeout_minutes": 30
}
```

## Backup & Restore

### Create Backup
**POST** `/backup/create`

Create a system backup (admin only).

**Headers**: `Authorization: Bearer {access_token}`

### List Backups
**GET** `/backup/list`

**Headers**: `Authorization: Bearer {access_token}`

### Restore Backup
**POST** `/backup/restore/{backup_id}`

**Headers**: `Authorization: Bearer {access_token}`

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General endpoints: 60 requests per minute
- File upload endpoints: 10 requests per minute

## Pagination

List endpoints support pagination using the following query parameters:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 100, max: 1000)

Example: `/admin/users?skip=0&limit=50`

## Data Validation

All endpoints validate input data. Common validation rules:
- Email: Must be valid email format
- Phone: Must start with + and country code
- Password: Minimum 8 characters, must include uppercase, lowercase, and numbers
- Dates: ISO 8601 format (YYYY-MM-DD)
- Times: ISO 8601 format (YYYY-MM-DDTHH:MM:SS)

## WebSocket Support

Real-time notifications are available via WebSocket:

**Endpoint**: `ws://localhost:8000/ws/{user_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Message Format**:
```json
{
  "type": "notification",
  "data": {
    "title": "New Notification",
    "message": "You have a new message",
    "timestamp": "2025-10-30T10:00:00"
  }
}
```

## Security

- All API endpoints (except login) require valid JWT token
- Tokens expire after 30 minutes
- Refresh tokens can be used to obtain new access tokens
- Role-based access control (RBAC) enforced on all endpoints
- Rate limiting prevents brute force attacks
- Input validation prevents injection attacks
- CORS configured for allowed origins only

## Support

For API support or questions:
- Email: support@nurserysystem.com
- Documentation: http://localhost:8000/docs
