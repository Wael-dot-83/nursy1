import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { apiClient, handleApiError, configureApiClient, getEndpoint } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Store access token in memory only (not localStorage) for security
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const refreshTimeoutRef = useRef(null);

  // Clear all auth state
  const resetAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setRequiresPasswordChange(false);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Refresh access token using httpOnly cookie
  const refreshAccessToken = useCallback(async () => {
    try {
      const { data } = await apiClient.post(getEndpoint('/auth/refresh'), {}, {
        withCredentials: true, // Send httpOnly cookies
      });

      if (data.access_token) {
        setAccessToken(data.access_token);
        return data.access_token;
      }

      // If refresh fails, logout user
      resetAuth();
      return null;
    } catch (err) {
      // Only log non-401 errors (401 is expected when not authenticated)
      if (err.response?.status !== 401) {
        console.error('Token refresh failed:', err);
      }
      resetAuth();
      return null;
    }
  }, [resetAuth]);

  // Schedule automatic token refresh before expiry
  const scheduleTokenRefresh = useCallback((expiresIn) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Refresh 1 minute before expiry (expiresIn is in seconds)
    const refreshTime = (expiresIn - 60) * 1000;

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshAccessToken();
      }, refreshTime);
    }
  }, [refreshAccessToken]);

  // Login with email and password
  const loginWithPassword = useCallback(async ({ email, password, role }) => {
    try {
      const { data } = await apiClient.post(getEndpoint('/auth/login'), { email, password, role }, {
        withCredentials: true, // Enable cookies
      });

      // Backend returns { access_token, token_type, expires_in, user }
      // Refresh token is in httpOnly cookie
      setAccessToken(data.access_token);
      setUser(data.user);
      setRequiresPasswordChange(false);
      setError(null);

      // Schedule automatic token refresh
      if (data.expires_in) {
        scheduleTokenRefresh(data.expires_in);
      }

      return data;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw new Error(message);
    }
  }, [scheduleTokenRefresh]);



  // Change password
  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    try {
      const { data } = await apiClient.post(getEndpoint('/auth/password/change'), {
        current_password: currentPassword,
        new_password: newPassword,
      });

      // After password change, user needs to login again
      setRequiresPasswordChange(false);

      return data;
    } catch (err) {
      throw new Error(handleApiError(err));
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiClient.post(getEndpoint('/auth/logout'), {}, {
        withCredentials: true, // Send cookies for token revocation
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      resetAuth();
    }
  }, [resetAuth]);

  // Update user info
  const updateUser = useCallback((nextUser) => {
    const merged = { ...user, ...nextUser };
    setUser(merged);
  }, [user]);

  // Configure API client with token getter and refresh function
  useEffect(() => {
    configureApiClient(
      () => accessToken,
      refreshAccessToken
    );
  }, [accessToken, refreshAccessToken]);

  // Try to refresh token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to refresh token from httpOnly cookie
        const token = await refreshAccessToken();

        if (token) {
          // Get user info with the refreshed token
          const { data: userData } = await apiClient.get(getEndpoint('/auth/me'));
          setUser(userData);
        }
      } catch (err) {
        // Only log non-401 errors (401 is expected when not authenticated)
        if (err.response?.status !== 401) {
          console.error('Auth initialization failed:', err);
        }
        // Don't reset auth here, just mark as not initializing
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({
    accessToken,
    user,
    role: user?.role,
    isAuthenticated: Boolean(accessToken && user),
    isInitializing,
    requiresPasswordChange,
    error,
    actions: {
      loginWithPassword,
      changePassword,
      logout,
      updateUser,
      refreshAccessToken,
    },
  }), [
    accessToken,
    user,
    isInitializing,
    requiresPasswordChange,
    error,
    loginWithPassword,
    changePassword,
    logout,
    updateUser,
    refreshAccessToken,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
