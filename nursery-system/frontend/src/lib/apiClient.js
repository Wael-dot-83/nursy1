import axios from 'axios';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const rawConfiguredBase = (import.meta.env.VITE_API_URL || '').trim();
let API_BASE = rawConfiguredBase ? rawConfiguredBase.replace(/\/$/, '') : '';

if (API_BASE && typeof window !== 'undefined') {
  try {
    const configuredUrl = new URL(API_BASE);
    const pathSuffix = configuredUrl.pathname === '/' ? '' : configuredUrl.pathname.replace(/\/$/, '');
    const currentHostname = window.location.hostname;
    const configuredHost = configuredUrl.hostname.toLowerCase();
    const currentHostLower = currentHostname ? currentHostname.toLowerCase() : '';

    if (
      currentHostname &&
      LOCAL_HOSTNAMES.has(configuredHost) &&
      !LOCAL_HOSTNAMES.has(currentHostLower)
    ) {
      const port = configuredUrl.port ? `:${configuredUrl.port}` : '';
      API_BASE = `${configuredUrl.protocol}//${currentHostname}${port}${pathSuffix}`;
    } else {
      API_BASE = `${configuredUrl.protocol}//${configuredUrl.host}${pathSuffix}`;
    }
  } catch (error) {
    // Invalid VITE_API_URL, fall back to same-origin proxy usage.
    console.warn('[apiClient] Invalid VITE_API_URL; falling back to same-origin requests.', error);
    API_BASE = '';
  }
}

export const API_BASE_URL = API_BASE;

// Helper to get correct endpoint path
// When VITE_API_URL is set (direct connection), don't use /api prefix
// When using proxy (no VITE_API_URL), use /api prefix
export function getEndpoint(path) {
  if (import.meta.env.VITE_API_URL) {
    // Direct connection to backend - no /api prefix needed
    return path;
  }
  // Using Vite proxy - add /api prefix if not already present
  return path.startsWith('/api') ? path : `/api${path}`;
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8',
  },
  withCredentials: true,
  responseType: 'json',
  responseEncoding: 'utf8',
});

// Default export for easier imports
export default apiClient;

// Store reference to get current access token
let getAccessToken = null;
let refreshAccessTokenFn = null;

/**
 * Configure API client with access token getter and refresh function
 * Called from AuthProvider
 */
export function configureApiClient(accessTokenGetter, refreshTokenFunction) {
  getAccessToken = accessTokenGetter;
  refreshAccessTokenFn = refreshTokenFunction;
}

// Request interceptor: Add access token to all requests
apiClient.interceptors.request.use(
  (config) => {
    if (getAccessToken) {
      const token = getAccessToken();
      if (token) {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors with automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if this is already a refresh or login request (prevents infinite loop)
    const isRefreshRequest = originalRequest.url?.includes(getEndpoint('/auth/refresh'));
    const isLoginRequest = originalRequest.url?.includes(getEndpoint('/auth/login'));

    // If 401 error and we haven't retried yet and it's not a refresh/login request
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !isLoginRequest) {
      originalRequest._retry = true;

      try {
        // Try to refresh the access token
        if (refreshAccessTokenFn) {
          const newToken = await refreshAccessTokenFn();

          if (newToken) {
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, reject with original error
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(error);
      }
    }

    // For all other errors or if refresh failed
    return Promise.reject(error);
  }
);

export function handleApiError(error, t = null) {
  // If translation function is provided, use it
  const translate = t || ((key) => {
    const fallbacks = {
      'error.unauthorized': 'اسم المستخدم أو كلمة المرور غير صحيحة. الرجاء المحاولة مرة أخرى.',
      'error.forbidden': 'ليس لديك صلاحية للوصول إلى هذا المورد.',
      'error.not_found': 'الصفحة أو المورد المطلوب غير موجود.',
      'error.rate_limit': 'تم تجاوز الحد الأقصى من المحاولات. الرجاء المحاولة لاحقاً.',
      'error.server': 'حدث خطأ في الخادم. الرجاء المحاولة لاحقاً.',
      'error.network': 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.',
      'error.unexpected': 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.',
    };
    return fallbacks[key] || key;
  });

  // Handle specific HTTP status codes with localized messages
  if (error.response?.status === 401) {
    return translate('error.unauthorized');
  }
  if (error.response?.status === 403) {
    return translate('error.forbidden');
  }
  if (error.response?.status === 404) {
    return translate('error.not_found');
  }
  if (error.response?.status === 429) {
    return translate('error.rate_limit');
  }
  if (error.response?.status === 500) {
    return translate('error.server');
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
    // Network error - no response from server
    const baseURL = error.config?.baseURL || window.location.origin;
    return translate('error.network') + ` (${baseURL})`;
  }

  return translate('error.unexpected');
}

/**
 * Check if backend server is reachable
 */
export async function checkBackendHealth() {
  try {
    const healthTimeout =
      Number(import.meta.env.VITE_HEALTH_TIMEOUT) || 10000; // Default to 10 seconds
    const response = await apiClient.get(getEndpoint('/health'), {
      timeout: healthTimeout,
    });
    return response.status === 200;
  } catch (err) {
    console.error('Backend health check failed:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      response: err.response?.status,
      url: err.config?.url,
      baseURL: err.config?.baseURL
    });
    return false;
  }
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
