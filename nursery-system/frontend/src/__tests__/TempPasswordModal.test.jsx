import { render, screen, fireEvent } from '@testing-library/react';
import TempPasswordModal from '../components/TempPasswordModal';

describe('TempPasswordModal', () => {
  it('shows temp password and allows reveal/copy', () => {
    render(
      <TempPasswordModal
        open={true}
        onClose={() => {}}
        user={{ email: 'manager@example.com' }}
        tempPassword="Abc123XyZ9"
      />
    );
    expect(screen.getByText('تم إنشاء المدير')).toBeInTheDocument();
    expect(screen.getByDisplayValue('manager@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Abc123XyZ9')).toBeInTheDocument();
    // Password is masked by default
    expect(screen.getByLabelText('كلمة المرور المؤقتة:')).toBeTruthy();
    // Reveal button toggles password
    fireEvent.click(screen.getByText('إظهار'));
    expect(screen.getByDisplayValue('Abc123XyZ9')).toHaveAttribute('type', 'text');
    // Copy button copies password
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() }
    });
    fireEvent.click(screen.getByText('نسخ كلمة المرور'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Abc123XyZ9');
  });
});
