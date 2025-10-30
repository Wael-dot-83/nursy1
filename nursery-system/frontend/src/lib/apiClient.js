import axios from 'axios';
import { getStoredToken, clearToken } from './token';

// Use relative URL in development (proxied by Vite) or VITE_API_URL in production
const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : ''; // Empty string means requests go to same origin (proxied by Vite in dev)

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Default export for easier imports
export default apiClient;

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);

export function handleApiError(error) {
  // Handle specific HTTP status codes with localized messages
  if (error.response?.status === 401) {
    return 'اسم المستخدم أو كلمة المرور غير صحيحة. الرجاء المحاولة مرة أخرى.';
  }
  if (error.response?.status === 403) {
    return 'ليس لديك صلاحية للوصول إلى هذا المورد.';
  }
  if (error.response?.status === 404) {
    return 'الصفحة أو المورد المطلوب غير موجود.';
  }
  if (error.response?.status === 500) {
    return 'حدث خطأ في الخادم. الرجاء المحاولة لاحقاً.';
  }

  // Check for backend-provided messages
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle Pydantic validation errors (array format)
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;

    // If detail is an array (Pydantic validation errors)
    if (Array.isArray(detail)) {
      const messages = detail.map(err => {
        if (typeof err === 'object' && err.msg) {
          // Extract field location if available
          const field = err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : '';
          return field ? `${field}: ${err.msg}` : err.msg;
        }
        return String(err);
      });
      return messages.join(', ');
    }

    // If detail is a string, return it
    if (typeof detail === 'string') {
      return detail;
    }

    // If detail is an object with msg property
    if (typeof detail === 'object' && detail.msg) {
      return detail.msg;
    }
  }

  // Fallback for network errors or unknown issues
  if (!error.response) {
    return 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.';
  }

  return 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.';
}

export function extractErrorMessage(error) {
  // Handle different error response formats
  if (error?.response?.data) {
    const data = error.response.data;

    // If there's a general message
    if (data.message) {
      return data.message;
    }

    // If there are field-specific errors
    if (data.errors && typeof data.errors === 'object') {
      const fieldErrors = Object.entries(data.errors)
        .map(([field, messages]) => {
          const messageList = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${messageList.join(', ')}`;
        })
        .join('\n');
      return `أخطاء في التحقق:\n${fieldErrors}`;
    }

    // If it's a string error
    if (typeof data === 'string') {
      return data;
    }
  }

  // Fallback to error message
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // Last resort
  return 'حدث خطأ غير متوقع';
}

export function extractFieldErrors(error) {
  // Extract field-specific errors for form validation
  if (error?.response?.data?.errors && typeof error.response.data.errors === 'object') {
    return error.response.data.errors;
  }
  return {};
}
