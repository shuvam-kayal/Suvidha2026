"""
Auth Service - User Authentication & OTP Management
SUVIDHA 2026 - C-DAC Hackathon
"""

import re
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import get_settings
from .redis_client import (
    get_redis_client,
    close_redis_client,
    store_otp,
    verify_otp as redis_verify_otp,
    is_otp_locked,
    store_session,
    invalidate_session,
)
from .jwt_utils import generate_token_pair, verify_token, hash_token, generate_otp


# =============================================================================
# MODELS
# =============================================================================

class OtpRequest(BaseModel):
    phoneNumber: str


class OtpVerify(BaseModel):
    phoneNumber: str
    otp: str


class RefreshRequest(BaseModel):
    refreshToken: str


# =============================================================================
# LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    settings = get_settings()
    print(f"\n🔐 Auth Service starting on port {settings.port}")
    print(f"📡 Environment: {settings.environment}")
    print(f"⏱️  OTP expires in: {settings.otp_expires_in} seconds\n")
    
    # Test Redis connection
    try:
        client = await get_redis_client()
        await client.ping()
        print("✅ Connected to Redis")
    except Exception as e:
        print(f"❌ Redis connection error: {e}")
    
    yield
    
    # Shutdown
    await close_redis_client()
    print("Auth Service stopped")


# =============================================================================
# APP SETUP
# =============================================================================

app = FastAPI(
    title="SUVIDHA Auth Service",
    description="User Authentication & OTP Management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[{datetime.utcnow().isoformat()}] {request.method} {request.url.path}")
    response = await call_next(request)
    return response


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    redis_status = "disconnected"
    try:
        client = await get_redis_client()
        await client.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "error"
    
    return {
        "status": "healthy",
        "service": "auth-service",
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat(),
    }


# =============================================================================
# OTP REQUEST
# =============================================================================

@app.post("/otp/request")
async def request_otp(data: OtpRequest):
    """Request OTP for phone number."""
    settings = get_settings()
    phone_number = data.phoneNumber
    
    # Validation - Indian mobile number
    if not phone_number or not re.match(r'^[6-9]\d{9}$', phone_number):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid phone number",
                "message": "Please enter a valid 10-digit Indian mobile number",
            }
        )
    
    # Check if user is locked out
    if await is_otp_locked(phone_number):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Too many attempts",
                "message": "Please wait 15 minutes before requesting another OTP",
            }
        )
    
    # Generate and store OTP
    otp = generate_otp(settings.otp_length)
    await store_otp(phone_number, otp)
    
    # In development, log OTP to console
    if settings.environment == "development":
        print(f"\n📱 [DEV] OTP for {phone_number}: {otp}\n")
    
    response = {
        "success": True,
        "message": "OTP sent successfully",
        "expiresIn": settings.otp_expires_in,
    }
    
    # Only include OTP in development for testing
    if settings.environment == "development":
        response["_devOtp"] = otp
    
    return response


# =============================================================================
# OTP VERIFICATION & LOGIN
# =============================================================================

@app.post("/otp/verify")
async def verify_otp_endpoint(data: OtpVerify):
    """Verify OTP and login."""
    phone_number = data.phoneNumber
    otp = data.otp
    
    # Validation
    if not phone_number or not otp:
        raise HTTPException(
            status_code=400,
            detail={"error": "Phone number and OTP are required"}
        )
    
    if not re.match(r'^\d{6}$', otp):
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid OTP format"}
        )
    
    # Check lockout
    if await is_otp_locked(phone_number):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Account locked",
                "message": "Too many failed attempts. Please wait 15 minutes.",
            }
        )
    
    # Verify OTP
    is_valid = await redis_verify_otp(phone_number, otp)
    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Invalid or expired OTP",
                "message": "Please check the OTP or request a new one",
            }
        )
    
    # Generate user ID (in production, this would come from database)
    import time
    user_id = f"user_{phone_number[-4:]}_{hex(int(time.time()))[2:]}"
    
    # Generate JWT tokens
    tokens = generate_token_pair(user_id, phone_number)
    
    # Store session in Redis
    refresh_token_hash = hash_token(tokens["refresh_token"])
    refresh_expires_in = 7 * 24 * 60 * 60  # 7 days
    await store_session(user_id, refresh_token_hash, refresh_expires_in)
    
    return {
        "success": True,
        "accessToken": tokens["access_token"],
        "refreshToken": tokens["refresh_token"],
        "expiresIn": tokens["expires_in"],
        "user": {
            "id": user_id,
            "phoneNumber": phone_number,
            "name": None,
            "email": None,
            "isNewUser": True,
        },
    }


# =============================================================================
# GET CURRENT USER
# =============================================================================

@app.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user info."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "Authorization token required"}
        )
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid or expired token"}
        )
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid token type"}
        )
    
    return {
        "id": payload["id"],
        "phoneNumber": payload["phone"],
        "email": payload.get("email"),
        "name": None,
        "createdAt": datetime.utcnow().isoformat(),
    }


# =============================================================================
# REFRESH TOKEN
# =============================================================================

@app.post("/refresh")
async def refresh_token(data: RefreshRequest):
    """Refresh access token."""
    refresh_token = data.refreshToken
    
    if not refresh_token:
        raise HTTPException(
            status_code=400,
            detail={"error": "Refresh token required"}
        )
    
    payload = verify_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid refresh token"}
        )
    
    # Generate new token pair
    tokens = generate_token_pair(
        payload["id"],
        payload["phone"],
        payload.get("email")
    )
    
    # Update session
    new_refresh_token_hash = hash_token(tokens["refresh_token"])
    refresh_expires_in = 7 * 24 * 60 * 60
    await store_session(payload["id"], new_refresh_token_hash, refresh_expires_in)
    
    return {
        "accessToken": tokens["access_token"],
        "refreshToken": tokens["refresh_token"],
        "expiresIn": tokens["expires_in"],
    }


# =============================================================================
# LOGOUT
# =============================================================================

@app.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout user."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = verify_token(token)
        
        if payload:
            token_hash = hash_token(token)
            await invalidate_session(payload["id"], token_hash[:16])
    
    return {"success": True, "message": "Logged out successfully"}


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
