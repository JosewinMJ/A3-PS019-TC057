import re
import datetime
from typing import Tuple, Optional, Any

# --- Masking / Redaction Helpers ---

def mask_person_name(val: str) -> str:
    parts = str(val).strip().split()
    if not parts:
        return "[MASKED]"
    masked_parts = []
    for p in parts:
        if len(p) <= 2:
            masked_parts.append(p[0] + "*")
        else:
            masked_parts.append(p[0] + "*" * (len(p) - 2) + p[-1])
    return " ".join(masked_parts)

def mask_email(val: str) -> str:
    s = str(val).strip()
    if "@" not in s:
        return "[MASKED_EMAIL]"
    local, domain = s.split("@", 1)
    masked_local = local[0] + "***" + (local[-1] if len(local) > 1 else "")
    return f"{masked_local}@{domain}"

def mask_phone(val: str) -> str:
    s = str(val).strip()
    digits = re.sub(r"\D", "", s)
    if len(digits) >= 10:
        return f"+XX-XXXXX-{digits[-4:]}"
    return "[MASKED_PHONE]"

def mask_government_id(val: str) -> str:
    s = str(val).strip()
    clean = re.sub(r"[\s\-]", "", s)
    if len(clean) == 12 and clean.isdigit():
        # Aadhaar style: XXXX-XXXX-1234
        return f"XXXX-XXXX-{clean[-4:]}"
    elif len(clean) == 10 and clean[:5].isalpha() and clean[5:9].isdigit():
        # PAN style: AB*****4F
        return f"{clean[:2]}*****{clean[-2:]}"
    elif len(clean) == 9 and clean.isdigit():
        # SSN style: XXX-XX-1234
        return f"XXX-XX-{clean[-4:]}"
    return f"ID-***{s[-3:]}" if len(s) >= 4 else "[MASKED_ID]"

def mask_dob(val: str) -> str:
    s = str(val).strip()
    # Mask year or day: YYYY-**-**
    if len(s) >= 8:
        return f"****-**-{s[-2:]}"
    return "[MASKED_DOB]"

def mask_sample_value(data_class: str, value: Any) -> str:
    if value is None or str(value).lower() in ("nan", "none", "null", ""):
        return "[NULL]"
    s = str(value).strip()
    if data_class == "person_name":
        return mask_person_name(s)
    elif data_class == "email_address":
        return mask_email(s)
    elif data_class == "phone_number":
        return mask_phone(s)
    elif data_class == "government_id":
        return mask_government_id(s)
    elif data_class == "date_of_birth":
        return mask_dob(s)
    # Default fallback
    if len(s) > 4:
        return s[:2] + "***" + s[-2:]
    return "***"


# --- Validators ---

def person_name_validator(value: str) -> Tuple[bool, str]:
    """Validates if value is structurally consistent with human person names."""
    if not isinstance(value, str):
        return False, "Not a string"
    s = value.strip()
    if len(s) < 2 or len(s) > 60:
        return False, "Length outside plausible name range (2-60)"

    # Must not contain numbers or suspicious symbols
    if any(char.isdigit() for char in s):
        return False, "Contains digits"
    if any(char in "!@#$%^&*()_+=[]{}|;:\",<>?/" for char in s):
        return False, "Contains invalid punctuation"

    # Count alphabetic proportion
    alpha_chars = sum(1 for c in s if c.isalpha())
    if alpha_chars / len(s) < 0.75:
        return False, "Insufficient alphabetic character density"

    return True, "Plausible name structure"

def email_address_validator(value: str) -> Tuple[bool, str]:
    """Validates standard email syntax and domain format."""
    s = str(value).strip()
    if "@" not in s or s.count("@") != 1:
        return False, "Must contain exactly one @"
    local_part, domain_part = s.split("@", 1)
    if not local_part or not domain_part:
        return False, "Missing local or domain component"
    if "." not in domain_part or domain_part.startswith(".") or domain_part.endswith("."):
        return False, "Invalid domain dot placement"
    tld = domain_part.split(".")[-1]
    if len(tld) < 2 or not tld.isalpha():
        return False, "Invalid top-level domain"
    if len(s) > 254:
        return False, "Exceeds RFC maximum email length"
    return True, "Valid email format"

