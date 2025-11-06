# 👨‍🏫 Supervisor Complete Workflow Guide

## Role Overview
Supervisor manages daily classroom operations, attendance tracking, and child reports.

**Credentials:**
- Email: `supervisor@nursery.com`
- Password: `Supervisor123!`

---

## 1. Authentication

### Login
**Endpoint:** `POST /auth/login`

**Input:**
```json
{
  "email": "supervisor@nursery.com",
  "password": "Supervisor123!"
}
```

**Output:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 3,
    "email": "supervisor@nursery.com",
    "first_name": "Layla",
    "last_name": "Ibrahim",
    "role": "supervisor",
    "nursery_id": 1,
    "classroom_id": 1,
    "is_active": true
  }
}
```

---

## 2. My Classroom Dashboard

### View My Children
**Endpoint:** `GET /children/my-children/`

**Input:** None (uses authenticated supervisor's classroom)

**Output:**
```json
[
  {
    "id": 1,
    "first_name": "Sara",
    "last_name": "Ahmed",
    "date_of_birth": "2022-03-15",
    "age_months": 22,
    "gender": "female",
    "medical_info": "No allergies",
    "emergency_contact": "Mother - Fatima Ahmed",
    "emergency_phone": "0791234567",
    "parent_id": 4,
    "parent_name": "Fatima Ahmed",
    "parent_email": "parent@nursery.com",
    "status": "active",
    "photo_url": "/storage/children/sara_ahmed.jpg"
  },
  {
    "id": 2,
    "first_name": "Ali",
    "last_name": "Mohammad",
    "date_of_birth": "2022-05-20",
    "age_months": 20,
    "gender": "male",
    "medical_info": "Lactose intolerant",
    "emergency_contact": "Father - Mohammad Ali",
    "emergency_phone": "0791234570",
    "parent_id": 5,
    "parent_name": "Mohammad Ali",
    "status": "active"
  }
]
```

---

## 3. Attendance Management

### Morning Check-In Process

#### Check In Child
**Endpoint:** `POST /attendance/check-in/{child_id}`

**Input Parameters:**
- `child_id`: Child ID to check in

**Input Body:** (optional)
```json
{
  "notes": "Arrived with father, brought lunch box"
}
```

**Output:**
```json
{
  "id": 150,
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "date": "2025-01-16",
  "check_in_time": "08:30:15",
  "check_out_time": null,
  "status": "present",
  "notes": "Arrived with father, brought lunch box",
  "created_at": "2025-01-16T08:30:15",
  "message": "Sara Ahmed checked in successfully"
}
```

**Workflow:**
1. Scan/select child from list
2. System records current time
3. Status automatically set to "present"
4. Parent receives notification
5. Attendance record created

#### Bulk Check-In (Morning Arrival)
**Endpoint:** `POST /attendance/bulk-check-in`

**Input:**
```json
{
  "children": [
    {"child_id": 1, "time": "08:30:00"},
    {"child_id": 2, "time": "08:35:00"},
    {"child_id": 3, "time": "08:40:00"}
  ],
  "date": "2025-01-16"
}
```

**Output:**
```json
{
  "success": true,
  "checked_in": 3,
  "records": [
    {
      "child_id": 1,
      "child_name": "Sara Ahmed",
      "check_in_time": "08:30:00",
      "status": "present"
    },
    {
      "child_id": 2,
      "child_name": "Ali Mohammad",
      "check_in_time": "08:35:00",
      "status": "present"
    },
    {
      "child_id": 3,
      "child_name": "Lina Hassan",
      "check_in_time": "08:40:00",
      "status": "present"
    }
  ]
}
```

### Afternoon Check-Out Process

#### Check Out Child
**Endpoint:** `POST /attendance/check-out/{child_id}`

**Input Parameters:**
- `child_id`: Child ID to check out

**Input Body:** (optional)
```json
{
  "picked_by": "Mother - Fatima Ahmed",
  "notes": "Left with all belongings"
}
```

**Output:**
```json
{
  "id": 150,
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "date": "2025-01-16",
  "check_in_time": "08:30:15",
  "check_out_time": "15:45:30",
  "status": "present",
  "duration_hours": 7.25,
  "picked_by": "Mother - Fatima Ahmed",
  "notes": "Left with all belongings",
  "updated_at": "2025-01-16T15:45:30",
  "message": "Sara Ahmed checked out successfully"
}
```

**Workflow:**
1. Verify pickup person identity
2. Scan/select child
3. System records checkout time
4. Calculate duration
5. Parent receives notification
6. Update attendance record

### Mark Absent
**Endpoint:** `POST /attendance/`

**Input:**
```json
{
  "child_id": 5,
  "date": "2025-01-16",
  "status": "absent",
  "notes": "Parent called - child is sick"
}
```

**Output:**
```json
{
  "id": 151,
  "child_id": 5,
  "child_name": "Yara Khaled",
  "date": "2025-01-16",
  "check_in_time": null,
  "check_out_time": null,
  "status": "absent",
  "notes": "Parent called - child is sick",
  "created_at": "2025-01-16T08:00:00"
}
```

### View Today's Attendance
**Endpoint:** `GET /attendance/my-nursery/?date_from=2025-01-16&date_to=2025-01-16`

**Input Parameters:**
- `date_from`: Today's date
- `date_to`: Today's date

**Output:**
```json
{
  "date": "2025-01-16",
  "classroom": "Toddlers Room A",
  "total_children": 15,
  "present": 13,
  "absent": 2,
  "late": 0,
  "attendance_rate": 86.7,
  "children": [
    {
      "id": 1,
      "name": "Sara Ahmed",
      "check_in": "08:30:15",
      "check_out": null,
      "status": "present"
    },
    {
      "id": 5,
      "name": "Yara Khaled",
      "check_in": null,
      "check_out": null,
      "status": "absent",
      "reason": "Sick"
    }
  ]
}
```

---

## 4. Daily Reports

### Create Daily Report
**Endpoint:** `POST /reports/child/{child_id}`

**Input Parameters:**
- `child_id`: Child ID

**Input Body:**
```json
{
  "date": "2025-01-16",
  "activities": "Morning circle time, painting activity, outdoor play in garden, story time",
  "meals": "Breakfast: Cereal with milk and banana. Lunch: Chicken with rice and vegetables. Snack: Apple slices and crackers",
  "naps": "12:30 PM - 2:15 PM (1 hour 45 minutes). Slept well.",
  "mood": "happy",
  "notes": "Sara was very engaged today. She enjoyed the painting activity and created a beautiful picture. She played well with other children during outdoor time. No behavioral issues."
}
```

**Output:**
```json
{
  "id": 50,
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "date": "2025-01-16",
  "activities": "Morning circle time, painting activity, outdoor play in garden, story time",
  "meals": "Breakfast: Cereal with milk and banana. Lunch: Chicken with rice and vegetables. Snack: Apple slices and crackers",
  "naps": "12:30 PM - 2:15 PM (1 hour 45 minutes). Slept well.",
  "mood": "happy",
  "notes": "Sara was very engaged today. She enjoyed the painting activity and created a beautiful picture. She played well with other children during outdoor time. No behavioral issues.",
  "supervisor_id": 3,
  "supervisor_name": "Layla Ibrahim",
  "created_at": "2025-01-16T16:00:00",
  "message": "Daily report created successfully. Parent will be notified."
}
```

**Workflow:**
1. Select child from classroom list
2. Fill in daily activities
3. Record meal consumption
4. Note nap times and quality
5. Assess child's mood
6. Add any special notes
7. Submit report
8. System notifies parent automatically

### Update Daily Report
**Endpoint:** `PUT /reports/child/{child_id}/date/{report_date}`

**Input Parameters:**
- `child_id`: Child ID
- `report_date`: Report date (YYYY-MM-DD)

**Input Body:**
```json
{
  "notes": "Sara was very engaged today. She enjoyed the painting activity and created a beautiful picture. She played well with other children during outdoor time. No behavioral issues. UPDATE: Had a small disagreement with another child in the afternoon but resolved quickly with guidance."
}
```

**Output:**
```json
{
  "id": 50,
  "child_id": 1,
  "date": "2025-01-16",
  "notes": "Sara was very engaged today... UPDATE: Had a small disagreement with another child in the afternoon but resolved quickly with guidance.",
  "updated_at": "2025-01-16T17:30:00",
  "message": "Report updated successfully"
}
```

### View My Reports
**Endpoint:** `GET /reports/my-nursery/?skip=0&limit=100`

**Input Parameters:**
- `skip`: Pagination offset
- `limit`: Results per page
- `date_from`: Start date (optional)
- `date_to`: End date (optional)

**Output:**
```json
[
  {
    "id": 50,
    "child_id": 1,
    "child_name": "Sara Ahmed",
    "date": "2025-01-16",
    "activities": "Morning circle time, painting activity...",
    "meals": "Breakfast: Cereal with milk...",
    "naps": "12:30 PM - 2:15 PM...",
    "mood": "happy",
    "notes": "Sara was very engaged today...",
    "created_at": "2025-01-16T16:00:00",
    "parent_viewed": true,
    "parent_viewed_at": "2025-01-16T18:30:00"
  }
]
```

### Bulk Create Reports (End of Day)
**Endpoint:** `POST /reports/bulk-create`

**Input:**
```json
{
  "date": "2025-01-16",
  "reports": [
    {
      "child_id": 1,
      "activities": "Circle time, painting, outdoor play",
      "meals": "Full breakfast, full lunch, snack",
      "naps": "12:30-14:15 (1h 45m)",
      "mood": "happy",
      "notes": "Great day, very engaged"
    },
    {
      "child_id": 2,
      "activities": "Circle time, blocks, outdoor play",
      "meals": "Full breakfast, half lunch, snack",
      "naps": "12:30-14:00 (1h 30m)",
      "mood": "calm",
      "notes": "Quiet but participated well"
    }
  ]
}
```

**Output:**
```json
{
  "success": true,
  "created": 2,
  "reports": [
    {"child_id": 1, "report_id": 50, "status": "created"},
    {"child_id": 2, "report_id": 51, "status": "created"}
  ],
  "message": "2 reports created successfully. Parents notified."
}
```

---

## 5. Child Information Access

### View Child Details
**Endpoint:** `GET /children/{child_id}`

**Input Parameters:**
- `child_id`: Child ID

**Output:**
```json
{
  "id": 1,
  "first_name": "Sara",
  "last_name": "Ahmed",
  "date_of_birth": "2022-03-15",
  "age_months": 22,
  "gender": "female",
  "medical_info": "No allergies",
  "emergency_contact": "Mother - Fatima Ahmed",
  "emergency_phone": "0791234567",
  "secondary_contact": "Father - Ahmed Hassan",
  "secondary_phone": "0791234571",
  "parent": {
    "id": 4,
    "name": "Fatima Ahmed",
    "email": "parent@nursery.com",
    "phone": "0791234567"
  },
  "classroom": {
    "id": 1,
    "name": "Toddlers Room A",
    "capacity": 15
  },
  "attendance_summary": {
    "total_days": 20,
    "present": 18,
    "absent": 2,
    "rate": 90.0
  },
  "recent_reports": [
    {
      "date": "2025-01-15",
      "mood": "happy",
      "summary": "Great day, very active"
    }
  ]
}
```

### View Child Medical Information
**Endpoint:** `GET /children/{child_id}`

**Focus on Medical Info:**
```json
{
  "id": 2,
  "name": "Ali Mohammad",
  "medical_info": "Lactose intolerant - no dairy products",
  "allergies": ["Dairy", "Peanuts"],
  "medications": [
    {
      "name": "EpiPen",
      "dosage": "0.15mg",
      "when": "Emergency only - severe allergic reaction",
      "location": "First aid kit"
    }
  ],
  "special_needs": "None",
  "doctor_name": "Dr. Khaled Yousef",
  "doctor_phone": "0791234580"
}
```

---

## 6. Parent Communication

### Send Message to Parent
**Endpoint:** `POST /notifications/`

**Input:**
```json
{
  "user_id": 4,
  "title": "Important: Medical Update Needed",
  "message": "Please update Sara's medical information with any new allergies or medications",
  "type": "warning",
  "link": "/children/1"
}
```

**Output:**
```json
{
  "id": 75,
  "user_id": 4,
  "title": "Important: Medical Update Needed",
  "message": "Please update Sara's medical information...",
  "type": "warning",
  "is_read": false,
  "created_at": "2025-01-16T10:00:00",
  "message": "Notification sent to parent successfully"
}
```

### View Parent Contact Info
**Endpoint:** `GET /children/{child_id}`

**Extract Parent Info:**
```json
{
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "parent": {
    "id": 4,
    "name": "Fatima Ahmed",
    "email": "parent@nursery.com",
    "phone": "0791234567",
    "work_phone": "0791234572",
    "preferred_contact": "phone"
  },
  "emergency_contacts": [
    {
      "name": "Father - Ahmed Hassan",
      "phone": "0791234571",
      "relationship": "Father"
    },
    {
      "name": "Grandmother - Maryam Ahmed",
      "phone": "0791234573",
      "relationship": "Grandmother"
    }
  ]
}
```

---

## 7. Classroom Activities

### Log Group Activity
**Endpoint:** `POST /activities/group`

**Input:**
```json
{
  "date": "2025-01-16",
  "time": "10:00:00",
  "activity_type": "educational",
  "title": "Color Recognition Game",
  "description": "Children learned to identify and name primary colors using flashcards and toys",
  "duration_minutes": 30,
  "participants": [1, 2, 3, 4, 5],
  "materials_used": ["Flashcards", "Colored toys", "Crayons"],
  "outcomes": "All children successfully identified red and blue. 3 out of 5 identified yellow."
}
```

**Output:**
```json
{
  "id": 25,
  "date": "2025-01-16",
  "time": "10:00:00",
  "activity_type": "educational",
  "title": "Color Recognition Game",
  "participants_count": 5,
  "supervisor_id": 3,
  "created_at": "2025-01-16T10:30:00",
  "message": "Activity logged successfully"
}
```

### View Daily Schedule
**Endpoint:** `GET /classrooms/{classroom_id}/schedule`

**Input Parameters:**
- `classroom_id`: Classroom ID

**Output:**
```json
{
  "classroom": "Toddlers Room A",
  "date": "2025-01-16",
  "schedule": [
    {
      "time": "08:00-08:30",
      "activity": "Arrival & Free Play",
      "status": "completed"
    },
    {
      "time": "08:30-09:00",
      "activity": "Breakfast",
      "status": "completed"
    },
    {
      "time": "09:00-09:30",
      "activity": "Circle Time",
      "status": "completed"
    },
    {
      "time": "09:30-10:30",
      "activity": "Learning Activity",
      "status": "in_progress",
      "current_activity": "Color Recognition Game"
    },
    {
      "time": "10:30-11:00",
      "activity": "Outdoor Play",
      "status": "pending"
    },
    {
      "time": "11:00-12:00",
      "activity": "Lunch",
      "status": "pending"
    },
    {
      "time": "12:00-14:00",
      "activity": "Nap Time",
      "status": "pending"
    },
    {
      "time": "14:00-14:30",
      "activity": "Snack Time",
      "status": "pending"
    },
    {
      "time": "14:30-15:30",
      "activity": "Story Time & Art",
      "status": "pending"
    },
    {
      "time": "15:30-16:00",
      "activity": "Departure",
      "status": "pending"
    }
  ]
}
```

---

## 8. Incident Reporting

### Report Incident
**Endpoint:** `POST /incidents/`

**Input:**
```json
{
  "child_id": 1,
  "date": "2025-01-16",
  "time": "10:45:00",
  "incident_type": "minor_injury",
  "description": "Sara fell while running in the playground and scraped her knee",
  "action_taken": "Cleaned wound with water, applied antiseptic and bandage. Child comforted and returned to play.",
  "severity": "minor",
  "parent_notified": true,
  "parent_notification_time": "10:50:00",
  "witnesses": ["Supervisor Layla", "Assistant Noor"],
  "requires_followup": false
}
```

**Output:**
```json
{
  "id": 5,
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "date": "2025-01-16",
  "time": "10:45:00",
  "incident_type": "minor_injury",
  "severity": "minor",
  "parent_notified": true,
  "manager_notified": true,
  "created_at": "2025-01-16T10:55:00",
  "message": "Incident reported. Parent and manager notified automatically."
}
```

**Incident Types:**
- minor_injury - Small cuts, bruises
- major_injury - Requires medical attention
- illness - Child became sick
- behavioral - Behavioral incident
- accident - General accident
- other - Other incidents

---

## 9. Notifications

### View My Notifications
**Endpoint:** `GET /notifications/?skip=0&limit=50`

**Input Parameters:**
- `skip`: Pagination offset
- `limit`: Results per page
- `unread_only`: true/false

**Output:**
```json
[
  {
    "id": 1,
    "title": "New Child Assigned",
    "message": "Omar Khalil has been assigned to your classroom",
    "type": "info",
    "is_read": false,
    "link": "/children/15",
    "created_at": "2025-01-16T08:00:00"
  },
  {
    "id": 2,
    "title": "Manager Message",
    "message": "Please ensure all daily reports are completed by 4 PM",
    "type": "warning",
    "is_read": false,
    "created_at": "2025-01-16T09:00:00"
  }
]
```

---

## 10. Common Supervisor Workflows

### Workflow 1: Morning Routine (8:00 AM - 9:00 AM)
1. Login to system
2. Review today's schedule
3. Check for any special notes about children
4. Prepare classroom for arrivals
5. As children arrive:
   - Greet child and parent
   - Check-in child in system
   - Note any parent messages
   - Observe child's condition
6. Mark absent children
7. Contact parents of unexpected absences

### Workflow 2: During the Day
1. Follow daily schedule
2. Log group activities
3. Monitor children's behavior and mood
4. Note meal consumption
5. Record nap times
6. Handle any incidents immediately
7. Take photos of activities (with permission)
8. Respond to parent messages

### Workflow 3: End of Day Routine (3:00 PM - 4:00 PM)
1. Prepare children for departure
2. Create daily reports for each child:
   - Activities participated in
   - Meals consumed
   - Nap duration and quality
   - Mood throughout day
   - Any special notes
3. Check-out children as parents arrive
4. Verify pickup person identity
5. Share highlights with parents verbally
6. Submit all reports by 4 PM
7. Clean and prepare classroom for next day

### Workflow 4: Handle Medical Situation
1. Assess child's condition
2. Check child's medical information
3. Administer first aid if needed
4. Contact parent immediately
5. Document incident in system
6. Notify manager
7. Follow up with parent
8. Complete incident report
9. Monitor child's condition

### Workflow 5: Weekly Planning
1. Review previous week's activities
2. Plan next week's learning activities
3. Prepare materials needed
4. Coordinate with other supervisors
5. Update classroom schedule
6. Communicate plans to manager
7. Inform parents of upcoming activities

---

## 11. File Management

### Upload Child Photo
**Endpoint:** `POST /files/upload`

**Input:** (multipart/form-data)
- `file`: Photo file
- `description`: "Sara Ahmed - Painting Activity - Jan 16"
- `child_id`: 1

**Output:**
```json
{
  "id": 20,
  "filename": "sara_painting_abc123.jpg",
  "original_filename": "IMG_20250116_103045.jpg",
  "file_size": 1245678,
  "content_type": "image/jpeg",
  "uploaded_by": 3,
  "description": "Sara Ahmed - Painting Activity - Jan 16",
  "child_id": 1,
  "created_at": "2025-01-16T10:35:00"
}
```

---

## 12. Emergency Procedures

### Emergency Contact Quick Access
**Endpoint:** `GET /children/my-children/`

**Emergency Info Extract:**
```json
[
  {
    "child_id": 1,
    "name": "Sara Ahmed",
    "emergency_contacts": [
      {
        "name": "Mother - Fatima Ahmed",
        "phone": "0791234567",
        "priority": 1
      },
      {
        "name": "Father - Ahmed Hassan",
        "phone": "0791234571",
        "priority": 2
      }
    ],
    "medical_alerts": "No allergies",
    "blood_type": "O+"
  }
]
```

### Emergency Notification
**Endpoint:** `POST /notifications/emergency`

**Input:**
```json
{
  "child_id": 1,
  "emergency_type": "medical",
  "message": "Sara has a high fever. Please come to nursery immediately.",
  "notify_manager": true
}
```

**Output:**
```json
{
  "success": true,
  "parent_notified": true,
  "manager_notified": true,
  "notification_sent_at": "2025-01-16T11:30:00",
  "message": "Emergency notification sent to all contacts"
}
```

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
