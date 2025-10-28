from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional, List

class Settings(BaseSettings):
    # App settings
    app_name: str = "Nursery Management System"
    version: str = "1.0.0"
    debug: bool = True

    # Security
    secret_key: str = "your-secret-key-here-change-in-production-32-chars-minimum"
    jwt_access_secret: str = "your-access-secret-key-here-change-in-production-32-chars"
    jwt_refresh_secret: str = "your-refresh-secret-key-here-change-in-production-32-chars"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    otp_expire_minutes: int = 10

    # Database
    database_url: str = "mysql+mysqlconnector://root:83%40Wael1@localhost:3306/nursery_db"

    # SMS (Twilio)
    sms_twilio_sid: Optional[str] = None
    sms_twilio_token: Optional[str] = None
    sms_twilio_phone: Optional[str] = None

    # Email (SMTP)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None

    # File storage
    files_base_dir: str = "./storage"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_mime_types: List[str] = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Create settings instance
settings = Settings()