def phone_number_validator(value: str) -> Tuple[bool, str]:
    """Validates phone number plausibility and digit count."""
    s = str(value).strip()
    digits = re.sub(r"\D", "", s)
    if len(digits) < 10 or len(digits) > 13:
        return False, f"Digit count {len(digits)} outside standard range (10-13)"

    # Reject sequential or repetitive dummy numbers
    if len(set(digits)) <= 2:
        return False, "Repetitive dummy digits detected"
    if digits in ("1234567890", "0123456789", "9876543210"):
        return False, "Obvious sequence dummy number"

    # Indian mobile: 10 digits starting with 6, 7, 8, or 9
    if len(digits) == 10 and digits[0] in "6789":
        return True, "Plausible Indian 10-digit mobile number"
    elif len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        return True, "Plausible Indian mobile with 91 country code"
    elif 10 <= len(digits) <= 13:
        return True, "Plausible standard telephone format"
    return False, "Non-standard phone format"

def government_id_validator(value: str) -> Tuple[bool, str]:
    """
    Validates Indian Aadhaar / PAN or standard government identity formats.
    NOTE: Limitations documented - candidate pattern verification, not official UIDAI checksum.
    """
    s = str(value).strip().upper()
    clean = re.sub(r"[\s\-]", "", s)

    # 1. Indian PAN: exactly 5 letters, 4 digits, 1 letter
    if len(clean) == 10 and clean[:5].isalpha() and clean[5:9].isdigit() and clean[9].isalpha():
        return True, "Matches Indian PAN format structure (5 letters, 4 digits, 1 letter)"

    # 2. Indian Aadhaar style: exactly 12 digits, cannot start with 0 or 1 per UIDAI spec
    if len(clean) == 12 and clean.isdigit():
        if clean[0] in ("0", "1"):
            return False, "Aadhaar format specification cannot begin with 0 or 1"
        return True, "Matches 12-digit Aadhaar candidate format (format verified, no official UIDAI validation claimed)"

    # 3. US SSN style: 9 digits, 3-2-4
    if len(clean) == 9 and clean.isdigit():
        if clean.startswith("000") or clean[3:5] == "00" or clean[5:] == "0000":
            return False, "Invalid SSN group zeroes"
        return True, "Matches 9-digit national identity format"

    return False, "Does not conform to recognized government ID format"

def dob_validator(value: str) -> Tuple[bool, str]:
    """
    Validates calendar date plausibility for birth date.
    Rejects future dates and non-human age ranges (0-120 years).
    """
    s = str(value).strip()
    if not s or len(s) < 6:
        return False, "Value too short to be a date"

    # Only inspect date tokens if string contains numbers and separators
    if not any(char.isdigit() for char in s) or not any(sep in s for sep in "-/."):
        return False, "Not a recognized calendar date format"

    date_str = s.split()[0].split("T")[0]
    if not date_str:
        return False, "Empty date portion"

    date_obj = None
    formats = [
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y",
        "%Y/%m/%d", "%d.%m.%Y", "%Y.%m.%d"
    ]
    for fmt in formats:
        try:
            date_obj = datetime.datetime.strptime(date_str, fmt)
            break
        except ValueError:
            continue

    if not date_obj:
        return False, "Unrecognized date format"

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    year = date_obj.year

    if date_obj > now:
        return False, "Date is in the future; cannot be Date of Birth"

    age_years = (now - date_obj).days / 365.25
    if age_years < 0 or age_years > 125:
        return False, f"Implausible human age ({age_years:.1f} years)"

    if year < 1900:
        return False, "Birth year precedes 1900"

    return True, f"Plausible Date of Birth ({year}, approx {int(age_years)} years old)"

VALIDATOR_MAP = {
    "person_name_validator": person_name_validator,
    "email_address_validator": email_address_validator,
    "phone_number_validator": phone_number_validator,
    "government_id_validator": government_id_validator,
    "dob_validator": dob_validator,
}
