# Nursery Management System - Administrator Guide

## Welcome to the Nursery Management System

This guide will help administrators effectively manage childcare facilities using our comprehensive web-based platform. The system supports multiple nurseries, branches, and staff roles to streamline childcare operations.

## Getting Started

### First Login
1. Navigate to the application URL
2. Click "Login" and enter your phone number
3. Enter the OTP code sent to your phone
4. Complete your profile setup

### Default Administrator Account
- **Phone**: 0790000000
- **Password**: admin123

## System Overview

### User Roles
- **Admin**: Full system access and configuration
- **Manager**: Nursery management and oversight
- **Supervisor**: Daily operations and child care
- **Parent**: Access to their children's information

### Key Features
- Multi-nursery management
- Real-time attendance tracking
- Daily activity reports
- Parent communication tools
- Comprehensive reporting
- File management and storage

## Nursery Management

### Creating a New Nursery

1. **Navigate to Admin Dashboard**
   - Click "Admin" in the sidebar
   - Select "Nurseries" from the menu

2. **Add Nursery Details**
   - **Name**: Official nursery name
   - **Main Phone**: Primary contact number
   - **Email**: Official email address
   - **Address**: Complete physical address
   - **Age Range**: Minimum and maximum child ages (in months)
   - **Notes**: Additional information

3. **Save and Configure**
   - Click "Create Nursery"
   - The system will automatically create the nursery record

### Managing Nursery Branches

1. **Access Branch Management**
   - Select a nursery from the list
   - Click "Branches" tab

2. **Add New Branch**
   - **Name**: Branch location name
   - **Phone**: Branch-specific contact
   - **Address**: Branch physical address
   - **Capacity**: Maximum number of children
   - **Operating Hours**: Daily schedule

### Nursery Settings

#### Age Groups Configuration
- Define age ranges for different classes
- Set capacity limits per age group
- Configure pricing tiers

#### Staff Roles Assignment
- Assign managers to specific nurseries
- Set supervisor responsibilities
- Configure access permissions

## User Management

### Creating User Accounts

1. **Access User Management**
   - Go to Admin Dashboard → Users

2. **Add New User**
   - **Phone**: User's mobile number (required)
   - **Email**: Optional email address
   - **Full Name**: Complete name
   - **Role**: Select from Admin/Manager/Supervisor/Parent
   - **Nursery**: Assign to specific nursery (if applicable)
   - **Branch**: Assign to specific branch (if applicable)

3. **Account Activation**
   - User will receive SMS with temporary password
   - First login requires password change

### Bulk User Import

For large-scale user creation:
1. Prepare CSV file with user data
2. Use "Import Users" feature
3. System validates and creates accounts
4. Users receive welcome SMS

### User Permissions

#### Admin Permissions
- Create/edit/delete nurseries and branches
- Manage all users across the system
- Access system-wide reports
- Configure system settings

#### Manager Permissions
- Manage assigned nursery
- Create/edit supervisors and parents
- Approve reports and requests
- Access nursery-specific analytics

#### Supervisor Permissions
- Daily attendance tracking
- Create child activity reports
- Manage assigned classes
- Communicate with parents

#### Parent Permissions
- View own children's information
- Access daily reports
- Schedule appointments
- Receive notifications

## Child Management

### Child Registration

1. **Access Children Section**
   - Manager Dashboard → Children

2. **Add Child Information**
   - **Full Name**: Child's complete name
   - **Date of Birth**: Birth date (for age calculation)
   - **Gender**: Male/Female
   - **Parent Information**: Link to parent account
   - **Medical Information**: Allergies, medications, emergency contacts
   - **Enrollment Date**: When child started
   - **Class Assignment**: Current class/age group

3. **Document Upload**
   - Birth certificate
   - Medical records
   - Emergency contact forms
   - Consent forms

### Child Profile Management

#### Health Records
- Medical conditions
- Allergies and restrictions
- Emergency contact details
- Doctor information

#### Academic Progress
- Developmental milestones
- Learning achievements
- Behavioral notes
- Teacher assessments

#### Attendance History
- Daily check-in/check-out times
- Absence records
- Tardiness tracking

## Daily Operations

### Attendance Tracking

#### Check-in Process
1. Supervisor scans QR code or enters child ID
2. System records arrival time
3. Parent receives notification
4. Photo capture (optional)

#### Check-out Process
1. Parent or authorized pickup person
2. Verification of authorization
3. Record departure time
4. Update daily report

### Daily Reports

