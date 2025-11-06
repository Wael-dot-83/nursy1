import { apiClient, getEndpoint } from '../apiClient';

// Daily Reports API
export const getDailyReports = (params) => apiClient.get(getEndpoint('/reports'), { params });
export const createDailyReport = (data) => apiClient.post(getEndpoint('/reports'), data);
export const getDailyReport = (id) => apiClient.get(getEndpoint(`/reports/${id}`));
export const updateDailyReport = (id, data) => apiClient.put(getEndpoint(`/reports/${id}`), data);
export const deleteDailyReport = (id) => apiClient.delete(getEndpoint(`/reports/${id}`));

// Supervisor endpoints
export const getMyNurseryReports = (params) => apiClient.get(getEndpoint('/reports/my-nursery'), { params });
export const createChildReport = (childId, data) => apiClient.post(getEndpoint(`/reports/child/${childId}`), data);
export const updateChildReport = (childId, date, data) => apiClient.put(getEndpoint(`/reports/child/${childId}/date/${date}`), data);

// Parent endpoints
export const getChildReports = (childId, params) => apiClient.get(getEndpoint(`/reports/parent/${childId}`), { params });

// Statistics and Analytics
export const getNurseryStats = () => apiClient.get(getEndpoint('/reports/stats/nursery'));
export const getChildrenStats = () => apiClient.get(getEndpoint('/reports/stats/children'));
