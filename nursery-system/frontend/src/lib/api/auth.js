import { apiClient } from '../apiClient';

// Authentication API
export const login = (email, password) => apiClient.post('/auth/login', { email, password });
export const requestOTP = (email) => apiClient.post('/auth/otp/request', { email });
export const verifyOTP = (email, otp_code) => apiClient.post('/auth/otp/verify', { email, otp_code });
export const refreshToken = (refresh_token) => apiClient.post('/auth/refresh', { refresh_token });
export const changePassword = (currentPassword, newPassword) =>
  apiClient.post('/auth/password/change', { currentPassword, newPassword });