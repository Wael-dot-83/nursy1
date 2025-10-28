import { apiClient } from '../apiClient';

// Nursery Management API (Admin only)
export const getNurseries = (params) => apiClient.get('/admin/nurseries', { params });
export const createNursery = (data) => apiClient.post('/admin/nurseries', data);
export const getNursery = (id) => apiClient.get(`/admin/nurseries/${id}`);
export const updateNursery = (id, data) => apiClient.put(`/admin/nurseries/${id}`, data);
export const deleteNursery = (id) => apiClient.delete(`/admin/nurseries/${id}`);

// Branches
export const getBranches = (nurseryId, params) => apiClient.get(`/admin/nurseries/${nurseryId}/branches`, { params });
export const createBranch = (nurseryId, data) => apiClient.post(`/admin/nurseries/${nurseryId}/branches`, data);
export const getBranch = (nurseryId, branchId) => apiClient.get(`/admin/nurseries/${nurseryId}/branches/${branchId}`);
export const updateBranch = (nurseryId, branchId, data) => apiClient.put(`/admin/nurseries/${nurseryId}/branches/${branchId}`, data);
export const deleteBranch = (nurseryId, branchId) => apiClient.delete(`/admin/nurseries/${nurseryId}/branches/${branchId}`);

// Classrooms
export const getClassrooms = (branchId, params) => apiClient.get(`/admin/nurseries/branches/${branchId}/classrooms`, { params });
export const createClassroom = (branchId, data) => apiClient.post(`/admin/nurseries/branches/${branchId}/classrooms`, data);
export const getClassroom = (branchId, classroomId) => apiClient.get(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`);
export const updateClassroom = (branchId, classroomId, data) => apiClient.put(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`, data);
export const deleteClassroom = (branchId, classroomId) => apiClient.delete(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`);