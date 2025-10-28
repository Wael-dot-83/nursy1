import { apiClient } from '../apiClient';

// Daily Reports API
export const getDailyReports = (params) => apiClient.get('/reports', { params });
export const createDailyReport = (data) => apiClient.post('/reports', data);
export const getDailyReport = (id) => apiClient.get(`/reports/${id}`);
export const updateDailyReport = (id, data) => apiClient.put(`/reports/${id}`, data);
export const deleteDailyReport = (id) => apiClient.delete(`/reports/${id}`);

// Supervisor endpoints
export const getMyNurseryReports = (params) => apiClient.get('/reports/my-nursery', { params });
export const createChildReport = (childId, data) => apiClient.post(`/reports/child/${childId}`, data);
export const updateChildReport = (childId, date, data) => apiClient.put(`/reports/child/${childId}/date/${date}`, data);

// Parent endpoints
export const getChildReports = (childId, params) => apiClient.get(`/reports/parent/${childId}`, { params });

// Statistics and Analytics
export const getNurseryStats = () => apiClient.get('/reports/stats/nursery');
export const getChildrenStats = () => apiClient.get('/reports/stats/children');