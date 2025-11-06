"""
Input sanitization utilities for user-provided content.
Prevents XSS and injection attacks by cleaning HTML and text inputs.
"""
import bleach
from typing import Optional, List


# Allowed HTML tags for rich text content (if needed)
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title'],
}

ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(html_content: Optional[str], allow_tags: bool = False) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.
    
    Args:
        html_content: Raw HTML string to sanitize
        allow_tags: If True, allow safe HTML tags. If False, strip all HTML.
    
    Returns:
        Sanitized string safe for rendering
    """
    if not html_content:
        return ""
    
    if allow_tags:
        # Allow specific tags for rich text content
        return bleach.clean(
            html_content,
            tags=ALLOWED_TAGS,
            attributes=ALLOWED_ATTRIBUTES,
            protocols=ALLOWED_PROTOCOLS,
            strip=True,
        )
    else:
        # Strip all HTML tags, return plain text
        return bleach.clean(html_content, tags=[], attributes={}, strip=True)


def sanitize_text(text: Optional[str]) -> str:
    """
    Sanitize plain text input by removing any HTML tags.
    
    Args:
        text: Input text string
    
    Returns:
        Cleaned plain text without HTML
    """
    if not text:
        return ""
    
    return bleach.clean(text, tags=[], attributes={}, strip=True)


def sanitize_filename(filename: Optional[str]) -> str:
    """
    Sanitize filename to prevent directory traversal and injection.
    
    Args:
        filename: Original filename
    
    Returns:
        Safe filename without path separators
    """
    if not filename:
        return "file"
    
    # Remove path separators and dangerous characters
    safe_name = filename.replace('/', '').replace('\\', '').replace('..', '')
    
    # Remove any remaining HTML/script tags
    safe_name = bleach.clean(safe_name, tags=[], attributes={}, strip=True)
    
    # Ensure filename is not empty after sanitization
    if not safe_name or safe_name.isspace():
        return "file"
    
    return safe_name


def sanitize_list(items: Optional[List[str]], max_length: int = 100) -> List[str]:
    """
    Sanitize a list of text items.
    
    Args:
        items: List of strings to sanitize
        max_length: Maximum allowed length per item
    
    Returns:
        List of sanitized strings
    """
    if not items:
        return []
    
    sanitized = []
    for item in items:
        if isinstance(item, str):
            clean_item = sanitize_text(item)
            # Truncate if too long
            if len(clean_item) > max_length:
                clean_item = clean_item[:max_length]
            if clean_item:  # Only add non-empty items
                sanitized.append(clean_item)
    
    return sanitized


def validate_and_sanitize_email(email: Optional[str]) -> str:
    """
    Basic email sanitization (additional validation done by Pydantic).
    
    Args:
        email: Email address to sanitize
    
    Returns:
        Sanitized email in lowercase
    """
    if not email:
        return ""
    
    # Remove HTML tags
    clean_email = sanitize_text(email)
    
    # Convert to lowercase and strip whitespace
    clean_email = clean_email.lower().strip()
    
    return clean_email


def sanitize_phone(phone: Optional[str]) -> str:
    """
    Sanitize phone number, keeping only digits and + sign.
    
    Args:
        phone: Phone number to sanitize
    
    Returns:
        Sanitized phone number
    """
    if not phone:
        return ""
    
    # Remove HTML tags first
    clean_phone = sanitize_text(phone)
    
    # Keep only digits, +, -, (, ), and spaces
    allowed_chars = set('0123456789+-()')
    clean_phone = ''.join(c for c in clean_phone if c in allowed_chars or c.isspace())
    
    return clean_phone.strip()
