"""
Redis Client for OTP Storage and Session Management
SUVIDHA 2026 - C-DAC Hackathon
"""

import json
from datetime import datetime
from typing import Optional

import redis.asyncio as redis

from .config import get_settings

# Redis client singleton
_redis_client: Optional[redis.Redis] = None

# Key prefixes
OTP_PREFIX = "otp:"
OTP_ATTEMPTS_PREFIX = "otp_attempts:"
SESSION_PREFIX = "session:"


async def get_redis_client() -> redis.Redis:
    """Get or create Redis client."""
    global _redis_client
    
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    
    return _redis_client


async def close_redis_client():
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


# =============================================================================
# OTP OPERATIONS
# =============================================================================

async def store_otp(phone_number: str, otp: str) -> None:
    """Store OTP in Redis with expiration."""
    settings = get_settings()
    client = await get_redis_client()
    key = f"{OTP_PREFIX}{phone_number}"
    await client.set(key, otp, ex=settings.otp_expires_in)


async def verify_otp(phone_number: str, otp: str) -> bool:
    """Verify OTP and delete on success."""
    settings = get_settings()
    client = await get_redis_client()
    key = f"{OTP_PREFIX}{phone_number}"
    
    stored_otp = await client.get(key)
    
    if not stored_otp:
        return False  # OTP expired or doesn't exist
    
    if stored_otp == otp:
        # Delete OTP after successful verification
        await client.delete(key)
        # Reset attempt counter
        await client.delete(f"{OTP_ATTEMPTS_PREFIX}{phone_number}")
        return True
    
    # Increment failed attempts
    await increment_otp_attempts(phone_number)
    return False


async def increment_otp_attempts(phone_number: str) -> int:
    """Track failed OTP attempts for rate limiting."""
    settings = get_settings()
    client = await get_redis_client()
    key = f"{OTP_ATTEMPTS_PREFIX}{phone_number}"
    
    attempts = await client.incr(key)
    
    # Set expiry on first attempt
    if attempts == 1:
        await client.expire(key, settings.otp_lockout_duration)
    
    return attempts


async def is_otp_locked(phone_number: str) -> bool:
    """Check if user is locked out from OTP attempts."""
    settings = get_settings()
    client = await get_redis_client()
    key = f"{OTP_ATTEMPTS_PREFIX}{phone_number}"
    
    attempts = await client.get(key)
    return attempts is not None and int(attempts) >= settings.otp_max_attempts


# =============================================================================
# SESSION OPERATIONS
# =============================================================================

async def store_session(user_id: str, refresh_token_hash: str, expires_in_seconds: int) -> None:
    """Store refresh token hash in Redis."""
    client = await get_redis_client()
    key = f"{SESSION_PREFIX}{user_id}:{refresh_token_hash[:16]}"
    
    session_data = json.dumps({
        "refresh_token_hash": refresh_token_hash,
        "created_at": datetime.utcnow().isoformat(),
    })
    
    await client.set(key, session_data, ex=expires_in_seconds)


async def invalidate_session(user_id: str, token_prefix: str) -> None:
    """Invalidate a session (logout)."""
    client = await get_redis_client()
    key = f"{SESSION_PREFIX}{user_id}:{token_prefix}"
    await client.delete(key)


async def invalidate_all_sessions(user_id: str) -> None:
    """Invalidate all sessions for a user."""
    client = await get_redis_client()
    pattern = f"{SESSION_PREFIX}{user_id}:*"
    
    keys = []
    async for key in client.scan_iter(match=pattern):
        keys.append(key)
    
    if keys:
        await client.delete(*keys)
