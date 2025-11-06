
import { apiClient } from './apiClient';

// REMOVED: Notification API calls are moved to a dedicated file.
/*
export const notificationsAPI = {
  getNotifications: (params) => apiClient.get('/notifications/', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
  createNotification: (data) => apiClient.post('/notifications/', data),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
};
*/
