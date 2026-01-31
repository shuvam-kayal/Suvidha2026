"""
SUVIDHA 2026 - API Gateway
Centralized entry point for all microservices
Now with Socket.io for real-time notifications
"""

import asyncio
import time
import uuid
from datetime import datetime
from typing import Optional

import httpx
import socketio
from fastapi import FastAPI, HTTPException, Request, Response, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import get_settings
from .middleware.auth import verify_jwt, optional_jwt, JWTPayload


# =============================================================================
# SOCKET.IO SETUP
# =============================================================================

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
)

# Track connected clients
connected_clients = 0


@sio.event
async def connect(sid, environ):
    global connected_clients
    connected_clients += 1
    print(f"📱 Client connected: {sid} (Total: {connected_clients})")
    
    # Send welcome message
    await sio.emit('notification', {
        'id': str(int(time.time() * 1000)),
        'type': 'info',
        'message': 'Connected to SUVIDHA Notification Service',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    }, to=sid)


@sio.event
async def disconnect(sid):
    global connected_clients
    connected_clients -= 1
    print(f"📱 Client disconnected: {sid} (Total: {connected_clients})")


async def broadcast_notification(notification: dict):
    """Broadcast notification to all connected clients."""
    payload = {
        'id': str(int(time.time() * 1000)),
        **notification,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    }
    await sio.emit('notification', payload)
    print(f"📢 Broadcast sent: {notification.get('message', '')}")
    return payload


# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="SUVIDHA API Gateway",
    description="Centralized entry point for all microservices",
    version="1.0.0",
)

# Get settings
settings = get_settings()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "Accept-Language"],
)


# Rate limiting state (simple in-memory implementation)
rate_limit_store: dict = {}


# Request logging and rate limiting middleware
@app.middleware("http")
async def middleware_handler(request: Request, call_next):
    # Generate request ID
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Log request
    print(f"[{datetime.utcnow().isoformat()}] {request.method} {request.url.path}")
    
    # Simple rate limiting
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    window_start = current_time - (settings.rate_limit_window_ms / 1000)
    
    # Clean old entries
    rate_limit_store[client_ip] = [
        t for t in rate_limit_store.get(client_ip, [])
        if t > window_start
    ]
    
    # Check rate limit
    if len(rate_limit_store.get(client_ip, [])) >= settings.rate_limit_max_requests:
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests, please try again later."}
        )
    
    # Add current request
    rate_limit_store.setdefault(client_ip, []).append(current_time)
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# HTTP client for proxying
http_client = httpx.AsyncClient(timeout=30.0)


@app.on_event("startup")
async def startup():
    print(f"\n🚀 API Gateway running on port {settings.port}")
    print(f"🔌 WebSocket server enabled for real-time notifications")
    print(f"📡 Environment: {settings.environment}")
    print(f"🔗 Auth Service: {settings.auth_service_url}")
    print(f"🔗 Billing Service: {settings.billing_service_url}")
    print(f"🔗 Grievance Service: {settings.grievance_service_url}")


@app.on_event("shutdown")
async def shutdown():
    await http_client.aclose()


# =============================================================================
# HEALTH CHECKS
# =============================================================================

@app.get("/health")
async def health_check():
    """Gateway health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "api-gateway",
        "version": "1.0.0",
        "connectedClients": connected_clients,
    }


@app.get("/api/health")
async def api_health():
    """API health check with service info."""
    return {
        "status": "healthy",
        "services": {
            "auth": settings.auth_service_url,
            "billing": settings.billing_service_url,
            "grievance": settings.grievance_service_url,
        },
        "websocket": {
            "enabled": True,
            "connectedClients": connected_clients,
        },
    }


# =============================================================================
# ADMIN NOTIFICATION ENDPOINTS
# =============================================================================

class BroadcastRequest(BaseModel):
    message: str
    type: str = "info"
    priority: int = 1


@app.post("/admin/broadcast")
async def admin_broadcast(data: BroadcastRequest):
    """Broadcast notification to all connected clients."""
    if not data.message:
        raise HTTPException(status_code=400, detail={"error": "Message is required"})
    
    notification = await broadcast_notification({
        "type": data.type,
        "message": data.message,
        "priority": data.priority,
    })
    
    return {
        "success": True,
        "notification": notification,
        "recipients": connected_clients,
    }


@app.get("/admin/clients")
async def get_connected_clients():
    """Get connected clients count."""
    return {
        "connectedClients": connected_clients,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# =============================================================================
# PROXY HELPER
# =============================================================================

async def proxy_request(
    request: Request,
    target_url: str,
    user: Optional[JWTPayload] = None,
):
    """Proxy a request to a backend service."""
    # Build target URL
    path = request.url.path
    # Remove the /api/v1/{service} prefix
    path_parts = path.split("/")
    if len(path_parts) > 3:
        backend_path = "/" + "/".join(path_parts[4:])
    else:
        backend_path = "/"
    
    # Add query string
    if request.url.query:
        backend_path += f"?{request.url.query}"
    
    url = f"{target_url}{backend_path}"
    
    # Build headers
    headers = dict(request.headers)
    headers.pop("host", None)
    
    # Add user info if authenticated
    if user:
        headers["X-User-ID"] = user.id
        headers["X-User-Phone"] = user.phone or ""
    
    headers["X-Request-ID"] = headers.get("x-request-id", str(uuid.uuid4()))
    
    # Get request body
    body = await request.body()
    
    try:
        response = await http_client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers),
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=502,
            detail={"error": "Service temporarily unavailable"}
        )
    except Exception as e:
        print(f"Proxy error: {e}")
        raise HTTPException(
            status_code=502,
            detail={"error": "Service temporarily unavailable"}
        )


# =============================================================================
# PUBLIC ROUTES (No Auth Required)
# =============================================================================

@app.api_route("/api/v1/auth/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_auth(request: Request, path: str):
    """Proxy to auth service (no auth required)."""
    return await proxy_request(request, settings.auth_service_url)


# =============================================================================
# PROTECTED ROUTES (Auth Required)
# =============================================================================

@app.api_route("/api/v1/billing/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_billing(request: Request, path: str, user: JWTPayload = Depends(verify_jwt)):
    """Proxy to billing service (auth required)."""
    return await proxy_request(request, settings.billing_service_url, user)


@app.api_route("/api/v1/grievance/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_grievance(request: Request, path: str, user: JWTPayload = Depends(verify_jwt)):
    """Proxy to grievance service (auth required)."""
    return await proxy_request(request, settings.grievance_service_url, user)


@app.api_route("/api/v1/user/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_user(request: Request, path: str, user: JWTPayload = Depends(verify_jwt)):
    """Proxy user routes to auth service (auth required)."""
    return await proxy_request(request, settings.auth_service_url, user)


# =============================================================================
# 404 HANDLER
# =============================================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource does not exist",
        }
    )


# =============================================================================
# COMBINED ASGI APP (FastAPI + Socket.IO)
# =============================================================================

# Wrap FastAPI with Socket.IO
socket_app = socketio.ASGIApp(sio, app)


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=settings.port)
