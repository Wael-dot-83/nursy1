// Password validation rules and constants
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

export const PASSWORD_STRENGTH_LEVELS = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
};

export const getPasswordStrength = (password) => {
  if (!password) return PASSWORD_STRENGTH_LEVELS.WEAK;

  let score = 0;

  if (password.length >= PASSWORD_RULES.minLength) score++;
  if (PASSWORD_RULES.requireUppercase && /[A-Z]/.test(password)) score++;
  if (PASSWORD_RULES.requireLowercase && /[a-z]/.test(password)) score++;
  if (PASSWORD_RULES.requireNumbers && /\d/.test(password)) score++;
  if (PASSWORD_RULES.requireSpecialChars && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score <= 2) return PASSWORD_STRENGTH_LEVELS.WEAK;
  if (score <= 4) return PASSWORD_STRENGTH_LEVELS.MEDIUM;
  return PASSWORD_STRENGTH_LEVELS.STRONG;
};

export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters long`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_RULES.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};