import { apiClient, getEndpoint } from '../apiClient';

// Nursery Management API (Admin only)
export const getNurseries = (params) => apiClient.get(getEndpoint('/admin/nurseries'), { params });
export const createNursery = (data) => apiClient.post(getEndpoint('/admin/nurseries'), data);
export const getNursery = (id) => apiClient.get(getEndpoint(`/admin/nurseries/${id}`));
export const updateNursery = (id, data) => apiClient.put(getEndpoint(`/admin/nurseries/${id}`), data);
export const deleteNursery = (id) => apiClient.delete(getEndpoint(`/admin/nurseries/${id}`));

// Branches
export const getBranches = (nurseryId, params) => apiClient.get(getEndpoint(`/admin/nurseries/${nurseryId}/branches`), { params });
export const createBranch = (nurseryId, data) => apiClient.post(getEndpoint(`/admin/nurseries/${nurseryId}/branches`), data);
export const getBranch = (nurseryId, branchId) => apiClient.get(getEndpoint(`/admin/nurseries/${nurseryId}/branches/${branchId}`));
export const updateBranch = (nurseryId, branchId, data) => apiClient.put(getEndpoint(`/admin/nurseries/${nurseryId}/branches/${branchId}`), data);
export const deleteBranch = (nurseryId, branchId) => apiClient.delete(getEndpoint(`/admin/nurseries/${nurseryId}/branches/${branchId}`));

// Classrooms
export const getClassrooms = (branchId, params) => apiClient.get(getEndpoint(`/admin/nurseries/branches/${branchId}/classrooms`), { params });
export const createClassroom = (branchId, data) => apiClient.post(getEndpoint(`/admin/nurseries/branches/${branchId}/classrooms`), data);
export const getClassroom = (branchId, classroomId) => apiClient.get(getEndpoint(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`));
export const updateClassroom = (branchId, classroomId, data) => apiClient.put(getEndpoint(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`), data);
export const deleteClassroom = (branchId, classroomId) => apiClient.delete(getEndpoint(`/admin/nurseries/branches/${branchId}/classrooms/${classroomId}`));
