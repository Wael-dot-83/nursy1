import { apiClient } from '../apiClient';

// Notifications API
export const getNotifications = (params) => apiClient.get('/notifications', { params });
export const markAsRead = (id) => apiClient.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => apiClient.patch('/notifications/read-all');
export const createNotification = (data) => apiClient.post('/notifications', data);
export const deleteNotification = (id) => apiClient.delete(`/notifications/${id}`);