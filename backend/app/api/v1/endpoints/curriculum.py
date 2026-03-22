from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Course, Lesson, LessonProgress, Module, User, UserBadge
from app.schemas.curriculum import (
    LessonCompleteRequest,
    LessonCompleteResponse,
    LessonRead,
    ModuleRead,
    CourseRead,
    UserProgressRead,
)

router = APIRouter(prefix="/curriculum", tags=["curriculum"])
XP_PER_LEVEL = 1000


def _compute_level(xp: int) -> int:
    return max(1, xp // XP_PER_LEVEL + 1)


async def _get_completed_ids(user_id, db: AsyncSession) -> set[int]:
    rows = await db.execute(
        select(LessonProgress.lesson_id).where(LessonProgress.user_id == user_id)
    )
    return {r[0] for r in rows.all()}


@router.get("/modules", response_model=list[ModuleRead])
async def get_modules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Module)
        .options(selectinload(Module.courses).selectinload(Course.lessons))
        .order_by(Module.sort_order)
    )
    modules = result.scalars().all()
    completed = await _get_completed_ids(current_user.id, db)
    out = []
    for i, mod in enumerate(modules):
        total = sum(len(c.lessons) for c in mod.courses)
        done = sum(1 for c in mod.courses for l in c.lessons if l.id in completed)
        is_locked = i > 0 and not current_user.is_premium and mod.is_premium
        out.append(ModuleRead(
            id=mod.id, slug=mod.slug, title=mod.title, description=mod.description,
            arabic_ratio=mod.arabic_ratio, lessons_count=total, is_locked=is_locked,
            completion_rate=done / total if total else 0.0, courses=[],
        ))
    return out


@router.get("/modules/{module_id}", response_model=ModuleRead)
async def get_module(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Module)
        .options(selectinload(Module.courses).selectinload(Course.lessons))
        .where(Module.id == module_id)
    )
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Module not found.")
    completed = await _get_completed_ids(current_user.id, db)
    total = sum(len(c.lessons) for c in mod.courses)
    done = sum(1 for c in mod.courses for l in c.lessons if l.id in completed)
    courses_out = []
    for c in mod.courses:
        c_done = sum(1 for l in c.lessons if l.id in completed)
        courses_out.append(CourseRead(
            id=c.id, module_id=c.module_id, title=c.title,
            lessons_count=len(c.lessons),
            completion_rate=c_done / len(c.lessons) if c.lessons else 0.0,
        ))
    return ModuleRead(
        id=mod.id, slug=mod.slug, title=mod.title, description=mod.description,
        arabic_ratio=mod.arabic_ratio, lessons_count=total, is_locked=False,
        completion_rate=done / total if total else 0.0, courses=courses_out,
    )


@router.get("/lessons/{lesson_id}", response_model=LessonRead)
async def get_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Lesson not found.")
    completed = await _get_completed_ids(current_user.id, db)
    return LessonRead(
        id=lesson.id, course_id=lesson.course_id, title=lesson.title,
        lesson_type=lesson.lesson_type, xp_reward=lesson.xp_reward,
        duration_minutes=lesson.duration_minutes,
        is_completed=lesson.id in completed, content=lesson.content,
    )


@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
    lesson_id: int,
    payload: LessonCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Lesson not found.")

    xp_earned = int(lesson.xp_reward * max(0.3, payload.score))

    existing = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id == lesson_id,
        )
    )
    prog = existing.scalar_one_or_none()
    if prog:
        prog.attempts += 1
        prog.score = max(prog.score, payload.score)
    else:
        prog = LessonProgress(
            user_id=current_user.id, lesson_id=lesson_id,
            score=payload.score, xp_earned=xp_earned,
            duration_seconds=payload.duration_seconds,
        )
        db.add(prog)

    old_level = current_user.level
    current_user.xp += xp_earned
    current_user.level = _compute_level(current_user.xp)

    today = date.today()
    streak_updated = False
    last = current_user.last_activity_date
    if last is None or last.date() < today:
        if last and (today - last.date()).days == 1:
            current_user.streak += 1
        elif last is None or (today - last.date()).days > 1:
            current_user.streak = 1
        current_user.longest_streak = max(current_user.longest_streak, current_user.streak)
        current_user.last_activity_date = datetime.now(timezone.utc)
        streak_updated = True

    await db.flush()
    new_badges = await _evaluate_badges(current_user, db)

    return LessonCompleteResponse(
        xp_earned=xp_earned, new_badges=new_badges,
        streak_updated=streak_updated,
        level_up=current_user.level > old_level,
        new_level=current_user.level if current_user.level > old_level else None,
    )


@router.get("/next-lesson", response_model=LessonRead)
async def next_lesson(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    completed = await _get_completed_ids(current_user.id, db)
    result = await db.execute(select(Lesson).order_by(Lesson.id))
    for lesson in result.scalars().all():
        if lesson.id not in completed:
            return LessonRead(
                id=lesson.id, course_id=lesson.course_id, title=lesson.title,
                lesson_type=lesson.lesson_type, xp_reward=lesson.xp_reward,
                duration_minutes=lesson.duration_minutes,
                is_completed=False, content=lesson.content,
            )
    raise HTTPException(status.HTTP_404_NOT_FOUND, detail="All lessons completed!")


@router.get("/progress", response_model=UserProgressRead)
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    completed = await _get_completed_ids(current_user.id, db)
    return UserProgressRead(
        user_id=str(current_user.id),
        completed_lessons=list(completed),
        xp_earned=current_user.xp,
        last_activity_at=current_user.last_activity_date,
    )


async def _evaluate_badges(user: User, db: AsyncSession) -> list[str]:
    earned_result = await db.execute(
        select(UserBadge.badge_id).where(UserBadge.user_id == user.id)
    )
    already_earned = {r[0] for r in earned_result.all()}
    new_badges: list[str] = []
    rules = [
        ("first_lesson", True),
        ("streak_7",     user.streak >= 7),
        ("streak_30",    user.streak >= 30),
        ("level_5",      user.level >= 5),
        ("level_10",     user.level >= 10),
        ("xp_1000",      user.xp >= 1000),
        ("xp_5000",      user.xp >= 5000),
    ]
    for badge_id, condition in rules:
        if condition and badge_id not in already_earned:
            db.add(UserBadge(user_id=user.id, badge_id=badge_id))
            new_badges.append(badge_id)
    return new_badges