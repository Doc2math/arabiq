from pydantic import BaseModel, ConfigDict
from typing import Any, Optional
from datetime import datetime


class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    title: str
    description: str
    sort_order: int
    is_premium: bool


class LessonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    lesson_type: str
    xp_reward: int
    duration_minutes: int
    sort_order: int
    content: Optional[Any] = None
    is_completed: Optional[bool] = False
    module_id: Optional[int] = None


class LessonCompleteRequest(BaseModel):
    score: float        # 0.0 à 1.0
    duration_seconds: int


class LessonCompleteResponse(BaseModel):
    lesson_id: int
    score: float
    xp_earned: int
    total_xp: int
    level: int