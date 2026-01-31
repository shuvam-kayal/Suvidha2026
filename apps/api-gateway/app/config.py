"""
API Gateway Configuration
SUVIDHA 2026 - C-DAC Hackathon
"""

import os
from typing import List

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server
    environment: str = "development"
    port: int = 3000
    
    # Service URLs
    auth_service_url: str = "http://localhost:3001"
    billing_service_url: str = "http://localhost:3002"
    grievance_service_url: str = "http://localhost:3003"
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:8080,http://localhost:8081"
    
    # Rate Limiting
    rate_limit_window_ms: int = 60000  # 1 minute
    rate_limit_max_requests: int = 100
    
    # JWT
    jwt_secret: str = "development_secret_change_in_production"
    
    # Redis (default password matches docker-compose.yml)
    redis_url: str = "redis://:redis_secure_2026@localhost:6379"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
