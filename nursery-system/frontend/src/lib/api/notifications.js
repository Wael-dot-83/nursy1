import { apiClient, getEndpoint } from '../apiClient';

// Notifications API
export const getNotifications = (params) => apiClient.get(getEndpoint('/notifications'), { params });
export const markAsRead = (id) => apiClient.patch(getEndpoint(`/notifications/${id}/read`));
export const markAllAsRead = () => apiClient.patch(getEndpoint('/notifications/read-all'));
export const createNotification = (data) => apiClient.post(getEndpoint('/notifications'), data);
export const deleteNotification = (id) => apiClient.delete(getEndpoint(`/notifications/${id}`));
