from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import Module, Course, Lesson, LessonProgress, User
from app.schemas.curriculum import (
    ModuleRead, LessonRead, LessonCompleteRequest, LessonCompleteResponse
)
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


# ── Modules ───────────────────────────────────────────────────
@router.get("/modules", response_model=list[ModuleRead])
async def get_modules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Module).order_by(Module.sort_order))
    return result.scalars().all()


# ── Leçons d'un module ────────────────────────────────────────
@router.get("/modules/{module_id}/lessons", response_model=list[LessonRead])
async def get_module_lessons(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Récupère toutes les leçons du module via les courses
    result = await db.execute(
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(Course.module_id == module_id)
        .order_by(Lesson.sort_order)
    )
    lessons = result.scalars().all()

    # Récupère la progression de l'utilisateur
    prog_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_([l.id for l in lessons])
        )
    )
    completed_ids = {p.lesson_id for p in prog_result.scalars().all()}

    # Injecte is_completed et module_id dans chaque leçon
    lesson_list = []
    for lesson in lessons:
        d = LessonRead.model_validate(lesson).model_dump()
        d['is_completed'] = lesson.id in completed_ids
        d['module_id'] = module_id
        lesson_list.append(d)

    return lesson_list


# ── Détail d'une leçon ─────────────────────────────────────────
@router.get("/lessons/{lesson_id}", response_model=LessonRead)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.course))
        .where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Leçon introuvable")

    await db.refresh(lesson)
    d = LessonRead.model_validate(lesson).model_dump()
    d['module_id'] = lesson.course.module_id if lesson.course else None
    return d


# ── Compléter une leçon ────────────────────────────────────────
@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
    lesson_id: int,
    payload: LessonCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Vérifier que la leçon existe
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Leçon introuvable")

    # Calculer XP
    xp_earned = round(lesson.xp_reward * payload.score)

    # Chercher une progression existante
    prog_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id == lesson_id,
        )
    )
    progress = prog_result.scalar_one_or_none()

    if progress:
        # Mettre à jour si meilleur score
        if payload.score > progress.score:
            progress.score = payload.score
            progress.xp_earned = xp_earned
            progress.duration_seconds = payload.duration_seconds
        progress.attempts += 1
    else:
        # Créer une nouvelle progression
        progress = LessonProgress(
            id=uuid.uuid4(),
            user_id=current_user.id,
            lesson_id=lesson_id,
            score=payload.score,
            xp_earned=xp_earned,
            duration_seconds=payload.duration_seconds,
            attempts=1,
        )
        db.add(progress)
        # Ajouter XP à l'utilisateur
        current_user.xp += xp_earned
        # Mise à jour du niveau (1 niveau tous les 500 XP)
        current_user.level = max(1, current_user.xp // 500 + 1)

    await db.commit()
    await db.refresh(current_user)

    return LessonCompleteResponse(
        lesson_id=lesson_id,
        score=payload.score,
        xp_earned=xp_earned,
        total_xp=current_user.xp,
        level=current_user.level,
    )