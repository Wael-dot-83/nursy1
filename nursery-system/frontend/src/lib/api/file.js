import { apiClient } from '../apiClient';

// File Upload API
export const uploadFile = (file, metadata) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
  }
  return apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getFiles = (params) => apiClient.get('/files', { params });
export const getFile = (id) => apiClient.get(`/files/${id}`);
export const deleteFile = (id) => apiClient.delete(`/files/${id}`);
export const downloadFile = (id) => apiClient.get(`/files/${id}/download`, { responseType: 'blob' });