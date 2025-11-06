/**
 * Input sanitization utilities for frontend
 * Prevents XSS attacks by cleaning user input
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} dirty - Unsafe HTML string
 * @param {boolean} allowTags - Whether to allow safe HTML tags
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHTML(dirty, allowTags = false) {
  if (!dirty) return '';

  const config = allowTags
    ? {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'title'],
      }
    : {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text by removing all HTML
 * @param {string} text - Input text
 * @returns {string} - Plain text without HTML
 */
export function sanitizeText(text) {
  if (!text) return '';
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Original filename
 * @returns {string} - Safe filename
 */
export function sanitizeFilename(filename) {
  if (!filename) return 'file';

  // Remove path separators and dangerous characters
  let safe = filename.replace(/[\/\\]/g, '').replace(/\.\./g, '');

  // Remove HTML tags
  safe = sanitizeText(safe);

  // Ensure not empty
  if (!safe || !safe.trim()) return 'file';

  return safe;
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Cleaned email
 */
export function sanitizeEmail(email) {
  if (!email) return '';

  // Remove HTML tags
  let clean = sanitizeText(email);

  // Lowercase and trim
  clean = clean.toLowerCase().trim();

  return clean;
}

/**
 * Sanitize phone number
 * @param {string} phone - Phone number
 * @returns {string} - Cleaned phone number
 */
export function sanitizePhone(phone) {
  if (!phone) return '';

  // Remove HTML tags
  let clean = sanitizeText(phone);

  // Keep only digits, +, -, (, ), and spaces
  clean = clean.replace(/[^0-9+\-() ]/g, '');

  return clean.trim();
}

/**
 * Sanitize array of strings
 * @param {string[]} items - Array of strings
 * @param {number} maxLength - Max length per item
 * @returns {string[]} - Sanitized array
 */
export function sanitizeArray(items, maxLength = 100) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => typeof item === 'string')
    .map((item) => {
      let clean = sanitizeText(item);
      if (clean.length > maxLength) {
        clean = clean.substring(0, maxLength);
      }
      return clean;
    })
    .filter((item) => item.trim().length > 0);
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 * @param {string} url - URL to sanitize
 * @returns {string} - Safe URL or empty string
 */
export function sanitizeURL(url) {
  if (!url) return '';

  const clean = sanitizeText(url).trim();

  // Only allow http, https, mailto protocols
  if (!/^(https?:\/\/|mailto:)/i.test(clean)) {
    return '';
  }

  return clean;
}

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeFilename,
  sanitizeEmail,
  sanitizePhone,
  sanitizeArray,
  sanitizeURL,
};
