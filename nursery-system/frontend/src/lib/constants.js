// User roles constants
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  PARENT: 'parent',
};

// Governorate constants (Arabic names)
export const GOVERNORATES = {
  Amman: 'عمان',
  Irbid: 'إربد',
  Zarqa: 'الزرقاء',
  Balqa: 'البلقاء',
  Madaba: 'مادبا',
  Mafraq: 'المفرق',
  Jerash: 'جرش',
  Ajloun: 'عجلون',
  Karak: 'الكرك',
  Tafilah: 'الطفيلة',
  Maan: 'معان',
  Aqaba: 'العقبة',
};

// Jordan governorates array for dropdowns
export const JORDAN_GOVERNORATES = Object.keys(GOVERNORATES);

// Report status constants
export const REPORT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REVISION_NEEDED: 'revision_needed',
};

// Attendance status constants
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
};

// Notification types
export const NOTIFICATION_TYPES = {
  REPORT_SUBMITTED: 'report_submitted',
  REPORT_APPROVED: 'report_approved',
  CHILD_ABSENT: 'child_absent',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system',
  USER: 'user',
  SECURITY: 'security',
  MAINTENANCE: 'maintenance',
  REPORT: 'report',
};

// Audit actions
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

// Feature flags
export const FEATURE_FLAGS = {
  'nursery.branchManagers.v1': import.meta.env.VITE_FEATURE_NURSERY_BRANCH_MANAGERS_V1 !== 'false',
};
