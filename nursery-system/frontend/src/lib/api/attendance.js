import { apiClient } from '../apiClient';

// Attendance API
export const getAttendance = (params) => apiClient.get('/attendance', { params });
export const createAttendance = (data) => apiClient.post('/attendance', data);
export const getAttendanceRecord = (id) => apiClient.get(`/attendance/${id}`);
export const updateAttendance = (id, data) => apiClient.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => apiClient.delete(`/attendance/${id}`);

// Manager/Supervisor endpoints
export const getMyNurseryAttendance = (params) => apiClient.get('/attendance/my-nursery', { params });
export const checkInChild = (childId) => apiClient.post(`/attendance/check-in/${childId}`);
export const checkOutChild = (childId) => apiClient.post(`/attendance/check-out/${childId}`);

// Parent endpoints
export const getChildAttendance = (childId, params) => apiClient.get(`/attendance/parent/${childId}`, { params });

// Statistics
export const getDailyAttendanceStats = (date) => apiClient.get('/attendance/stats/daily', { params: { target_date: date } });