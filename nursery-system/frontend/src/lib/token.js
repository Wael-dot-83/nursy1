const TOKEN_KEY = 'nursery.token';
const USER_KEY = 'nursery.user';
const REFRESH_TOKEN_KEY = 'nursery.refreshToken';

export function getStoredToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}

export function storeToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
}

export function storeRefreshToken(refreshToken) {
  if (typeof window === 'undefined') return;
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearRefreshToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function storeUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(USER_KEY);
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function clearUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}

export function decodeToken(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now();
}

export function getRoleFromToken(token) {
  const payload = decodeToken(token);
  return payload?.role;
}
