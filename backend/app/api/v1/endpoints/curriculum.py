"""
Endpoints curriculum — app/api/v1/endpoints/curriculum.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, Module, Course, Lesson, LessonProgress, Part
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


# ── Schémas ────────────────────────────────────────────────────
class LessonRead(BaseModel):
    id: int
    title: str
    lesson_type: str
    xp_reward: int
    duration_minutes: int
    sort_order: int
    content: dict
    is_completed: bool
    completed_at: Optional[datetime] = None
    module_id: int

    class Config:
        from_attributes = True


class ModuleRead(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    arabic_ratio: float
    sort_order: int
    is_premium: bool
    part_id: Optional[int] = None
    lessons_count: int = 0
    completed_count: int = 0
    total_xp: int = 0
    is_module_completed: bool = False  # toutes les leçons non-oral complétées

    class Config:
        from_attributes = True


class PartRead(BaseModel):
    id: int
    number: int
    title: str
    description: str
    degree: int
    sort_order: int
    is_premium: bool
    color: str
    icon: str
    modules: list[ModuleRead] = []
    total_lessons: int = 0
    completed_lessons: int = 0

    class Config:
        from_attributes = True


# ── Helper : progressions complétées ────────────────────────────
async def get_completed_map(user_id: uuid.UUID, db: AsyncSession) -> dict[int, datetime]:
    """Retourne {lesson_id: completed_at} pour toutes les leçons complétées."""
    result = await db.execute(
        select(LessonProgress.lesson_id, LessonProgress.completed_at)
        .where(LessonProgress.user_id == user_id)
    )
    return {r[0]: r[1] for r in result.all()}


# ── GET /curriculum/parts ─────────────────────────────────────
@router.get("/parts", response_model=list[PartRead])
async def get_parts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed_map = await get_completed_map(current_user.id, db)
    completed_ids = set(completed_map.keys())

    result = await db.execute(
        select(Part)
        .options(selectinload(Part.modules))
        .order_by(Part.sort_order)
    )
    parts = result.scalars().all()

    part_reads = []
    for part in parts:
        module_reads = []
        total_lessons    = 0
        completed_lessons = 0

        for mod in part.modules:
            les_result = await db.execute(
                select(Lesson)
                .join(Course, Lesson.course_id == Course.id)
                .where(Course.module_id == mod.id)
                .order_by(Lesson.sort_order)
            )
            lessons = les_result.scalars().all()

            # Leçons non-oral (comptent pour la progression du module)
            non_oral_lessons = [l for l in lessons if l.lesson_type != 'oral_practice']
            oral_lessons      = [l for l in lessons if l.lesson_type == 'oral_practice']

            # Oral complété → ne pas compter dans les leçons visibles
            oral_completed_ids = {l.id for l in oral_lessons if l.id in completed_ids}

            lesson_ids    = [l.id for l in non_oral_lessons]
            mod_completed = len([lid for lid in lesson_ids if lid in completed_ids])
            mod_xp        = sum(l.xp_reward for l in lessons)

            # Visible count = leçons non-oral + leçons oral NON complétées
            visible_lessons = len(non_oral_lessons) + len([l for l in oral_lessons if l.id not in completed_ids])

            # Module complété = toutes les leçons non-oral complétées
            is_module_completed = len(lesson_ids) > 0 and mod_completed == len(lesson_ids)

            total_lessons     += visible_lessons
            completed_lessons += mod_completed

            module_reads.append(ModuleRead(
                id=mod.id, slug=mod.slug, title=mod.title,
                description=mod.description, arabic_ratio=mod.arabic_ratio,
                sort_order=mod.sort_order, is_premium=mod.is_premium,
                part_id=mod.part_id,
                lessons_count=visible_lessons,
                completed_count=mod_completed,
                total_xp=mod_xp,
                is_module_completed=is_module_completed,
            ))

        part_reads.append(PartRead(
            id=part.id, number=part.number, title=part.title,
            description=part.description, degree=part.degree,
            sort_order=part.sort_order, is_premium=part.is_premium,
            color=part.color, icon=part.icon,
            modules=module_reads,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
        ))

    return part_reads


# ── GET /curriculum/modules ───────────────────────────────────
@router.get("/modules", response_model=list[ModuleRead])
async def get_modules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed_map = await get_completed_map(current_user.id, db)
    completed_ids = set(completed_map.keys())

    result = await db.execute(select(Module).order_by(Module.sort_order))
    modules = result.scalars().all()

    module_reads = []
    for mod in modules:
        les_result = await db.execute(
            select(Lesson)
            .join(Course, Lesson.course_id == Course.id)
            .where(Course.module_id == mod.id)
        )
        lessons = les_result.scalars().all()
        non_oral  = [l for l in lessons if l.lesson_type != 'oral_practice']
        lesson_ids = [l.id for l in non_oral]
        mod_completed = len([lid for lid in lesson_ids if lid in completed_ids])
        is_module_completed = len(lesson_ids) > 0 and mod_completed == len(lesson_ids)

        module_reads.append(ModuleRead(
            id=mod.id, slug=mod.slug, title=mod.title,
            description=mod.description, arabic_ratio=mod.arabic_ratio,
            sort_order=mod.sort_order, is_premium=mod.is_premium,
            part_id=mod.part_id,
            lessons_count=len(lessons),
            completed_count=mod_completed,
            total_xp=sum(l.xp_reward for l in lessons),
            is_module_completed=is_module_completed,
        ))

    return module_reads


# ── GET /curriculum/modules/{id}/lessons ─────────────────────
@router.get("/modules/{module_id}/lessons", response_model=list[LessonRead])
async def get_module_lessons(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed_map = await get_completed_map(current_user.id, db)
    completed_ids = set(completed_map.keys())

    result = await db.execute(
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(Course.module_id == module_id)
        .order_by(Lesson.sort_order)
    )
    lessons = result.scalars().all()

    lesson_reads = []
    for l in lessons:
        # Oral_practice complété → ne pas retourner
        if l.lesson_type == 'oral_practice' and l.id in completed_ids:
            continue
        lesson_reads.append(LessonRead(
            id=l.id, title=l.title, lesson_type=l.lesson_type,
            xp_reward=l.xp_reward, duration_minutes=l.duration_minutes,
            sort_order=l.sort_order, content=l.content,
            is_completed=l.id in completed_ids,
            completed_at=completed_map.get(l.id),
            module_id=module_id,
        ))

    return lesson_reads


# ── GET /curriculum/lessons/{id} ─────────────────────────────
@router.get("/lessons/{lesson_id}", response_model=LessonRead)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed_map = await get_completed_map(current_user.id, db)

    result = await db.execute(
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Leçon introuvable")

    course_result = await db.execute(select(Course).where(Course.id == lesson.course_id))
    course = course_result.scalar_one_or_none()

    return LessonRead(
        id=lesson.id, title=lesson.title, lesson_type=lesson.lesson_type,
        xp_reward=lesson.xp_reward, duration_minutes=lesson.duration_minutes,
        sort_order=lesson.sort_order, content=lesson.content,
        is_completed=lesson.id in completed_map,
        completed_at=completed_map.get(lesson.id),
        module_id=course.module_id if course else 0,
    )


# ── POST /curriculum/lessons/{id}/complete ────────────────────
class LessonCompleteRequest(BaseModel):
    score: float
    duration_seconds: int = 0
    xp_earned: int = 0


class LessonCompleteResponse(BaseModel):
    success: bool
    xp_earned: int
    new_total_xp: int
    level: int


@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
    lesson_id: int,
    payload: LessonCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import timezone
    now = datetime.now(timezone.utc)

    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Leçon introuvable")

    prog_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id == lesson_id,
        )
    )
    existing = prog_result.scalar_one_or_none()

    xp_to_add = 0
    if not existing:
        xp_to_add = lesson.xp_reward if payload.score >= 0.7 else int(lesson.xp_reward * payload.score)
        prog = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            score=payload.score,
            xp_earned=xp_to_add,
            duration_seconds=payload.duration_seconds,
            attempts=1,
            completed_at=now,
        )
        db.add(prog)
    else:
        existing.attempts += 1
        if payload.score > existing.score:
            xp_to_add = max(0, lesson.xp_reward - existing.xp_earned) if payload.score >= 0.7 else 0
            existing.score = payload.score
            existing.xp_earned += xp_to_add
        # Mettre à jour completed_at à chaque completion
        existing.completed_at = now

    current_user.xp += xp_to_add
    new_level = max(1, current_user.xp // 100 + 1)
    current_user.level = new_level

    await db.commit()
    await db.refresh(current_user)

    return LessonCompleteResponse(
        success=True,
        xp_earned=xp_to_add,
        new_total_xp=current_user.xp,
        level=new_level,
    )