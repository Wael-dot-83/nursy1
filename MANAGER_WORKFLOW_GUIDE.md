# 🏢 Manager Complete Workflow Guide
## Nursery Management System - Production-Ready Operations Manual

**Version:** 2.0.0 (Validated & Optimized)  
**Last Updated:** 2025-11-02  
**Role:** Manager  
**Access Level:** Nursery-Wide Management  
**Database:** MySQL 8.0+ / SQLite 3.x Compatible  
**Backend:** FastAPI 0.109+ | **Frontend:** React 18

---

## 📋 Table of Contents

1. [Authentication & Access](#1-authentication--access)
2. [Manager Dashboard](#2-manager-dashboard)
3. [Children Management](#3-children-management)
4. [Attendance Management](#4-attendance-management)
5. [Daily Reports Management](#5-daily-reports-management)
6. [Staff Management (Supervisors)](#6-staff-management-supervisors)
7. [Parent Management](#7-parent-management)
8. [Classroom Management](#8-classroom-management)
9. [Nursery Information](#9-nursery-information)
10. [Notifications](#10-notifications)
11. [Reports & Analytics](#11-reports--analytics)
12. [Complete Workflows](#12-complete-workflows)
13. [Data Validations & Business Rules](#13-data-validations--business-rules)
14. [Troubleshooting & Common Issues](#14-troubleshooting--common-issues)

---

## 1. Authentication & Access

### 🔐 Manager Login Credentials
- **Email:** `manager@nursery.com`
- **Password:** `Manager123!`
- **Role:** `manager`
- **Nursery ID:** `1` (Auto-assigned)
- **Access Scope:** All branches, children, and staff within assigned nursery
- **Permissions:** Read/Write for children, supervisors, parents, reports, classrooms

### Login Process

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "manager@nursery.com",
  "password": "Manager123!"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwicm9sZSI6Im1hbmFnZXIiLCJleHAiOjE3MDU0MjMyMDB9...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "manager@nursery.com",
    "first_name": "Manager",
    "last_name": "User",
    "role": "manager",
    "nursery_id": 1,
    "is_active": true,
    "created_at": "2025-01-01T10:00:00"
  }
}
```

**Important:** Refresh token is set as httpOnly cookie (not in response body).

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account disabled
- `429 Too Many Requests`: Rate limit exceeded (5 attempts per 15 minutes)

### Authorization Headers
All authenticated requests require:
```http
Authorization: Bearer {access_token}
```

**Token Lifetime:**
- Access Token: 30 minutes
- Refresh Token: 7 days

### Token Refresh

**Endpoint:** `POST /auth/refresh`

**Headers:** Requires refresh token in httpOnly cookie (sent automatically by browser)

**Success Response (200 OK):**
```json
{
  "access_token": "new_access_token_here",
  "token_type": "bearer"
}
```

**Error Response:**
- `401 Unauthorized`: Refresh token expired or invalid

### Logout

**Endpoint:** `POST /auth/logout`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Note:** Clears refresh token cookie and invalidates tokens.

---

## 2. Manager Dashboard

### 📊 Get Dashboard Overview

**Endpoint:** `GET /manager/dashboard`

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "totalChildren": 150,
  "totalSupervisors": 12,
  "pendingReports": 8,
  "approvedReports": 142,
  "recentReports": [
    {
      "id": 301,
      "childName": "Sarah Ahmad",
      "date": "2025-01-16",
      "status": "submitted",
      "supervisorName": "Supervisor"
    },
    {
      "id": 300,
      "childName": "Omar Khalil",
      "date": "2025-01-16",
      "status": "submitted",
      "supervisorName": "Supervisor"
    }
  ]
}
```

**Note:** This endpoint filters data to manager's nursery automatically.

### 📈 Get Nursery Statistics

**Endpoint:** `GET /reports/stats/nursery`

**Response (200 OK):**
```json
{
  "total_children": 150,
  "total_staff": 15,
  "total_classrooms": 8,
  "present_today": 138,
  "absent_today": 12,
  "attendance_rate": 92.0
}
```

**Calculation Details:**
- `attendance_rate`: (present_today / total_children) × 100
- `total_staff`: Managers + Supervisors in nursery
- Data scoped to manager's `nursery_id`

### 📊 Get Children Statistics

**Endpoint:** `GET /reports/stats/children`

**Response (200 OK):**
```json
{
  "total_children": 150,
  "active_children": 148,
  "by_classroom": {
    "Infants": 25,
    "Toddlers": 30,
    "Preschool A": 28,
    "Preschool B": 27,
    "Kindergarten": 40
  },
  "attendance_rate": 92.5
}
```

**Note:** `attendance_rate` calculated over last 30 days.

---

## 3. Children Management

### View Nursery Children
**Endpoint:** `GET /children/my-nursery/?skip=0&limit=100`

**Input Parameters:**
- `skip`: Pagination offset (default: 0)
- `limit`: Results per page (default: 100)
- `classroom_id`: Filter by classroom (optional)
- `status`: Filter by status (optional: active/inactive/graduated)

**Output:**
```json
[
  {
    "id": 1,
    "first_name": "Sara",
    "last_name": "Ahmed",
    "date_of_birth": "2022-03-15",
    "gender": "female",
    "medical_info": "No allergies",
    "emergency_contact": "Mother - Fatima Ahmed",
    "emergency_phone": "0791234567",
    "classroom_id": 1,
    "classroom_name": "Toddlers Room A",
    "parent_id": 4,
    "parent_name": "Fatima Ahmed",
    "status": "active",
    "created_at": "2025-01-01T08:00:00",
    "updated_at": "2025-01-15T10:30:00"
  }
]
```

### Register New Child
**Endpoint:** `POST /children/`

**Input:**
```json
{
  "first_name": "Omar",
  "last_name": "Khalil",
  "date_of_birth": "2023-06-20",
  "gender": "male",
  "medical_info": "Asthma - requires inhaler",
  "emergency_contact": "Father - Khalil Omar",
  "emergency_phone": "0791234568",
  "classroom_id": 2,
  "parent_id": 5
}
```

**Output:**
```json
{
  "id": 15,
  "first_name": "Omar",
  "last_name": "Khalil",
  "date_of_birth": "2023-06-20",
  "gender": "male",
  "medical_info": "Asthma - requires inhaler",
  "emergency_contact": "Father - Khalil Omar",
  "emergency_phone": "0791234568",
  "classroom_id": 2,
  "parent_id": 5,
  "status": "active",
  "created_at": "2025-01-15T11:00:00",
  "updated_at": "2025-01-15T11:00:00"
}
```

**Workflow:**
1. Verify parent exists in system
2. Check classroom capacity
3. Validate age matches classroom age group
4. Create child record
5. Send notification to parent
6. Initialize attendance tracking
7. Notify assigned supervisor

### Update Child Information
**Endpoint:** `PUT /children/{child_id}`

**Input:**
```json
{
  "medical_info": "Asthma - requires inhaler. Updated medication protocol.",
  "emergency_phone": "0791234569"
}
```

**Output:**
```json
{
  "id": 15,
  "first_name": "Omar",
  "last_name": "Khalil",
  "medical_info": "Asthma - requires inhaler. Updated medication protocol.",
  "emergency_phone": "0791234569",
  "updated_at": "2025-01-15T14:30:00"
}
```

### Transfer Child to Different Classroom
**Endpoint:** `PUT /children/{child_id}`

**Input:**
```json
{
  "classroom_id": 3
}
```

**Output:**
```json
{
  "id": 15,
  "classroom_id": 3,
  "classroom_name": "Preschool Room A",
  "updated_at": "2025-01-15T15:00:00",
  "message": "Child transferred successfully"
}
```

**Workflow:**
1. Verify target classroom has capacity
2. Check age compatibility
3. Update classroom assignment
4. Notify old supervisor
5. Notify new supervisor
6. Notify parent
7. Transfer attendance records

---

## 4. Attendance Management

### View Nursery Attendance
**Endpoint:** `GET /attendance/my-nursery/?skip=0&limit=100`

**Input Parameters:**
- `skip`: Pagination offset
- `limit`: Results per page
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `status`: Filter by status (present/absent/late)

**Output:**
```json
[
  {
    "id": 1,
    "child_id": 1,
    "child_name": "Sara Ahmed",
    "classroom_name": "Toddlers Room A",
    "date": "2025-01-15",
    "check_in_time": "08:30:00",
    "check_out_time": "15:45:00",
    "status": "present",
    "created_at": "2025-01-15T08:30:00",
    "updated_at": "2025-01-15T15:45:00"
  },
  {
    "id": 2,
    "child_id": 2,
    "child_name": "Ali Mohammad",
    "classroom_name": "Toddlers Room A",
    "date": "2025-01-15",
    "check_in_time": null,
    "check_out_time": null,
    "status": "absent",
    "created_at": "2025-01-15T08:00:00",
    "updated_at": "2025-01-15T08:00:00"
  }
]
```

### Get Daily Attendance Statistics
**Endpoint:** `GET /attendance/stats/daily?target_date=2025-01-15`

**Input Parameters:**
- `target_date`: Date to check (YYYY-MM-DD, optional - defaults to today)

**Output:**
```json
{
  "date": "2025-01-15",
  "present": 45,
  "absent": 5,
  "late": 3,
  "total": 53,
  "attendance_rate": 84.9,
  "by_classroom": {
    "Toddlers Room A": {
      "present": 13,
      "absent": 2,
      "total": 15
    },
    "Toddlers Room B": {
      "present": 12,
      "absent": 2,
      "total": 14
    }
  }
}
```

### Create Attendance Record
**Endpoint:** `POST /attendance/`

**Input:**
```json
{
  "child_id": 15,
  "date": "2025-01-16",
  "check_in_time": "08:45:00",
  "status": "present"
}
```

**Output:**
```json
{
  "id": 150,
  "child_id": 15,
  "date": "2025-01-16",
  "check_in_time": "08:45:00",
  "check_out_time": null,
  "status": "present",
  "created_at": "2025-01-16T08:45:00",
  "updated_at": "2025-01-16T08:45:00"
}
```

### Update Attendance Record
**Endpoint:** `PUT /attendance/{attendance_id}`

**Input:**
```json
{
  "check_out_time": "15:30:00"
}
```

**Output:**
```json
{
  "id": 150,
  "child_id": 15,
  "date": "2025-01-16",
  "check_in_time": "08:45:00",
  "check_out_time": "15:30:00",
  "status": "present",
  "updated_at": "2025-01-16T15:30:00"
}
```

---

## 5. Reports Management

### View Nursery Reports
**Endpoint:** `GET /reports/my-nursery/?skip=0&limit=100`

**Input Parameters:**
- `skip`: Pagination offset
- `limit`: Results per page
- `date_from`: Start date
- `date_to`: End date

**Output:**
```json
[
  {
    "id": 1,
    "child_id": 1,
    "child_name": "Sara Ahmed",
    "date": "2025-01-15",
    "activities": "Painting, storytelling, outdoor play",
    "meals": "Breakfast: cereal and milk, Lunch: chicken with rice",
    "naps": "12:00 PM - 2:00 PM (2 hours)",
    "mood": "happy",
    "notes": "Very active and engaged today. Enjoyed painting activity.",
    "supervisor_name": "Layla Ibrahim",
    "created_at": "2025-01-15T16:00:00",
    "updated_at": "2025-01-15T16:00:00"
  }
]
```

### Generate Monthly Report
**Endpoint:** `GET /reports/my-nursery/?date_from=2025-01-01&date_to=2025-01-31`

**Input Parameters:**
- `date_from`: 2025-01-01
- `date_to`: 2025-01-31

**Output:**
```json
{
  "period": "January 2025",
  "total_reports": 1590,
  "children_count": 53,
  "average_attendance": 84.9,
  "reports_by_classroom": {
    "Toddlers Room A": 450,
    "Toddlers Room B": 420,
    "Preschool Room A": 360,
    "Preschool Room B": 270,
    "Infants Room": 90
  },
  "mood_distribution": {
    "happy": 1200,
    "calm": 250,
    "excited": 100,
    "tired": 30,
    "sad": 10
  }
}
```

---

## 6. Staff Management (Supervisors)

### View Nursery Staff
**Endpoint:** `GET /admin/users/?nursery_id=1&role=supervisor`

**Input Parameters:**
- `nursery_id`: Automatically set from manager's nursery
- `role`: supervisor

**Output:**
```json
[
  {
    "id": 3,
    "email": "supervisor@nursery.com",
    "first_name": "Layla",
    "last_name": "Ibrahim",
    "phone": "0791234569",
    "role": "supervisor",
    "nursery_id": 1,
    "is_active": true,
    "assigned_classrooms": [
      {
        "id": 1,
        "name": "Toddlers Room A",
        "children_count": 15
      }
    ],
    "created_at": "2025-01-01T00:00:00"
  }
]
```

### Monitor Supervisor Performance
**Endpoint:** `GET /audit-logs/user/{user_id}?days=30`

**Input Parameters:**
- `user_id`: Supervisor ID
- `days`: Number of days to review (default: 30)

**Output:**
```json
{
  "user_id": 3,
  "user_name": "Layla Ibrahim",
  "period": "Last 30 days",
  "total_actions": 450,
  "actions_by_type": {
    "attendance_check_in": 300,
    "attendance_check_out": 280,
    "report_created": 300,
    "report_updated": 50
  },
  "daily_reports_completed": 28,
  "attendance_records": 580,
  "average_report_time": "16:15:00"
}
```

---

## 7. Parent Communication

### View Parents List
**Endpoint:** `GET /admin/users/?nursery_id=1&role=parent`

**Input Parameters:**
- `nursery_id`: Automatically set
- `role`: parent

**Output:**
```json
[
  {
    "id": 4,
    "email": "parent@nursery.com",
    "first_name": "Fatima",
    "last_name": "Ahmed",
    "phone": "0791234567",
    "role": "parent",
    "nursery_id": 1,
    "children": [
      {
        "id": 1,
        "name": "Sara Ahmed",
        "classroom": "Toddlers Room A"
      }
    ],
    "is_active": true
  }
]
```

### Send Notification to Parent
**Endpoint:** `POST /notifications/`

**Input:**
```json
{
  "user_id": 4,
  "title": "Important Update",
  "message": "Please update your child's emergency contact information",
  "type": "warning",
  "link": "/children/1"
}
```

**Output:**
```json
{
  "id": 50,
  "user_id": 4,
  "title": "Important Update",
  "message": "Please update your child's emergency contact information",
  "type": "warning",
  "link": "/children/1",
  "is_read": false,
  "created_at": "2025-01-15T10:00:00"
}
```

### Broadcast Announcement
**Endpoint:** `POST /notifications/broadcast`

**Input:**
```json
{
  "title": "Holiday Notice",
  "message": "The nursery will be closed on January 25th for national holiday",
  "type": "info",
  "role": "parent"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Notification sent to 25 parents",
  "recipients_count": 25
}
```

---

## 8. Classroom Management

### View Classrooms
**Endpoint:** `GET /admin/branches/{branch_id}/classrooms`

**Input Parameters:**
- `branch_id`: Branch ID within manager's nursery

**Output:**
```json
[
  {
    "id": 1,
    "name": "Toddlers Room A",
    "capacity": 15,
    "current_enrollment": 15,
    "age_group": "12-24 months",
    "supervisor_id": 3,
    "supervisor_name": "Layla Ibrahim",
    "branch_id": 1,
    "status": "full",
    "created_at": "2025-01-01T00:00:00"
  },
  {
    "id": 2,
    "name": "Toddlers Room B",
    "capacity": 15,
    "current_enrollment": 14,
    "age_group": "12-24 months",
    "supervisor_id": 6,
    "supervisor_name": "Noor Salem",
    "branch_id": 1,
    "status": "active",
    "created_at": "2025-01-01T00:00:00"
  }
]
```

### Monitor Classroom Capacity
**Endpoint:** `GET /admin/classrooms/{classroom_id}`

**Input Parameters:**
- `classroom_id`: Classroom ID

**Output:**
```json
{
  "id": 1,
  "name": "Toddlers Room A",
  "capacity": 15,
  "current_enrollment": 15,
  "available_slots": 0,
  "utilization_rate": 100,
  "children": [
    {
      "id": 1,
      "name": "Sara Ahmed",
      "age_months": 22,
      "status": "active"
    }
  ],
  "supervisor": {
    "id": 3,
    "name": "Layla Ibrahim",
    "phone": "0791234569"
  }
}
```

---

## 9. File Management

### Upload Document
**Endpoint:** `POST /files/upload`

**Input:** (multipart/form-data)
- `file`: File to upload
- `description`: "Monthly attendance report - January 2025"

**Output:**
```json
{
  "id": 10,
  "filename": "attendance_jan_2025_abc123.pdf",
  "original_filename": "attendance_january_2025.pdf",
  "file_path": "/storage/uploads/attendance_jan_2025_abc123.pdf",
  "file_size": 245678,
  "content_type": "application/pdf",
  "uploaded_by": 2,
  "description": "Monthly attendance report - January 2025",
  "created_at": "2025-01-15T16:00:00"
}
```

### List Uploaded Files
**Endpoint:** `GET /files/?skip=0&limit=50`

**Input Parameters:**
- `skip`: Pagination offset
- `limit`: Results per page

**Output:**
```json
[
  {
    "id": 10,
    "filename": "attendance_jan_2025_abc123.pdf",
    "original_filename": "attendance_january_2025.pdf",
    "file_size": 245678,
    "content_type": "application/pdf",
    "uploaded_by": 2,
    "uploader_name": "Ahmad Hassan",
    "description": "Monthly attendance report - January 2025",
    "created_at": "2025-01-15T16:00:00"
  }
]
```

### Download File
**Endpoint:** `GET /files/{file_id}/download`

**Input Parameters:**
- `file_id`: File ID

**Output:** Binary file stream with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="attendance_january_2025.pdf"
```

---

## 10. Common Manager Workflows

### Workflow 1: Daily Morning Routine
1. Login to system
2. Check daily attendance statistics
3. Review absent children
4. Contact parents of absent children
5. Monitor supervisor check-ins
6. Review any urgent notifications

### Workflow 2: Register New Child
1. Receive registration request
2. Verify parent account exists
3. Check classroom availability
4. Collect child information and documents
5. Create child record in system
6. Assign to appropriate classroom
7. Upload required documents
8. Send welcome notification to parent
9. Brief assigned supervisor

### Workflow 3: Monthly Reporting
1. Generate attendance report for month
2. Review daily reports completion rate
3. Compile statistics by classroom
4. Identify trends and issues
5. Create summary report
6. Upload report to system
7. Share with admin
8. Archive for records

### Workflow 4: Handle Parent Complaint
1. Receive complaint notification
2. Review child's recent reports
3. Check attendance history
4. Consult with supervisor
5. Investigate issue
6. Document findings
7. Respond to parent
8. Implement corrective actions
9. Follow up after resolution

### Workflow 5: Staff Performance Review
1. Access supervisor audit logs
2. Review daily report completion
3. Check attendance record accuracy
4. Analyze response times
5. Review parent feedback
6. Document performance
7. Schedule review meeting
8. Create improvement plan if needed

---

## 11. Notifications Management

### View Notifications
**Endpoint:** `GET /notifications/?skip=0&limit=50&unread_only=true`

**Input Parameters:**
- `skip`: Pagination offset
- `limit`: Results per page
- `unread_only`: Show only unread (true/false)

**Output:**
```json
[
  {
    "id": 1,
    "title": "New Child Registered",
    "message": "Omar Khalil has been registered in Toddlers Room B",
    "type": "success",
    "is_read": false,
    "link": "/children/15",
    "created_at": "2025-01-15T11:00:00"
  },
  {
    "id": 2,
    "title": "Attendance Alert",
    "message": "5 children absent today - higher than usual",
    "type": "warning",
    "is_read": false,
    "link": "/attendance",
    "created_at": "2025-01-15T09:00:00"
  }
]
```

### Mark Notification as Read
**Endpoint:** `PATCH /notifications/{notification_id}/read`

**Input Parameters:**
- `notification_id`: Notification ID

**Output:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Get Unread Count
**Endpoint:** `GET /notifications/unread-count`

**Input:** None

**Output:**
```json
{
  "unread_count": 5
}
```

---

## 12. Reports & Analytics

### Generate Custom Report
**Input Parameters:**
- Report type
- Date range
- Filters (classroom, child, supervisor)

**Available Reports:**
1. **Attendance Summary** - Daily/weekly/monthly attendance
2. **Child Progress** - Individual child development
3. **Classroom Performance** - Classroom statistics
4. **Staff Activity** - Supervisor performance
5. **Parent Engagement** - Parent interaction metrics

### Export Data
**Formats:**
- PDF - Formatted reports
- Excel - Data analysis
- CSV - Raw data export

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
