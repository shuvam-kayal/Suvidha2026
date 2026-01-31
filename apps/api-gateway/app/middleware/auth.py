"""
JWT Authentication Middleware
SUVIDHA 2026 - C-DAC Hackathon
"""

from typing import Optional
from fastapi import HTTPException, Header, Request
import jwt

from ..config import get_settings


class JWTPayload:
    """JWT payload container."""
    def __init__(self, id: str, phone: str, email: Optional[str] = None):
        self.id = id
        self.phone = phone
        self.email = email


async def verify_jwt(authorization: Optional[str] = Header(None)) -> JWTPayload:
    """
    Dependency to verify JWT token.
    Use this in protected routes.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Unauthorized",
                "message": "No authentication token provided",
            }
        )
    
    token = authorization.split(" ")[1]
    settings = get_settings()
    
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return JWTPayload(
            id=payload.get("id"),
            phone=payload.get("phone"),
            email=payload.get("email"),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Token Expired",
                "message": "Your session has expired. Please login again.",
            }
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Invalid Token",
                "message": "The provided token is invalid.",
            }
        )


async def optional_jwt(authorization: Optional[str] = Header(None)) -> Optional[JWTPayload]:
    """
    Optional JWT verification - returns None if no token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        return await verify_jwt(authorization)
    except HTTPException:
        return None
