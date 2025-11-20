from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    app_name: str = "Document Annotation API"
    debug: bool = True
    database_url: str = "sqlite:///./annotations.db"
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File upload settings
    max_file_size: int = 10 * 1024 * 1024 * 1024  # 10GB - effectively unlimited for most use cases
    upload_dir: str = "uploads"
    allowed_file_types: list = [
        "application/pdf",
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/jpg"
    ]
    
    model_config = {"env_file": ".env"}

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)