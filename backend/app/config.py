import json
import secrets
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Terrabyte Academy"
    DEBUG: bool = False
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ALLOWED_ORIGINS: str = "https://terrabyte-acad.vercel.app,https://terrabyte-academy.onrender.com,http://localhost:3000"
    TRUSTED_HOSTS: str = "localhost,127.0.0.1,terrabyte-acad.vercel.app,terrabyte-academy.onrender.com"
    LOG_LEVEL: str = "INFO"

    @property
    def allowed_origins_list(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["https://terrabyte-acad.vercel.app", "http://localhost:3000"]

        value = str(self.ALLOWED_ORIGINS).strip()
        if not value:
            return ["https://terrabyte-acad.vercel.app", "http://localhost:3000"]

        if value.startswith("["):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip() and str(item).strip().startswith(("http://", "https://"))]
            except json.JSONDecodeError:
                pass

        return [item.strip() for item in value.split(",") if item.strip() and item.strip().startswith(("http://", "https://"))]

    @property
    def trusted_hosts(self) -> List[str]:
        if not self.TRUSTED_HOSTS:
            return ["localhost", "127.0.0.1"]

        value = str(self.TRUSTED_HOSTS).strip()
        if not value:
            return ["localhost", "127.0.0.1"]

        if value.startswith("["):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                pass

        return [item.strip() for item in value.split(",") if item.strip()]

    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MIN: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    AWS_ACCESS_KEY: str = ""
    AWS_SECRET_KEY: str = ""
    AWS_BUCKET: str = "terrabyte-media"
    AWS_REGION: str = "us-east-1"

    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET_NAME: str = ""
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str = ""

    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""
    BACKEND_BASE_URL: str = "https://terrabyte-academy.onrender.com"
    FRONTEND_BASE_URL: str = "https://terrabyte-acad.vercel.app"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@terrabyteacademy.com"

    class Config:
        env_file = ".env"


settings = Settings()
