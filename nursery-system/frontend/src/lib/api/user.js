import { apiClient } from '../apiClient';

// User Management API (Admin only)
export const getUsers = (params) => apiClient.get('/users', { params });
export const createUser = (data) => apiClient.post('/users', data);
export const getUser = (id) => apiClient.get(`/users/${id}`);
export const updateUser = (id, data) => apiClient.put(`/users/${id}`, data);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`);
export const activateUser = (id) => apiClient.patch(`/users/${id}/activate`);
export const deactivateUser = (id) => apiClient.patch(`/users/${id}/deactivate`);