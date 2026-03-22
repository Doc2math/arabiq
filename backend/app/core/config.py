from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    APP_NAME: str = "ArabiQ API"
    APP_VERSION: str = "0.1.0"
    ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    DATABASE_URL: str = "postgresql+asyncpg://arabic:arabic@localhost:5432/arabic_platform"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    RATE_LIMIT_PER_MINUTE: int = 60


settings = Settings()