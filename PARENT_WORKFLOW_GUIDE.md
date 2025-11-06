# 👨‍👩‍👧 Parent Complete Workflow Guide

## Role Overview
Parent can view their children's information, attendance, daily reports, and communicate with nursery staff.

**Credentials:**
- Email: `parent@nursery.com`
- Password: `Parent123!`

---

## 1. Authentication

### Login
**Endpoint:** `POST /auth/login`

**Input:**
```json
{
  "email": "parent@nursery.com",
  "password": "Parent123!"
}
```

**Output:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 4,
    "email": "parent@nursery.com",
    "first_name": "Fatima",
    "last_name": "Ahmed",
    "role": "parent",
    "nursery_id": 1,
    "phone": "0791234567",
    "is_active": true
  }
}
```

### Change Password
**Endpoint:** `POST /auth/password/change`

**Input:**
```json
{
  "current_password": "Parent123!",
  "new_password": "NewSecure123!"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

---

## 2. My Children Dashboard

### View My Children
**Endpoint:** `GET /children/parent/`

**Input:** None (uses authenticated parent's ID)

**Output:**
```json
[
  {
    "id": 1,
    "first_name": "Sara",
    "last_name": "Ahmed",
    "date_of_birth": "2022-03-15",
    "age_years": 2,
    "age_months": 22,
    "gender": "female",
    "photo_url": "/storage/children/sara_ahmed.jpg",
    "classroom": {
      "id": 1,
      "name": "Toddlers Room A",
      "supervisor": {
        "id": 3,
        "name": "Layla Ibrahim",
        "phone": "0791234569",
        "email": "supervisor@nursery.com"
      }
    },
    "nursery": {
      "id": 1,
      "name": "Little Stars Nursery",
      "branch": "Downtown Branch",
      "phone": "0791234567"
    },
    "status": "active",
    "enrollment_date": "2024-09-01"
  }
]
```

### View Specific Child Details
**Endpoint:** `GET /children/parent/{child_id}`

**Input Parameters:**
- `child_id`: Child ID

**Output:**
```json
{
  "id": 1,
  "first_name": "Sara",
  "last_name": "Ahmed",
  "date_of_birth": "2022-03-15",
  "age_years": 2,
  "age_months": 22,
  "gender": "female",
  "photo_url": "/storage/children/sara_ahmed.jpg",
  "medical_info": "No allergies",
  "emergency_contact": "Mother - Fatima Ahmed",
  "emergency_phone": "0791234567",
  "secondary_contact": "Father - Ahmed Hassan",
  "secondary_phone": "0791234571",
  "classroom": {
    "id": 1,
    "name": "Toddlers Room A",
    "capacity": 15,
    "current_enrollment": 15,
    "age_group": "12-24 months",
    "supervisor": {
      "id": 3,
      "name": "Layla Ibrahim",
      "phone": "0791234569",
      "email": "supervisor@nursery.com"
    }
  },
  "attendance_summary": {
    "this_month": {
      "total_days": 20,
      "present": 18,
      "absent": 2,
      "late": 0,
      "attendance_rate": 90.0
    },
    "this_year": {
      "total_days": 100,
      "present": 92,
      "absent": 8,
      "attendance_rate": 92.0
    }
  },
  "recent_activity": {
    "last_attendance": "2025-01-16",
    "last_report": "2025-01-16",
    "last_incident": null
  }
}
```

---

## 3. Attendance Tracking

### View Child Attendance History
**Endpoint:** `GET /attendance/parent/{child_id}`

**Input Parameters:**
- `child_id`: Child ID
- `date_from`: Start date (YYYY-MM-DD, optional)
- `date_to`: End date (YYYY-MM-DD, optional)

**Example:** `GET /attendance/parent/1?date_from=2025-01-01&date_to=2025-01-31`

**Output:**
```json
{
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "period": "January 2025",
  "summary": {
    "total_days": 20,
    "present": 18,
    "absent": 2,
    "late": 0,
    "attendance_rate": 90.0,
    "average_arrival_time": "08:35:00",
    "average_departure_time": "15:40:00",
    "average_duration_hours": 7.08
  },
  "records": [
    {
      "id": 150,
      "date": "2025-01-16",
      "check_in_time": "08:30:15",
      "check_out_time": "15:45:30",
      "status": "present",
      "duration_hours": 7.25,
      "notes": "Arrived with father"
    },
    {
      "id": 149,
      "date": "2025-01-15",
      "check_in_time": "08:35:00",
      "check_out_time": "15:30:00",
      "status": "present",
      "duration_hours": 6.92
    },
    {
      "id": 148,
      "date": "2025-01-14",
      "check_in_time": null,
      "check_out_time": null,
      "status": "absent",
      "notes": "Child was sick"
    }
  ]
}
```

### View Today's Attendance
**Endpoint:** `GET /attendance/parent/{child_id}?date_from=2025-01-16&date_to=2025-01-16`

**Input Parameters:**
- `child_id`: Child ID
- `date_from`: Today's date
- `date_to`: Today's date

**Output:**
```json
{
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "date": "2025-01-16",
  "status": "present",
  "check_in_time": "08:30:15",
  "check_out_time": null,
  "current_duration_hours": 6.5,
  "checked_in_by": "Supervisor Layla Ibrahim",
  "notes": "Arrived with father, brought lunch box",
  "is_currently_at_nursery": true
}
```

### Get Attendance Statistics
**Endpoint:** `GET /attendance/parent/{child_id}/stats`

**Input Parameters:**
- `child_id`: Child ID
- `period`: "week" | "month" | "year" (optional, default: month)

**Output:**
```json
{
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "period": "This Month",
  "statistics": {
    "total_days": 20,
    "present": 18,
    "absent": 2,
    "late": 0,
    "attendance_rate": 90.0,
    "comparison_to_classroom": {
      "classroom_average": 85.5,
      "difference": "+4.5%",
      "rank": "Above average"
    }
  },
  "trends": {
    "most_common_arrival_time": "08:30-08:45",
    "most_common_departure_time": "15:30-16:00",
    "days_with_perfect_attendance": 18,
    "longest_streak": 12
  }
}
```

---

## 4. Daily Reports

### View Child's Daily Reports
**Endpoint:** `GET /reports/parent/{child_id}`

**Input Parameters:**
- `child_id`: Child ID
- `date_from`: Start date (optional)
- `date_to`: End date (optional)

**Example:** `GET /reports/parent/1?date_from=2025-01-01&date_to=2025-01-31`

**Output:**
```json
{
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "period": "January 2025",
  "total_reports": 18,
  "reports": [
    {
      "id": 50,
      "date": "2025-01-16",
      "activities": "Morning circle time, painting activity, outdoor play in garden, story time",
      "meals": "Breakfast: Cereal with milk and banana. Lunch: Chicken with rice and vegetables. Snack: Apple slices and crackers",
      "naps": "12:30 PM - 2:15 PM (1 hour 45 minutes). Slept well.",
      "mood": "happy",
      "notes": "Sara was very engaged today. She enjoyed the painting activity and created a beautiful picture. She played well with other children during outdoor time. No behavioral issues.",
      "supervisor": {
        "id": 3,
        "name": "Layla Ibrahim"
      },
      "photos": [
        {
          "id": 20,
          "url": "/storage/photos/sara_painting_abc123.jpg",
          "description": "Sara's painting activity"
        }
      ],
      "created_at": "2025-01-16T16:00:00",
      "viewed_at": "2025-01-16T18:30:00"
    },
    {
      "id": 49,
      "date": "2025-01-15",
      "activities": "Circle time, building blocks, outdoor play, music time",
      "meals": "Breakfast: Toast with jam. Lunch: Pasta with vegetables. Snack: Yogurt",
      "naps": "12:30 PM - 2:00 PM (1 hour 30 minutes)",
      "mood": "calm",
      "notes": "Sara was quieter today but participated in all activities. She built a tall tower with blocks.",
      "supervisor": {
        "id": 3,
        "name": "Layla Ibrahim"
      },
      "created_at": "2025-01-15T16:00:00",
      "viewed_at": "2025-01-15T19:00:00"
    }
  ]
}
```

### View Specific Daily Report
**Endpoint:** `GET /reports/parent/{child_id}?date_from=2025-01-16&date_to=2025-01-16`

**Input Parameters:**
- `child_id`: Child ID
- `date_from`: Specific date
- `date_to`: Same date

**Output:**
```json
{
  "id": 50,
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "date": "2025-01-16",
  "activities": {
    "morning": "Circle time, painting activity",
    "afternoon": "Outdoor play in garden, story time",
    "details": "Sara was very engaged today. She enjoyed the painting activity and created a beautiful picture. She played well with other children during outdoor time."
  },
  "meals": {
    "breakfast": {
      "served": "Cereal with milk and banana",
      "consumed": "Full portion",
      "notes": "Ate everything"
    },
    "lunch": {
      "served": "Chicken with rice and vegetables",
      "consumed": "Most of it",
      "notes": "Left some vegetables"
    },
    "snack": {
      "served": "Apple slices and crackers",
      "consumed": "Full portion",
      "notes": "Enjoyed the snack"
    }
  },
  "naps": {
    "start_time": "12:30 PM",
    "end_time": "2:15 PM",
    "duration": "1 hour 45 minutes",
    "quality": "Slept well",
    "notes": "Fell asleep quickly, woke up refreshed"
  },
  "mood": {
    "overall": "happy",
    "morning": "cheerful",
    "afternoon": "energetic",
    "notes": "Very positive mood throughout the day"
  },
  "behavior": {
    "social_interaction": "Excellent - played well with others",
    "following_instructions": "Good",
    "participation": "Very engaged",
    "issues": "None"
  },
  "health": {
    "temperature": "Normal",
    "bathroom": "Regular",
    "any_concerns": "None"
  },
  "supervisor": {
    "id": 3,
    "name": "Layla Ibrahim",
    "phone": "0791234569",
    "email": "supervisor@nursery.com"
  },
  "photos": [
    {
      "id": 20,
      "url": "/storage/photos/sara_painting_abc123.jpg",
      "thumbnail_url": "/storage/photos/thumbs/sara_painting_abc123.jpg",
      "description": "Sara's painting activity",
      "taken_at": "2025-01-16T10:30:00"
    }
  ],
  "created_at": "2025-01-16T16:00:00",
  "viewed_at": "2025-01-16T18:30:00"
}
```

### Mark Report as Viewed
**Endpoint:** `PATCH /reports/{report_id}/view`

**Input Parameters:**
- `report_id`: Report ID

**Output:**
```json
{
  "success": true,
  "report_id": 50,
  "viewed_at": "2025-01-16T18:30:00",
  "message": "Report marked as viewed"
}
```

---

## 5. Notifications

### View My Notifications
**Endpoint:** `GET /notifications/?skip=0&limit=50`

**Input Parameters:**
- `skip`: Pagination offset
- `limit`: Results per page
- `unread_only`: true/false (optional)

**Output:**
```json
[
  {
    "id": 1,
    "title": "Daily Report Available",
    "message": "Sara's daily report for January 16 is now available",
    "type": "info",
    "is_read": false,
    "link": "/reports/parent/1?date=2025-01-16",
    "created_at": "2025-01-16T16:00:00"
  },
  {
    "id": 2,
    "title": "Check-In Confirmation",
    "message": "Sara has been checked in at 08:30 AM",
    "type": "success",
    "is_read": true,
    "link": "/attendance/parent/1",
    "created_at": "2025-01-16T08:30:15",
    "read_at": "2025-01-16T08:35:00"
  },
  {
    "id": 3,
    "title": "Important: Medical Update Needed",
    "message": "Please update Sara's medical information with any new allergies or medications",
    "type": "warning",
    "is_read": false,
    "link": "/children/1",
    "created_at": "2025-01-16T10:00:00"
  }
]
```

### Get Unread Notifications Count
**Endpoint:** `GET /notifications/unread-count`

**Input:** None

**Output:**
```json
{
  "unread_count": 3,
  "by_type": {
    "info": 1,
    "success": 0,
    "warning": 2,
    "error": 0
  }
}
```

### Mark Notification as Read
**Endpoint:** `PATCH /notifications/{notification_id}/read`

**Input Parameters:**
- `notification_id`: Notification ID

**Output:**
```json
{
  "success": true,
  "notification_id": 1,
  "read_at": "2025-01-16T18:30:00"
}
```

### Mark All Notifications as Read
**Endpoint:** `PATCH /notifications/read-all`

**Input:** None

**Output:**
```json
{
  "success": true,
  "marked_read": 3,
  "message": "All notifications marked as read"
}
```

---

## 6. Communication with Nursery

### Send Message to Supervisor
**Endpoint:** `POST /messages/to-supervisor`

**Input:**
```json
{
  "child_id": 1,
  "subject": "Dietary Restriction Update",
  "message": "Sara has developed a mild allergy to strawberries. Please avoid giving her any strawberry-containing foods.",
  "priority": "high"
}
```

**Output:**
```json
{
  "id": 15,
  "child_id": 1,
  "subject": "Dietary Restriction Update",
  "message": "Sara has developed a mild allergy to strawberries...",
  "priority": "high",
  "sent_to": {
    "id": 3,
    "name": "Layla Ibrahim",
    "role": "supervisor"
  },
  "sent_at": "2025-01-16T19:00:00",
  "status": "delivered",
  "message": "Message sent successfully to supervisor"
}
```

### View Message History
**Endpoint:** `GET /messages/history?child_id=1`

**Input Parameters:**
- `child_id`: Child ID (optional)

**Output:**
```json
[
  {
    "id": 15,
    "child_id": 1,
    "subject": "Dietary Restriction Update",
    "message": "Sara has developed a mild allergy to strawberries...",
    "priority": "high",
    "from": {
      "id": 4,
      "name": "Fatima Ahmed",
      "role": "parent"
    },
    "to": {
      "id": 3,
      "name": "Layla Ibrahim",
      "role": "supervisor"
    },
    "sent_at": "2025-01-16T19:00:00",
    "read_at": "2025-01-16T19:15:00",
    "replied_at": "2025-01-16T19:30:00",
    "reply": "Thank you for informing us. I have updated Sara's dietary restrictions in the system."
  }
]
```

---

## 7. Child Profile Management

### Update Emergency Contact
**Endpoint:** `PUT /children/parent/{child_id}/emergency-contact`

**Input:**
```json
{
  "emergency_contact": "Mother - Fatima Ahmed",
  "emergency_phone": "0791234567",
  "secondary_contact": "Grandmother - Maryam Ahmed",
  "secondary_phone": "0791234574"
}
```

**Output:**
```json
{
  "id": 1,
  "emergency_contact": "Mother - Fatima Ahmed",
  "emergency_phone": "0791234567",
  "secondary_contact": "Grandmother - Maryam Ahmed",
  "secondary_phone": "0791234574",
  "updated_at": "2025-01-16T19:45:00",
  "message": "Emergency contact information updated successfully"
}
```

### Update Medical Information
**Endpoint:** `PUT /children/parent/{child_id}/medical-info`

**Input:**
```json
{
  "medical_info": "Mild allergy to strawberries. No other allergies.",
  "medications": "None",
  "special_needs": "None",
  "doctor_name": "Dr. Khaled Yousef",
  "doctor_phone": "0791234580"
}
```

**Output:**
```json
{
  "id": 1,
  "medical_info": "Mild allergy to strawberries. No other allergies.",
  "medications": "None",
  "updated_at": "2025-01-16T20:00:00",
  "message": "Medical information updated successfully. Supervisor has been notified."
}
```

---

## 8. Photos & Media

### View Child's Photos
**Endpoint:** `GET /files/?child_id=1&type=photo`

**Input Parameters:**
- `child_id`: Child ID
- `type`: photo
- `date_from`: Start date (optional)
- `date_to`: End date (optional)

**Output:**
```json
{
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "total_photos": 45,
  "photos": [
    {
      "id": 20,
      "url": "/storage/photos/sara_painting_abc123.jpg",
      "thumbnail_url": "/storage/photos/thumbs/sara_painting_abc123.jpg",
      "description": "Sara's painting activity",
      "date": "2025-01-16",
      "uploaded_by": {
        "id": 3,
        "name": "Layla Ibrahim",
        "role": "supervisor"
      },
      "created_at": "2025-01-16T10:35:00"
    },
    {
      "id": 19,
      "url": "/storage/photos/sara_outdoor_xyz789.jpg",
      "thumbnail_url": "/storage/photos/thumbs/sara_outdoor_xyz789.jpg",
      "description": "Outdoor play time",
      "date": "2025-01-15",
      "uploaded_by": {
        "id": 3,
        "name": "Layla Ibrahim",
        "role": "supervisor"
      },
      "created_at": "2025-01-15T11:20:00"
    }
  ]
}
```

### Download Photo
**Endpoint:** `GET /files/{file_id}/download`

**Input Parameters:**
- `file_id`: File ID

**Output:** Binary image file with headers:
```
Content-Type: image/jpeg
Content-Disposition: attachment; filename="sara_painting_activity.jpg"
```

---

## 9. Calendar & Events

### View Nursery Calendar
**Endpoint:** `GET /calendar/events?month=2025-01`

**Input Parameters:**
- `month`: Month in YYYY-MM format

**Output:**
```json
{
  "month": "January 2025",
  "events": [
    {
      "id": 1,
      "date": "2025-01-25",
      "title": "National Holiday",
      "description": "Nursery will be closed",
      "type": "holiday",
      "all_day": true
    },
    {
      "id": 2,
      "date": "2025-01-30",
      "title": "Parent-Teacher Meeting",
      "description": "Individual meetings with supervisors",
      "type": "meeting",
      "time": "14:00-17:00",
      "location": "Classroom"
    }
  ],
  "holidays": [
    {
      "date": "2025-01-25",
      "name": "National Holiday"
    }
  ]
}
```

---

## 10. Payments & Fees (Future Feature)

### View Payment History
**Endpoint:** `GET /payments/parent/history`

**Input:** None

**Output:**
```json
{
  "child_id": 1,
  "child_name": "Sara Ahmed",
  "payments": [
    {
      "id": 1,
      "month": "January 2025",
      "amount": 250.00,
      "currency": "JOD",
      "status": "paid",
      "paid_at": "2025-01-05T10:00:00",
      "payment_method": "bank_transfer",
      "receipt_url": "/receipts/payment_1.pdf"
    },
    {
      "id": 2,
      "month": "December 2024",
      "amount": 250.00,
      "currency": "JOD",
      "status": "paid",
      "paid_at": "2024-12-05T10:00:00",
      "payment_method": "cash"
    }
  ],
  "balance": 0.00,
  "next_payment_due": "2025-02-05"
}
```

---

## 11. Common Parent Workflows

### Workflow 1: Morning Drop-Off
1. Arrive at nursery
2. Hand child to supervisor
3. Receive check-in notification on phone
4. Verify check-in time in app
5. Review any messages from supervisor
6. Leave for work

### Workflow 2: During the Day
1. Receive notifications:
   - Check-in confirmation
   - Activity updates
   - Any incidents or alerts
2. Check app periodically for updates
3. Respond to any messages from supervisor
4. View photos if uploaded

### Workflow 3: Evening Pick-Up
1. Arrive at nursery
2. Collect child from supervisor
3. Receive verbal update from supervisor
4. Child is checked out in system
5. Receive checkout notification
6. Review daily report on way home

### Workflow 4: Evening Review
1. Login to app
2. Read full daily report
3. View photos from the day
4. Check attendance record
5. Review any notifications
6. Send any messages to supervisor if needed
7. Update child information if necessary

### Workflow 5: Weekly Review
1. Check attendance summary for week
2. Review all daily reports
3. Look at photos from the week
4. Monitor child's mood trends
5. Note any patterns or concerns
6. Schedule meeting with supervisor if needed
7. Update emergency contacts if changed

### Workflow 6: Monthly Review
1. Review monthly attendance statistics
2. Compare with previous months
3. Review all daily reports
4. Check payment status
5. Review upcoming events
6. Plan for next month
7. Provide feedback to nursery

---

## 12. Notification Types

### Real-Time Notifications
1. **Check-In** - Child arrived at nursery
2. **Check-Out** - Child left nursery
3. **Daily Report** - Report is ready
4. **Incident** - Any incident involving child
5. **Medical** - Health-related alerts
6. **Message** - New message from staff
7. **Announcement** - General nursery announcements

### Notification Settings
**Endpoint:** `PUT /notifications/settings`

**Input:**
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "sms_notifications": false,
  "notification_types": {
    "check_in": true,
    "check_out": true,
    "daily_report": true,
    "incident": true,
    "medical": true,
    "message": true,
    "announcement": true
  },
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "07:00"
  }
}
```

**Output:**
```json
{
  "success": true,
  "message": "Notification settings updated successfully"
}
```

---

## 13. Help & Support

### Contact Nursery
**Endpoint:** `GET /nursery/contact-info`

**Input:** None

**Output:**
```json
{
  "nursery": {
    "name": "Little Stars Nursery",
    "branch": "Downtown Branch",
    "address": {
      "street": "King Abdullah St",
      "city": "Amman",
      "governorate": "Amman",
      "postal_code": "11183"
    },
    "phone": "0791234567",
    "email": "info@littlestars.jo",
    "website": "www.littlestars.jo"
  },
  "child_supervisor": {
    "name": "Layla Ibrahim",
    "phone": "0791234569",
    "email": "supervisor@nursery.com"
  },
  "manager": {
    "name": "Ahmad Hassan",
    "phone": "0791234568",
    "email": "manager@nursery.com"
  },
  "operating_hours": {
    "weekdays": "08:00 AM - 04:00 PM",
    "saturday": "Closed",
    "sunday": "Closed"
  },
  "emergency_contact": "0791234567"
}
```

### Submit Feedback
**Endpoint:** `POST /feedback/`

**Input:**
```json
{
  "type": "suggestion",
  "subject": "Extended Hours Request",
  "message": "Would it be possible to extend operating hours until 5 PM?",
  "rating": 5
}
```

**Output:**
```json
{
  "id": 10,
  "type": "suggestion",
  "subject": "Extended Hours Request",
  "status": "submitted",
  "submitted_at": "2025-01-16T20:00:00",
  "message": "Thank you for your feedback. We will review and respond within 48 hours."
}
```

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
