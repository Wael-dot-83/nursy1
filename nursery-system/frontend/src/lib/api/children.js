import { apiClient, getEndpoint } from '../apiClient';

// Children Management API
export const getChildren = (params) => apiClient.get(getEndpoint('/children'), { params });
export const createChild = (data) => apiClient.post(getEndpoint('/children'), data);
export const getChild = (id) => apiClient.get(getEndpoint(`/children/${id}`));
export const updateChild = (id, data) => apiClient.put(getEndpoint(`/children/${id}`), data);
export const deleteChild = (id) => apiClient.delete(getEndpoint(`/children/${id}`));

// Manager/Supervisor endpoints
export const getMyNurseryChildren = (params) => apiClient.get(getEndpoint('/children/my-nursery'), { params });
export const getMyChildren = () => apiClient.get(getEndpoint('/children/my-children'));

// Parent endpoints
export const getParentChildren = () => apiClient.get(getEndpoint('/children/parent'));
export const getParentChild = (id) => apiClient.get(getEndpoint(`/children/parent/${id}`));
