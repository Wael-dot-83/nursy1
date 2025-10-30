import { describe, expect, vi, beforeEach, afterEach, test } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManagement from '../pages/admin/UserManagement.jsx';

const usersFixture = [
  {
    id: 1,
    fullName: 'عبدالله مدير',
    email: 'abdullah.manager@example.com',
    role: 'manager',
    phone: '0790000001',
    isActive: true,
    nurseryId: 10,
    lastLogin: '2024-12-18T10:00:00Z',
    createdAt: '2024-06-01T08:00:00Z',
  },
  {
    id: 2,
    fullName: 'ليان مشرفة',
    email: 'lian.supervisor@example.com',
    role: 'supervisor',
    phone: '0790000002',
    isActive: false,
    nurseryId: 10,
    lastLogin: null,
    createdAt: '2024-07-12T09:30:00Z',
  },
];

const nurseriesFixture = [
  {
    id: 10,
    name: 'حضانة نور الهدى',
    branches: [
      {
        id: 101,
        name: 'حضانة نور الهدى',
        nurseryId: 10,
      },
    ],
  },
];

const mockGet = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: (...args) => mockGet(...args),
    patch: (...args) => mockPatch(...args),
    delete: (...args) => mockDelete(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
  },
  default: {
    get: (...args) => mockGet(...args),
    patch: (...args) => mockPatch(...args),
    delete: (...args) => mockDelete(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
  },
  handleApiError: (error) => error?.message || 'حدث خطأ غير متوقع',
  extractErrorMessage: () => '',
  extractFieldErrors: () => ({}),
}));

vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: {
      id: 999,
      role: 'admin',
    },
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserManagement />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGet.mockImplementation((url) => {
    if (url === '/admin/users') {
      return Promise.resolve({
        data: {
          items: usersFixture,
          total: usersFixture.length,
          page: 1,
          pageSize: 25,
        },
      });
    }
    if (url === '/admin/nurseries') {
      return Promise.resolve({
        data: nurseriesFixture,
      });
    }
    return Promise.reject(new Error(`Unexpected GET request: ${url}`));
  });
  mockPatch.mockResolvedValue({
    data: {
      isActive: false,
    },
  });
  mockDelete.mockResolvedValue({
    data: {},
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('UserManagement admin page', () => {
  test('opens row actions menu and confirms disabling a user', async () => {
    renderWithProviders();
    const user = userEvent.setup();

    await screen.findByText('عبدالله مدير');

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows.find((row) => within(row).queryByText('عبدالله مدير'));
    expect(firstDataRow).toBeTruthy();

    const actionsButton = within(firstDataRow).getByRole('button', { name: 'إجراءات المستخدم' });
    await user.click(actionsButton);

    const disableButton = await screen.findByText('تعطيل');
    await user.click(disableButton);

    await screen.findByText('تعطيل الحساب');

    const confirmButton = screen.getByRole('button', { name: 'تعطيل' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/admin/users/1/activation', { active: false });
    });
  });

  test('shows bulk toolbar when multiple users are selected', async () => {
    renderWithProviders();
    const user = userEvent.setup();

    await screen.findByText('عبدالله مدير');

    const rowCheckboxes = screen
      .getAllByRole('checkbox')
      .slice(1); // skip the select-all checkbox

    await user.click(rowCheckboxes[0]);
    await user.click(rowCheckboxes[1]);

    await screen.findByText('تم تحديد 2 مستخدم');
  });
});
