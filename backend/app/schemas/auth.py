from datetime import datetime
from typing import Literal
from pydantic import  ConfigDict
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator
import uuid


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    native_language: Literal["fr", "es", "en"] = "fr"
    role: Literal["student", "teacher", "institution"] = "student"  # ← ajouter

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
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    username: str
    native_language: str
    avatar_url: str | None
    xp: int
    level: int
    streak: int
    is_premium: bool
    is_admin: bool
    role: str = "student"           
    permissions: list = []          
    institution_id: uuid.UUID | None = None
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPair