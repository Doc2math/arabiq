from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
  
    model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
    extra='ignore'
)
   
    APP_NAME: str = "ArabiQ API"
    APP_VERSION: str = "0.1.0"
    ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60   # 1 heure
   
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

    OPENAI_API_KEY: str = "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"
    ANTHROPIC_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    OPENROUTER_API_KEY: str = "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"
    RATE_LIMIT_PER_MINUTE: int = 60


settings = Settings()