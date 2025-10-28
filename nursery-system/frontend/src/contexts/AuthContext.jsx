import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient, handleApiError } from '../lib/apiClient';
import {
  clearToken,
  clearUser,
  decodeToken,
  getRoleFromToken,
  getStoredToken,
  getStoredUser,
  isTokenExpired,
  storeToken,
  storeUser,
} from '../lib/token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  const resetAuth = useCallback(() => {
    clearToken();
    clearUser();
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    setRequiresPasswordChange(false);
  }, []);

    const applyAuth = useCallback(({ token: nextToken, refreshToken: nextRefreshToken, user: nextUser, requiresPasswordChange: needPasswordChange }) => {
    if (!nextToken) {
      clearToken();
      clearUser();
      setToken(null);
      setUser(null);
      setRequiresPasswordChange(false);
      return;
    }
    storeToken(nextToken);
    if (nextRefreshToken) {
      // Store refresh token securely (you might want to use httpOnly cookies for production)
      localStorage.setItem('refreshToken', nextRefreshToken);
    }
    const payload = nextUser || decodeToken(nextToken);
    const safeUser = {
      ...payload,
      ...nextUser,
      role: nextUser?.role || getRoleFromToken(nextToken),
    };
    storeUser(safeUser);
    setToken(nextToken);
    setUser(safeUser);
    setRequiresPasswordChange(Boolean(needPasswordChange));
  }, []);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        const payload = decodeToken(storedToken);
        if (payload) {
          setUser({ role: payload.role, sub: payload.sub });
        }
      }
    } else {
      resetAuth();
    }
    setIsInitializing(false);
  }, [resetAuth]);

  const loginWithPassword = useCallback(async ({ email, password }) => {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      // Backend returns { access_token, token_type, refresh_token }
      applyAuth({
        token: data.access_token,
        refreshToken: data.refresh_token,
        user: null, // Will be decoded from token
        requiresPasswordChange: false, // Backend doesn't provide this
      });
      setError(null);
      return data;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw new Error(message);
    }
  }, [applyAuth]);

  const requestOtp = useCallback(async ({ email, purpose = 'login' }) => {
    try {
      await apiClient.post('/auth/otp/request', { email, purpose });
      setError(null);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const verifyOtp = useCallback(async ({ email, code, purpose = 'login' }) => {
    try {
      const { data } = await apiClient.post('/auth/otp/verify', { email, code, purpose });
      // Backend returns { access_token, token_type, refresh_token }
      applyAuth({
        token: data.access_token,
        refreshToken: data.refresh_token,
        user: null, // Will be decoded from token
        requiresPasswordChange: false, // Backend doesn't provide this
      });
      setError(null);
      return data;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw new Error(message);
    }
  }, [applyAuth]);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    try {
      const { data } = await apiClient.post('/auth/password/change', {
        currentPassword,
        newPassword,
      });
      if (data?.user && token) {
        applyAuth({ token, user: data.user, requiresPasswordChange: false });
      } else {
        setRequiresPasswordChange(false);
      }
      return data;
    } catch (err) {
      throw new Error(handleApiError(err));
    }
  }, [applyAuth, token]);

  const logout = useCallback(() => {
    resetAuth();
  }, [resetAuth]);

  const updateUser = useCallback((nextUser) => {
    const merged = { ...user, ...nextUser };
    setUser(merged);
    storeUser(merged);
  }, [user]);

  const value = useMemo(() => ({
    token,
    user,
    role: user?.role,
    isAuthenticated: Boolean(token),
    isInitializing,
    requiresPasswordChange,
    error,
    actions: {
      loginWithPassword,
      requestOtp,
      verifyOtp,
      changePassword,
      logout,
      updateUser,
      applyAuth,
    },
  }), [
    token,
    user,
    isInitializing,
    requiresPasswordChange,
    error,
    loginWithPassword,
    requestOtp,
    verifyOtp,
    changePassword,
    logout,
    updateUser,
    applyAuth,
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
