from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional, List
import os

class Settings(BaseSettings):
    # App settings
    app_name: str = Field(default="Nursery Management System")
    version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)

    # Security - NO DEFAULTS for production secrets
    secret_key: str = Field(...)
    jwt_access_secret: str = Field(...)
    jwt_refresh_secret: str = Field(...)
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=7)
    otp_expire_minutes: int = Field(default=10)

    # Database - NO DEFAULT for production
    database_url: str = Field(...)

    # SMS (Twilio) - Optional
    sms_twilio_sid: Optional[str] = Field(default=None)
    sms_twilio_token: Optional[str] = Field(default=None)
    sms_twilio_phone: Optional[str] = Field(default=None)

    # Email (SMTP) - Optional
    smtp_host: Optional[str] = Field(default=None)
    smtp_port: int = Field(default=587)
    smtp_user: Optional[str] = Field(default=None)
    smtp_password: Optional[str] = Field(default=None)
    smtp_from_email: str = Field(default="noreply@nursery.com")

    # File storage
    files_base_dir: str = Field(default="./storage")
    max_file_size: int = Field(default=10485760)  # 10MB
    allowed_mime_types: List[str] = Field(default=[
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ])

    # CORS - Parse from comma-separated string
    cors_origins: str = Field(default="http://localhost:5173,http://localhost:3000")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60)
    auth_rate_limit_per_minute: int = Field(default=5)

    # Logging
    log_level: str = Field(default="INFO")
    log_file: str = Field(default="./logs/app.log")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string"""
        if isinstance(v, str):
            return v
        return v

    def get_cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("secret_key", "jwt_access_secret", "jwt_refresh_secret")
    @classmethod
    def validate_secrets(cls, v, info):
        """Validate that secrets are not using default values"""
        dangerous_defaults = [
            "your-secret-key",
            "change-in-production",
        ]
        # Only strictly validate length, allow dev keys in debug mode
        if len(v) < 32:
            raise ValueError(f"{info.field_name} must be at least 32 characters long")

        # Warn about production defaults (but don't fail)
        if any(default in v.lower() for default in dangerous_defaults):
            # Check if we're in production mode
            debug_env = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
            if not debug_env:
                raise ValueError(
                    f"{info.field_name} contains a default value. "
                    "Please set a secure random value for production!"
                )
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

# Create settings instance
settings = Settings()