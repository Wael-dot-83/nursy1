import { apiClient, getEndpoint } from '../apiClient';

// User Management API (Admin only)
export const getUsers = (params) => apiClient.get(getEndpoint('/users'), { params });
export const createUser = (data) => apiClient.post(getEndpoint('/users'), data);
export const getUser = (id) => apiClient.get(getEndpoint(`/users/${id}`));
export const updateUser = (id, data) => apiClient.put(getEndpoint(`/users/${id}`), data);
export const deleteUser = (id) => apiClient.delete(getEndpoint(`/users/${id}`));
export const activateUser = (id) => apiClient.patch(getEndpoint(`/users/${id}/activate`));
export const deactivateUser = (id) => apiClient.patch(getEndpoint(`/users/${id}/deactivate`));