#### Creating Reports
1. **Access Daily Reports**
   - Supervisor Dashboard → Daily Reports

2. **Report Components**
   - **Activities**: What the child did today
   - **Meals**: Food consumed and preferences
   - **Nap Time**: Sleep duration and quality
   - **Mood**: Child's emotional state
   - **Learning**: Educational activities
   - **Health**: Any health concerns or notes
   - **Photos**: Activity photos (optional)

3. **Report Approval**
   - Supervisor creates draft
   - Manager reviews and approves
   - Parent receives notification

### Communication Tools

#### Parent Notifications
- Daily report summaries
- Important announcements
- Appointment reminders
- Emergency alerts

#### Staff Communication
- Internal messaging system
- Shift handover notes
- Incident reporting
- Feedback collection

## Reporting and Analytics

### Available Reports

#### Attendance Reports
- Daily attendance summaries
- Monthly attendance patterns
- Absenteeism analysis
- Tardiness reports

#### Financial Reports
- Fee collection status
- Outstanding payments
- Revenue analysis
- Budget vs actual spending

#### Operational Reports
- Staff performance metrics
- Child development tracking
- Facility utilization
- Incident reports

#### Custom Reports
- Date range selection
- Filter by nursery/branch/class
- Export to PDF/Excel
- Scheduled report delivery

### Dashboard Analytics

#### Key Metrics
- Total children enrolled
- Daily attendance rate
- Staff attendance
- Revenue tracking
- Parent satisfaction scores

#### Real-time Monitoring
- Current attendance numbers
- Pending approvals
- System alerts
- Emergency notifications

## System Configuration

### General Settings

#### System Preferences
- Language settings (Arabic/English)
- Time zone configuration
- Date format preferences
- Notification preferences

#### Security Settings
- Password policies
- Session timeout settings
- Two-factor authentication
- IP restrictions

### Integration Settings

#### SMS Configuration
- Twilio account setup
- SMS templates
- Delivery tracking

#### Email Configuration
- SMTP server settings
- Email templates
- Automated notifications

#### File Storage
- Local storage configuration
- AWS S3 setup
- File size limits
- Backup schedules

## Maintenance and Support

### Regular Maintenance Tasks

#### Daily Tasks
- Review attendance records
- Approve pending reports
- Check system notifications
- Backup data

#### Weekly Tasks
- Generate weekly reports
- Review staff performance
- Update child records
- Clean up old files

#### Monthly Tasks
- Financial reconciliation
- Staff evaluations
- System updates
- Parent feedback review

### Backup and Recovery

#### Automated Backups
- Daily database backups
- Weekly file system backups
- Offsite storage configuration

#### Manual Backup
1. Access Admin Panel → Backup
2. Select backup type (full/partial)
3. Choose storage location
4. Initiate backup process

#### Data Recovery
1. Access backup archives
2. Select restore point
3. Confirm restoration process
4. Verify data integrity

### Troubleshooting

#### Common Issues

**Users Can't Login**
- Check account status (active/inactive)
- Verify phone number format
- Reset password if needed

**Reports Not Saving**
- Check internet connection
- Verify user permissions
- Clear browser cache

**Photos Not Uploading**
- Check file size limits
- Verify file format (JPG, PNG)
- Check storage space

**Notifications Not Sending**
- Verify SMS/email configuration
- Check account balance/credits
- Review spam filters

### Support Resources

#### Help Documentation
- Online user guides
- Video tutorials
- FAQ section
- Contact support

#### Technical Support
- 24/7 technical assistance
- Emergency hotline
- Remote troubleshooting
- On-site support (premium)

## Best Practices

### Data Management
- Regular data backups
- Secure password policies
- Regular user access reviews
- Data retention policies

### Communication
- Clear communication protocols
- Regular parent updates
- Staff training programs
- Emergency communication plans

### Security
- Regular security audits
- Staff background checks
- Access control management
- Incident reporting procedures

### Quality Assurance
- Regular process reviews
- Staff performance monitoring
- Parent feedback collection
- Continuous improvement programs

## Emergency Procedures

### Medical Emergencies
1. Administer first aid if trained
2. Contact emergency services
3. Notify parents immediately
4. Document incident details

### System Outages
1. Switch to manual procedures
2. Notify technical support
3. Keep parents informed
4. Resume normal operations when resolved

### Security Incidents
1. Secure the area
2. Contact authorities if needed
3. Document all details
4. Review security procedures

This guide provides comprehensive information for effective nursery management. For additional support, please contact our technical support team.