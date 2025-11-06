"""
Centralized configuration management using Pydantic Settings.
All sensitive data loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from pydantic import validator
from functools import lru_cache
from typing import List
import secrets


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_pool_timeout: int = 30
    database_pool_recycle: int = 3600
    
    # JWT & Authentication
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    
    # Security
    bcrypt_rounds: int = 12
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    cors_origins: str = "http://localhost:5173"
    
    # File Upload
    max_file_size_mb: int = 10
    allowed_file_types: str = "pdf,jpg,jpeg,png,doc,docx"
    upload_dir: str = "./uploads"
    temp_dir: str = "./temp"
    
    # Email (Optional)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Nursery Management"
    
    # Monitoring
    sentry_dsn: str = ""
    log_level: str = "INFO"
    log_file: str = "logs/app.log"
    log_max_bytes: int = 10485760
    log_backup_count: int = 5
    
    # Redis (Optional)
    redis_url: str = ""
    redis_password: str = ""
    
    # Backup
    backup_dir: str = "./backups"
    backup_retention_days: int = 30
    auto_backup_enabled: bool = True
    auto_backup_hour: int = 2
    
    # Feature Flags
    enable_registration: bool = False
    enable_email_verification: bool = True
    enable_two_factor_auth: bool = False
    enable_api_docs: bool = True
    
    # Environment
    environment: str = "development"
    debug: bool = False
    reload: bool = False
    workers: int = 4
    
    # SSL/TLS
    ssl_cert_file: str = ""
    ssl_key_file: str = ""
    
    # Domain
    domain: str = "localhost"
    protocol: str = "http"
    
    @validator('jwt_secret_key')
    def validate_jwt_secret(cls, v):
        if len(v) < 32:
            raise ValueError('JWT secret must be at least 32 characters')
        return v
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return v
        return ','.join(v)
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into list"""
        return [origin.strip() for origin in self.cors_origins.split(',')]
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        """Parse allowed file types into list"""
        return [ft.strip() for ft in self.allowed_file_types.split(',')]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"
    
    @property
    def base_url(self) -> str:
        """Get base URL"""
        return f"{self.protocol}://{self.domain}"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        env_file_encoding = 'utf-8'


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to avoid reading .env file multiple times.
    """
    return Settings()


def generate_secret_key() -> str:
    """Generate a secure random secret key"""
    return secrets.token_urlsafe(32)


# Export settings instance
settings = get_settings()
