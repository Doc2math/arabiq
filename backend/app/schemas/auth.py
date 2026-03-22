from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    native_language: Literal["fr", "es", "en"] = "fr"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: UUID
    email: str
    username: str
    native_language: str
    avatar_url: str | None = None
    xp: int
    level: int
    streak: int
    is_premium: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPair