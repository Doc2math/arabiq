from datetime import datetime
from typing import Any
from pydantic import BaseModel


class LessonCompleteRequest(BaseModel):
    score: float
    duration_seconds: int


class LessonCompleteResponse(BaseModel):
    xp_earned: int
    new_badges: list[str] = []
    streak_updated: bool = False
    level_up: bool = False
    new_level: int | None = None


class LessonRead(BaseModel):
    id: int
    course_id: int
    title: str
    lesson_type: str
    xp_reward: int
    duration_minutes: int
    is_completed: bool = False
    content: dict[str, Any]
    model_config = {"from_attributes": True}


class CourseRead(BaseModel):
    id: int
    module_id: int
    title: str
    lessons_count: int = 0
    completion_rate: float = 0.0
    model_config = {"from_attributes": True}


class ModuleRead(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    lessons_count: int = 0
    arabic_ratio: float
    is_locked: bool = False
    completion_rate: float = 0.0
    courses: list[CourseRead] = []
    model_config = {"from_attributes": True}


class UserProgressRead(BaseModel):
    user_id: str
    completed_lessons: list[int]
    xp_earned: int
    last_activity_at: datetime | None = None


class BadgeRead(BaseModel):
    id: str
    name: str
    description: str
    icon_url: str
    requirement: str
    is_earned: bool = False
    earned_at: datetime | None = None
    model_config = {"from_attributes": True}