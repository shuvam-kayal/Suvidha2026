"""
JWT Token Utilities
SUVIDHA 2026 - C-DAC Hackathon
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

from .config import get_settings


def parse_time_string(time_str: str) -> timedelta:
    """Parse time string like '24h', '7d' into timedelta."""
    unit = time_str[-1]
    value = int(time_str[:-1])
    
    if unit == 'h':
        return timedelta(hours=value)
    elif unit == 'd':
        return timedelta(days=value)
    elif unit == 'm':
        return timedelta(minutes=value)
    elif unit == 's':
        return timedelta(seconds=value)
    else:
        return timedelta(hours=24)  # Default


def generate_token_pair(user_id: str, phone: str, email: Optional[str] = None) -> dict:
    """Generate access and refresh token pair."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    
    # Access token
    access_expires = now + parse_time_string(settings.jwt_expires_in)
    access_payload = {
        "id": user_id,
        "phone": phone,
        "email": email,
        "type": "access",
        "iat": now.timestamp(),
        "exp": access_expires.timestamp(),
    }
    access_token = jwt.encode(access_payload, settings.jwt_secret, algorithm="HS256")
    
    # Refresh token
    refresh_expires = now + parse_time_string(settings.refresh_token_expires_in)
    refresh_payload = {
        "id": user_id,
        "phone": phone,
        "email": email,
        "type": "refresh",
        "iat": now.timestamp(),
        "exp": refresh_expires.timestamp(),
    }
    refresh_token = jwt.encode(refresh_payload, settings.jwt_secret, algorithm="HS256")
    
    expires_in = int((access_expires - now).total_seconds())
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in,
    }


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure OTP."""
    return ''.join(str(secrets.randbelow(10)) for _ in range(length))
