"""
Auth Service Configuration
SUVIDHA 2026 - C-DAC Hackathon
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server
    environment: str = "development"
    port: int = 3001
    
    # JWT
    jwt_secret: str = "development_secret_change_in_production"
    jwt_expires_in: str = "24h"
    refresh_token_expires_in: str = "7d"
    
    # Redis (default password matches docker-compose.yml)
    redis_url: str = "redis://:redis_secure_2026@localhost:6379"
    
    # OTP
    otp_length: int = 6
    otp_expires_in: int = 300  # 5 minutes
    otp_max_attempts: int = 5
    otp_lockout_duration: int = 900  # 15 minutes
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
