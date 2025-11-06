/**
 * Test suite for AuthContext
 * Tests authentication state management, login/logout flows
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { I18nProvider } from '../contexts/I18nContext';

// Mock API client
vi.mock('../lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  handleApiError: vi.fn((err) => err.message || 'Error'),
  configureApiClient: vi.fn(),
  getEndpoint: vi.fn((path) => `http://localhost:8002${path}`),
  API_BASE_URL: 'http://localhost:8002',
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('provides authentication actions', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.actions).toBeDefined();
    expect(result.current.actions.loginWithPassword).toBeInstanceOf(Function);
    expect(result.current.actions.logout).toBeInstanceOf(Function);
    expect(result.current.actions.changePassword).toBeInstanceOf(Function);
  });

  it('sets authenticated state after successful login', async () => {
    const { apiClient } = await import('../lib/apiClient');
    
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'admin',
      full_name: 'Test User',
    };

    apiClient.post.mockResolvedValue({
      data: {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 900,
        user: mockUser,
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.actions.loginWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('mock-token');
    });
  });

  it('clears state after logout', async () => {
    const { apiClient } = await import('../lib/apiClient');
    
    // Mock successful login
    apiClient.post.mockResolvedValueOnce({
      data: {
        access_token: 'mock-token',
        user: { id: 1, email: 'test@example.com', role: 'admin' },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Login first
    await act(async () => {
      await result.current.actions.loginWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Mock logout
    apiClient.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

    // Then logout
    await act(async () => {
      await result.current.actions.logout();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
    });
  });

  it('handles login errors gracefully', async () => {
    const { apiClient } = await import('../lib/apiClient');
    
    apiClient.post.mockRejectedValue({
      response: {
        status: 401,
        data: { detail: 'Invalid credentials' },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.actions.loginWithPassword({
          email: 'wrong@example.com',
          password: 'wrongpass',
        });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('provides user role information', async () => {
    const { apiClient } = await import('../lib/apiClient');
    
    apiClient.post.mockResolvedValue({
      data: {
        access_token: 'mock-token',
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.actions.loginWithPassword({
        email: 'admin@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(result.current.role).toBe('admin');
    });
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });
});
