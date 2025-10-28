import { apiClient } from './apiClient';

// Authentication API
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  requestOTP: (email) => apiClient.post('/auth/otp/request', { email }),
  verifyOTP: (email, otp_code) => apiClient.post('/auth/otp/verify', { email, otp_code }),
  refreshToken: (refresh_token) => apiClient.post('/auth/refresh', { refresh_token }),
  changePassword: (currentPassword, newPassword) =>
    apiClient.post('/auth/password/change', { currentPassword, newPassword }),
};

// Nursery Management API (Admin only)
export const nurseryAPI = {
  // Nurseries
  getNurseries: (params) => apiClient.get('/admin/nurseries', { params }),
  createNursery: (data) => apiClient.post('/admin/nurseries', data),
  getNursery: (id) => apiClient.get(`/admin/nurseries/${id}`),
  updateNursery: (id, data) => apiClient.put(`/admin/nurseries/${id}`, data),
  deleteNursery: (id) => apiClient.delete(`/admin/nurseries/${id}`),

  // Branches
  getBranches: (nurseryId, params) => apiClient.get(`/admin/nurseries/${nurseryId}/branches`, { params }),
  createBranch: (nurseryId, data) => apiClient.post(`/admin/nurseries/${nurseryId}/branches`, data),
  getBranch: (nurseryId, branchId) => apiClient.get(`/admin/nurseries/${nurseryId}/branches/${branchId}`),
  updateBranch: (nurseryId, branchId, data) => apiClient.put(`/admin/nurseries/${nurseryId}/branches/${branchId}`, data),
  deleteBranch: (nurseryId, branchId) => apiClient.delete(`/admin/nurseries/${nurseryId}/branches/${branchId}`),

  // Classrooms
  getClassrooms: (branchId, params) => apiClient.get(`/admin/nurseries/branches/${branchId}/classrooms`, { params }),
  createClassroom: (branchId, data) => apiClient.post(`/admin/nurseries/branches/${branchId}/classrooms`, data),
  getClassroom: (branchId, classroomId) => apiClient.get(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`),
  updateClassroom: (branchId, classroomId, data) => apiClient.put(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`, data),
  deleteClassroom: (branchId, classroomId) => apiClient.delete(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`),
};

// User Management API (Admin only)
export const userAPI = {
  getUsers: (params) => apiClient.get('/users', { params }),
  createUser: (data) => apiClient.post('/users', data),
  getUser: (id) => apiClient.get(`/users/${id}`),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  activateUser: (id) => apiClient.patch(`/users/${id}/activate`),
  deactivateUser: (id) => apiClient.patch(`/users/${id}/deactivate`),
};

// Children Management API
export const childrenAPI = {
  // Admin endpoints
  getChildren: (params) => apiClient.get('/children', { params }),
  createChild: (data) => apiClient.post('/children', data),
  getChild: (id) => apiClient.get(`/children/${id}`),
  updateChild: (id, data) => apiClient.put(`/children/${id}`, data),
  deleteChild: (id) => apiClient.delete(`/children/${id}`),

  // Manager/Supervisor endpoints
  getMyNurseryChildren: (params) => apiClient.get('/children/my-nursery', { params }),
  getMyChildren: () => apiClient.get('/children/my-children'),

  // Parent endpoints
  getParentChildren: () => apiClient.get('/children/parent'),
  getParentChild: (id) => apiClient.get(`/children/parent/${id}`),
};

// Attendance API
export const attendanceAPI = {
  // Admin endpoints
  getAttendance: (params) => apiClient.get('/attendance', { params }),
  createAttendance: (data) => apiClient.post('/attendance', data),
  getAttendanceRecord: (id) => apiClient.get(`/attendance/${id}`),
  updateAttendance: (id, data) => apiClient.put(`/attendance/${id}`, data),
  deleteAttendance: (id) => apiClient.delete(`/attendance/${id}`),

  // Manager/Supervisor endpoints
  getMyNurseryAttendance: (params) => apiClient.get('/attendance/my-nursery', { params }),
  checkInChild: (childId) => apiClient.post(`/attendance/check-in/${childId}`),
  checkOutChild: (childId) => apiClient.post(`/attendance/check-out/${childId}`),

  // Parent endpoints
  getChildAttendance: (childId, params) => apiClient.get(`/attendance/parent/${childId}`, { params }),

  // Statistics
  getDailyAttendanceStats: (date) => apiClient.get('/attendance/stats/daily', { params: { target_date: date } }),
};

// Reports API
export const reportsAPI = {
  // Daily Reports
  getDailyReports: (params) => apiClient.get('/reports', { params }),
  createDailyReport: (data) => apiClient.post('/reports', data),
  getDailyReport: (id) => apiClient.get(`/reports/${id}`),
  updateDailyReport: (id, data) => apiClient.put(`/reports/${id}`, data),
  deleteDailyReport: (id) => apiClient.delete(`/reports/${id}`),

  // Supervisor endpoints
  getMyNurseryReports: (params) => apiClient.get('/reports/my-nursery', { params }),
  createChildReport: (childId, data) => apiClient.post(`/reports/child/${childId}`, data),
  updateChildReport: (childId, date, data) => apiClient.put(`/reports/child/${childId}/date/${date}`, data),

  // Parent endpoints
  getChildReports: (childId, params) => apiClient.get(`/reports/parent/${childId}`, { params }),

  // Statistics and Analytics
  getNurseryStats: () => apiClient.get('/reports/stats/nursery'),
  getChildrenStats: () => apiClient.get('/reports/stats/children'),
};

// File Upload API (to be implemented)
export const fileAPI = {
  uploadFile: (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }
    return apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFiles: (params) => apiClient.get('/files', { params }),
  getFile: (id) => apiClient.get(`/files/${id}`),
  deleteFile: (id) => apiClient.delete(`/files/${id}`),
  downloadFile: (id) => apiClient.get(`/files/${id}/download`, { responseType: 'blob' }),
};

// Notifications API (to be implemented)
export const notificationsAPI = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
  createNotification: (data) => apiClient.post('/notifications', data),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
};

// Health check
export const healthAPI = {
  checkHealth: () => apiClient.get('/health'),
};