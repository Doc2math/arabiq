"""
LangDad — Endpoints Admin Curriculum
=====================================
Routes :
  GET    /api/v1/admin/curriculum/modules/{module_id}/lessons
  POST   /api/v1/admin/curriculum/modules/{module_id}/lessons
  PUT    /api/v1/admin/curriculum/lessons/{lesson_id}
  DELETE /api/v1/admin/curriculum/lessons/{lesson_id}
  GET    /api/v1/admin/curriculum/lessons/{lesson_id}/exercises
  POST   /api/v1/admin/curriculum/lessons/{lesson_id}/exercises
  PUT    /api/v1/admin/curriculum/exercises/{exercise_id}
  DELETE /api/v1/admin/curriculum/exercises/{exercise_id}
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Any
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import uuid

from app.api.deps import get_current_user, get_db
from app.models.models import User, Module, Course, Lesson

router = APIRouter(prefix="/admin/curriculum", tags=["admin-curriculum"])


# ── Guard admin ────────────────────────────────────────────────
def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin requis")
    return user


# ── Schémas ────────────────────────────────────────────────────
class LessonCreate(BaseModel):
    title:            str   = Field(min_length=2, max_length=200)
    lesson_type:      str   = Field(default="identification")
    xp_reward:        int   = Field(default=15, ge=1, le=500)
    duration_minutes: int   = Field(default=10, ge=1, le=120)
    sort_order:       int   = Field(default=1,  ge=1)
    content:          dict  = Field(default_factory=lambda: {"exercises": []})

class LessonUpdate(BaseModel):
    title:            Optional[str]  = None
    lesson_type:      Optional[str]  = None
    xp_reward:        Optional[int]  = None
    duration_minutes: Optional[int]  = None
    sort_order:       Optional[int]  = None
    content:          Optional[dict] = None

class LessonOut(BaseModel):
    id:               int
    course_id:        int
    title:            str
    lesson_type:      str
    xp_reward:        int
    duration_minutes: int
    sort_order:       int
    content:          dict
    model_config = {"from_attributes": True}


# ── Helper : trouver ou créer le premier cours d'un module ─────
async def _get_or_create_course(module_id: int, db: AsyncSession) -> Course:
    """Chaque module a au moins un cours — on le crée si absent."""
    result = await db.execute(
        select(Course)
        .where(Course.module_id == module_id)
        .order_by(Course.sort_order)
        .limit(1)
    )
    course = result.scalar_one_or_none()
    if not course:
        # Vérifier que le module existe
        mod = await db.get(Module, module_id)
        if not mod:
            raise HTTPException(status_code=404, detail=f"Module {module_id} introuvable")
        course = Course(module_id=module_id, title=mod.title, sort_order=1)
        db.add(course)
        await db.flush()
    return course


# ── Endpoints leçons ───────────────────────────────────────────

@router.get("/modules/{module_id}/lessons", response_model=list[LessonOut])
async def list_lessons(
    module_id: int,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Liste toutes les leçons d'un module (tous cours confondus)."""
    result = await db.execute(
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(Course.module_id == module_id)
        .order_by(Lesson.sort_order)
    )
    return result.scalars().all()


@router.post("/modules/{module_id}/lessons", response_model=LessonOut, status_code=201)
async def create_lesson(
    module_id: int,
    body:  LessonCreate,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Crée une nouvelle leçon dans le module."""
    course = await _get_or_create_course(module_id, db)
    lesson = Lesson(
        course_id        = course.id,
        title            = body.title,
        lesson_type      = body.lesson_type,
        xp_reward        = body.xp_reward,
        duration_minutes = body.duration_minutes,
        sort_order       = body.sort_order,
        content          = body.content,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonOut)
async def update_lesson(
    lesson_id: int,
    body:  LessonUpdate,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Modifie une leçon existante."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)

    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.delete("/lessons/{lesson_id}", status_code=204)
async def delete_lesson(
    lesson_id: int,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Supprime une leçon et son contenu."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")
    await db.delete(lesson)
    await db.commit()


# ── Endpoints exercices (dans le content JSON) ─────────────────

@router.get("/lessons/{lesson_id}/exercises")
async def get_exercises(
    lesson_id: int,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Retourne les exercices d'une leçon."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")
    return lesson.content.get("exercises", [])


@router.post("/lessons/{lesson_id}/exercises", status_code=201)
async def add_exercise(
    lesson_id: int,
    body:  dict,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Ajoute un exercice à une leçon."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")

    content = dict(lesson.content or {})
    exercises = list(content.get("exercises", []))
    body["id"] = str(uuid.uuid4())
    exercises.append(body)
    content["exercises"] = exercises
    lesson.content = content

    await db.commit()
    await db.refresh(lesson)
    return body


@router.put("/lessons/{lesson_id}/exercises/{exercise_id}")
async def update_exercise(
    lesson_id:   int,
    exercise_id: str,
    body:  dict,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Modifie un exercice dans une leçon."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")

    content   = dict(lesson.content or {})
    exercises = list(content.get("exercises", []))
    idx = next((i for i, e in enumerate(exercises) if e.get("id") == exercise_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Exercice introuvable")

    body["id"] = exercise_id
    exercises[idx] = body
    content["exercises"] = exercises
    lesson.content = content

    await db.commit()
    return body


@router.delete("/lessons/{lesson_id}/exercises/{exercise_id}", status_code=204)
async def delete_exercise(
    lesson_id:   int,
    exercise_id: str,
    admin: User = Depends(require_admin),
    db:    AsyncSession = Depends(get_db),
):
    """Supprime un exercice d'une leçon."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")

    content   = dict(lesson.content or {})
    exercises = [e for e in content.get("exercises", []) if e.get("id") != exercise_id]
    content["exercises"] = exercises
    lesson.content = content

    await db.commit()