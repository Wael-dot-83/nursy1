import { apiClient, getEndpoint } from '../apiClient';

// Authentication API
export const login = (email, password) => apiClient.post(getEndpoint('/auth/login'), { email, password });
export const requestOTP = (email) => apiClient.post(getEndpoint('/auth/otp/request'), { email });
export const verifyOTP = (email, otp_code) => apiClient.post(getEndpoint('/auth/otp/verify'), { email, otp_code });
export const refreshToken = (refresh_token) => apiClient.post(getEndpoint('/auth/refresh'), { refresh_token });
export const changePassword = (currentPassword, newPassword) =>
  apiClient.post(getEndpoint('/auth/password/change'), { currentPassword, newPassword });
