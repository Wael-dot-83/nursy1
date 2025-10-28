import { apiClient } from '../apiClient';

// Children Management API
export const getChildren = (params) => apiClient.get('/children', { params });
export const createChild = (data) => apiClient.post('/children', data);
export const getChild = (id) => apiClient.get(`/children/${id}`);
export const updateChild = (id, data) => apiClient.put(`/children/${id}`, data);
export const deleteChild = (id) => apiClient.delete(`/children/${id}`);

// Manager/Supervisor endpoints
export const getMyNurseryChildren = (params) => apiClient.get('/children/my-nursery', { params });
export const getMyChildren = () => apiClient.get('/children/my-children');

// Parent endpoints
export const getParentChildren = () => apiClient.get('/children/parent');
export const getParentChild = (id) => apiClient.get(`/children/parent/${id}`);