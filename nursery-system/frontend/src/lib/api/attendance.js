import { apiClient, getEndpoint } from '../apiClient';

// Attendance API
export const getAttendance = (params) => apiClient.get(getEndpoint('/attendance'), { params });
export const createAttendance = (data) => apiClient.post(getEndpoint('/attendance'), data);
export const getAttendanceRecord = (id) => apiClient.get(getEndpoint(`/attendance/${id}`));
export const updateAttendance = (id, data) => apiClient.put(getEndpoint(`/attendance/${id}`), data);
export const deleteAttendance = (id) => apiClient.delete(getEndpoint(`/attendance/${id}`));

// Manager/Supervisor endpoints
export const getMyNurseryAttendance = (params) => apiClient.get(getEndpoint('/attendance/my-nursery'), { params });
export const checkInChild = (childId) => apiClient.post(getEndpoint(`/attendance/check-in/${childId}`));
export const checkOutChild = (childId) => apiClient.post(getEndpoint(`/attendance/check-out/${childId}`));

// Parent endpoints
export const getChildAttendance = (childId, params) => apiClient.get(getEndpoint(`/attendance/parent/${childId}`), { params });

// Statistics
export const getDailyAttendanceStats = (date) => apiClient.get(getEndpoint('/attendance/stats/daily'), { params: { target_date: date } });
