import { apiClient, getEndpoint } from '../apiClient';

// File Upload API
export const uploadFile = (file, metadata) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
  }
  return apiClient.post(getEndpoint('/files/upload'), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getFiles = (params) => apiClient.get(getEndpoint('/files'), { params });
export const getFile = (id) => apiClient.get(getEndpoint(`/files/${id}`));
export const deleteFile = (id) => apiClient.delete(getEndpoint(`/files/${id}`));
export const downloadFile = (id) => apiClient.get(getEndpoint(`/files/${id}/download`), { responseType: 'blob' });
