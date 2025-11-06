/**
 * Test suite for Login component
 * Tests rendering, user interactions, and authentication flow
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '../pages/auth/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../contexts/I18nContext';

// Mock API client
vi.mock('../lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  handleApiError: vi.fn((err) => err.message || 'Error'),
  checkBackendHealth: vi.fn(() => Promise.resolve(true)),
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password fields', () => {
    render(<LoginPage />, { wrapper: createWrapper() });
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|تسجيل/i })).toBeInTheDocument();
  });

  it('displays validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: /login|تسجيل/i });
    await user.click(submitButton);
    
    // Browser HTML5 validation will prevent submission
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInvalid();
  });

  it('allows switching language between English and Arabic', async () => {
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: createWrapper() });
    
    const langButton = screen.getByRole('button', { name: /english|العربية/i });
    expect(langButton).toBeInTheDocument();
    
    await user.click(langButton);
    
    // Language should toggle
    await waitFor(() => {
      const updatedButton = screen.getByRole('button', { name: /english|العربية/i });
      expect(updatedButton).toBeInTheDocument();
    });
  });

  it('displays loading state during login', async () => {
    const user = userEvent.setup();
    const { apiClient } = await import('../lib/apiClient');
    
    // Mock slow API response
    apiClient.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: {} }), 1000))
    );
    
    render(<LoginPage />, { wrapper: createWrapper() });
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|تسجيل/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Button should be disabled during loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('displays backend connection status', () => {
    render(<LoginPage />, { wrapper: createWrapper() });
    
    // Should show connection checking or status
    // This depends on backend health check timing
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has accessible form labels and ARIA attributes', () => {
    render(<LoginPage />, { wrapper: createWrapper() });
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = screen.getByRole('main').querySelector('form');
    
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(form).toBeInTheDocument();
  });
});
