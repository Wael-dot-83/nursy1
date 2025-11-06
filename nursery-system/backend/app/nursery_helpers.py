"""Helper utilities for nursery management"""
import re
from typing import Optional
from unidecode import unidecode
from slugify import slugify as _slugify

_ARABIC_LETTERS = {
    "ا": "a",
    "أ": "a",
    "إ": "i",
    "آ": "aa",
    "ب": "b",
    "ت": "t",
    "ث": "th",
    "ج": "j",
    "ح": "h",
    "خ": "kh",
    "د": "d",
    "ذ": "dh",
    "ر": "r",
    "ز": "z",
    "س": "s",
    "ش": "sh",
    "ص": "s",
    "ض": "d",
    "ط": "t",
    "ظ": "z",
    "ع": "a",
    "غ": "gh",
    "ف": "f",
    "ق": "q",
    "ك": "k",
    "ل": "l",
    "م": "m",
    "ن": "n",
    "ه": "h",
    "و": "oo",
    "ؤ": "o",
    "ي": "y",
    "ى": "a",
    "ئ": "y",
    "ء": "",
    "ة": "ah",
    "لا": "la",
}


def _transliterate_arabic(text: str) -> str:
    """Rudimentary Arabic transliteration for slug stability."""
    result = []
    i = 0
    while i < len(text):
        if text[i:i + 2] == "ال":
            result.append("al")
            i += 2
            continue
        if text[i:i + 2] in _ARABIC_LETTERS:
            result.append(_ARABIC_LETTERS[text[i:i + 2]])
            i += 2
            continue
        char = text[i]
        mapped = _ARABIC_LETTERS.get(char)
        if mapped is not None:
            result.append(mapped)
        else:
            result.append(unidecode(char))
        i += 1
    return "".join(result)


def _prepare_for_slug(source: str) -> str:
    if re.search(r"[\u0600-\u06FF]", source):
        return _transliterate_arabic(source)
    return unidecode(source)


def normalize_text(text: Optional[str]) -> str:
    """Normalize text: lowercase, trim, collapse spaces"""
    if not text:
        return ""
    normalized = re.sub(r'\s+', ' ', text.strip())
    return normalized.lower()


def to_e164_jordan(raw: Optional[str]) -> str:
    """Convert Jordan phone to E.164 format (+9627XXXXXXXX)"""
    if not raw:
        return ""

    digits = re.sub(r'\D', '', raw)

    # 07XXXXXXXX -> +9627XXXXXXXX
    if re.fullmatch(r'07\d{8}', digits):
        return '+962' + digits[1:]

    # 9627XXXXXXXX -> +9627XXXXXXXX
    if re.fullmatch(r'9627\d{8}', digits):
        return '+' + digits

    # 962XXXXXXXX -> +962XXXXXXXX
    if digits.startswith('962'):
        return '+' + digits

    # Default: add + if not present
    return '+' + digits if not raw.startswith('+') else raw


def slug_domain(nursery_name: str, branch_name: Optional[str] = None) -> str:
    """Generate domain slug from nursery and optional branch name"""
    prepared = _prepare_for_slug(nursery_name or '')
    n = _slugify(prepared, lowercase=True)
    if not n:
        n = 'nursery'

    # Collapse repeated dashes
    n = re.sub(r'-+', '-', n).strip('-')

    if branch_name:
        prepared_branch = _prepare_for_slug(branch_name)
        b = _slugify(prepared_branch, lowercase=True) or 'branch'
        b = re.sub(r'-+', '-', b).strip('-')
        return f'{n}-{b}'

    return n


def generate_manager_email(
    nursery_name: str,
    branch_name: Optional[str] = None,
    exists_fn=None
) -> str:
    """Generate unique manager email with collision handling"""
    base = slug_domain(nursery_name, branch_name)
    candidate = f'manager_4@{base}.com'
    
    if not exists_fn:
        return candidate
    
    i = 2
    while exists_fn(candidate):
        candidate = f'manager_4@{base}-{i}.com'
        i += 1
    
    return candidate


def validate_jordan_phone(phone: str) -> bool:
    """Validate Jordan mobile phone format"""
    if not phone:
        return False
    
    digits = re.sub(r'\D', '', phone)
    
    if re.fullmatch(r'0?7\d{8}', digits):
        return True
    
    if re.fullmatch(r'9627\d{8}', digits):
        return True
    
    return False
