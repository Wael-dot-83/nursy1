import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const translations = {
  ar: {
    // Login page
    'login.title': 'مرحباً بكم في نظام إدارة الحضانات',
    'login.subtitle': 'سجل الدخول للمتابعة باستخدام كلمة المرور أو رمز التحقق عبر البريد الإلكتروني',
    'login.password_tab': 'كلمة المرور',
    'login.otp_tab': 'رمز التحقق عبر البريد الإلكتروني',
    'login.email_label': 'البريد الإلكتروني',
    'login.email_placeholder': 'example@email.com',
    'login.email_hint': 'أدخل بريدك الإلكتروني المسجل في النظام',
    'login.password_label': 'كلمة المرور',
    'login.password_placeholder': '••••••••',
    'login.otp_label': 'رمز التحقق من البريد الإلكتروني',
    'login.otp_placeholder': '000000',
    'login.submit_login': 'تسجيل الدخول',
    'login.submit_continue': 'متابعة',
    'login.loading': 'جاري المعالجة...',
    'login.resend_otp': 'إعادة إرسال الرمز',
    'login.otp_sent': 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
    'login.checking_connection': 'جاري التحقق من الاتصال...',
    'login.retry': 'إعادة المحاولة',
    
    // Errors
    'error.unauthorized': 'اسم المستخدم أو كلمة المرور غير صحيحة. الرجاء المحاولة مرة أخرى.',
    'error.forbidden': 'ليس لديك صلاحية للوصول إلى هذا المورد.',
    'error.not_found': 'الصفحة أو المورد المطلوب غير موجود.',
    'error.rate_limit': 'تم تجاوز الحد الأقصى من المحاولات. الرجاء المحاولة لاحقاً.',
    'error.server': 'حدث خطأ في الخادم. الرجاء المحاولة لاحقاً.',
    'error.network': 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.',
    'error.network_detail': 'لا يمكن الوصول إلى الخادم. تأكد من أن الخادم يعمل على {url}',
    'error.unexpected': 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.',
    'error.validation': 'أخطاء في التحقق',
    'error.invalid_otp': 'رمز التحقق غير صحيح أو منتهي الصلاحية',
    'error.otp_expired': 'رمز التحقق منتهي الصلاحية. الرجاء طلب رمز جديد.',
    'error.too_many_attempts': 'عدد كبير جداً من المحاولات. الرجاء الانتظار {minutes} دقيقة.',
    
    // ARIA labels
    'aria.email_field': 'حقل البريد الإلكتروني',
    'aria.password_field': 'حقل كلمة المرور',
    'aria.otp_field': 'حقل رمز التحقق',
    'aria.login_form': 'نموذج تسجيل الدخول',
    'aria.auth_method_tabs': 'اختيار طريقة المصادقة',
    'aria.error_message': 'رسالة خطأ',
    'aria.success_message': 'رسالة نجاح',
    'aria.loading': 'جاري التحميل',
    'aria.submit_button': 'زر إرسال النموذج',
    'aria.retry_button': 'زر إعادة المحاولة',
    
    // Password change
    'password.first_login_title': 'تغيير كلمة المرور الافتراضية',
    'password.first_login_subtitle': 'يجب تغيير كلمة المرور قبل المتابعة',
    'password.first_login_notice': 'من أجل أمان حسابك، يرجى تغيير كلمة المرور الافتراضية',
    'password.change_title': 'تغيير كلمة المرور',
    'password.change_subtitle': 'تحديث بيانات الدخول الخاصة بك',
    'password.current_label': 'كلمة المرور الحالية',
    'password.current_placeholder': 'أدخل كلمة المرور الحالية',
    'password.new_label': 'كلمة المرور الجديدة',
    'password.new_placeholder': 'أدخل كلمة المرور الجديدة',
    'password.confirm_label': 'تأكيد كلمة المرور',
    'password.confirm_placeholder': 'أعد إدخال كلمة المرور الجديدة',
    'password.requirements': 'يجب أن تحتوي على 8 أحرف على الأقل',
    'password.submit_button': 'تغيير كلمة المرور',
    'password.submitting': 'جاري الحفظ...',
    'password.change_success': 'تم تغيير كلمة المرور بنجاح! جاري التحويل...',
    'password.min_length': 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل',
    'password.mismatch': 'كلمات المرور غير متطابقة',
    'password.same_as_current': 'كلمة المرور الجديدة يجب أن تختلف عن الحالية',
    'common.cancel': 'إلغاء',
    
    // Connection status
    'connection.checking': 'جاري التحقق من الاتصال بالخادم...',
    'connection.success': 'الخادم متصل',
    'connection.failed': 'فشل الاتصال بالخادم',
    'connection.backend_url': 'عنوان الخادم: {url}',
    'connection.retry_in': 'إعادة المحاولة خلال {seconds} ثانية...',
  },
  en: {
    // Login page
    'login.title': 'Welcome to Nursery Management System',
    'login.subtitle': 'Login to continue using password or email verification code',
    'login.password_tab': 'Password',
    'login.otp_tab': 'Email Verification Code',
    'login.email_label': 'Email Address',
    'login.email_placeholder': 'example@email.com',
    'login.email_hint': 'Enter your registered email address',
    'login.password_label': 'Password',
    'login.password_placeholder': '••••••••',
    'login.otp_label': 'Email Verification Code',
    'login.otp_placeholder': '000000',
    'login.submit_login': 'Login',
    'login.submit_continue': 'Continue',
    'login.loading': 'Processing...',
    'login.resend_otp': 'Resend Code',
    'login.otp_sent': 'Verification code sent to your email',
    'login.checking_connection': 'Checking connection...',
    'login.retry': 'Retry',
    
    // Errors
    'error.unauthorized': 'Invalid email or password. Please try again.',
    'error.forbidden': 'You do not have permission to access this resource.',
    'error.not_found': 'The requested page or resource was not found.',
    'error.rate_limit': 'Too many attempts. Please try again later.',
    'error.server': 'Server error occurred. Please try again later.',
    'error.network': 'Failed to connect to server. Check your internet connection.',
    'error.network_detail': 'Cannot reach server. Make sure the server is running at {url}',
    'error.unexpected': 'An unexpected error occurred. Please try again.',
    'error.validation': 'Validation errors',
    'error.invalid_otp': 'Invalid or expired verification code',
    'error.otp_expired': 'Verification code expired. Please request a new code.',
    'error.too_many_attempts': 'Too many attempts. Please wait {minutes} minutes.',
    
    // ARIA labels
    'aria.email_field': 'Email address field',
    'aria.password_field': 'Password field',
    'aria.otp_field': 'Verification code field',
    'aria.login_form': 'Login form',
    'aria.auth_method_tabs': 'Authentication method selector',
    'aria.error_message': 'Error message',
    'aria.success_message': 'Success message',
    'aria.loading': 'Loading',
    'aria.submit_button': 'Submit form button',
    'aria.retry_button': 'Retry button',
    
    // Password change
    'password.first_login_title': 'Change Default Password',
    'password.first_login_subtitle': 'You must change your password before continuing',
    'password.first_login_notice': 'For your account security, please change the default password',
    'password.change_title': 'Change Password',
    'password.change_subtitle': 'Update your login credentials',
    'password.current_label': 'Current Password',
    'password.current_placeholder': 'Enter your current password',
    'password.new_label': 'New Password',
    'password.new_placeholder': 'Enter your new password',
    'password.confirm_label': 'Confirm Password',
    'password.confirm_placeholder': 'Re-enter your new password',
    'password.requirements': 'Must be at least 8 characters long',
    'password.submit_button': 'Change Password',
    'password.submitting': 'Saving...',
    'password.change_success': 'Password changed successfully! Redirecting...',
    'password.min_length': 'Password must be at least 8 characters long',
    'password.mismatch': 'Passwords do not match',
    'password.same_as_current': 'New password must be different from current password',
    'common.cancel': 'Cancel',
    
    // Connection status
    'connection.checking': 'Checking server connection...',
    'connection.success': 'Server connected',
    'connection.failed': 'Failed to connect to server',
    'connection.backend_url': 'Server URL: {url}',
    'connection.retry_in': 'Retrying in {seconds} seconds...',
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  // Default to Arabic
  const [locale, setLocale] = useState('ar');
  
  const t = useCallback((key, params = {}) => {
    let text = translations[locale]?.[key] || translations['en']?.[key] || key;
    
    // Replace parameters in text like {url}, {minutes}, etc.
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
    
    return text;
  }, [locale]);
  
  const switchLocale = useCallback((newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      // Update document direction
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    }
  }, []);
  
  const value = useMemo(() => ({
    locale,
    t,
    switchLocale,
    isRTL: locale === 'ar',
  }), [locale, t, switchLocale]);
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
