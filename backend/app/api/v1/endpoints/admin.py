"""
Endpoints Admin — Stats, Utilisateurs, Traductions
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, LessonProgress, Module
from pydantic import BaseModel
from typing import Optional
import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime, timezone

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")
    return current_user


# ── Stats globales ─────────────────────────────────────────────
class AdminStats(BaseModel):
    users: int
    lessons_completed: int
    xp_distributed: int
    active_modules: int


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    users_count = await db.scalar(select(func.count(User.id)))
    lessons_count = await db.scalar(select(func.count(LessonProgress.id)))
    xp_total = await db.scalar(select(func.sum(User.xp)))
    modules_count = await db.scalar(select(func.count(Module.id)))

    return AdminStats(
        users=users_count or 0,
        lessons_completed=lessons_count or 0,
        xp_distributed=int(xp_total or 0),
        active_modules=modules_count or 0,
    )


# ── Utilisateurs récents ───────────────────────────────────────
@router.get("/users")
async def get_users(
    limit: int = Query(default=10, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit)
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "xp": u.xp,
            "level": u.level,
            "is_premium": u.is_premium,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


# ── Statut des traductions ─────────────────────────────────────
MESSAGES_DIR = Path(__file__).parent.parent.parent.parent.parent / "frontend" / "messages"
LANGUAGES = ["en", "es", "de", "nl"]


class TranslationStatus(BaseModel):
    languages: list[str]
    last_updated: dict[str, Optional[str]]


@router.get("/translations/status", response_model=TranslationStatus)
async def get_translation_status(_: User = Depends(require_admin)):
    last_updated = {}
    for lang in LANGUAGES:
        f = MESSAGES_DIR / f"{lang}.json"
        if f.exists():
            mtime = f.stat().st_mtime
            last_updated[lang] = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
        else:
            last_updated[lang] = None
    return TranslationStatus(languages=LANGUAGES, last_updated=last_updated)


# ── Déclencher la traduction ───────────────────────────────────
class TranslateResponse(BaseModel):
    message: str
    languages_updated: list[str]
    duration_seconds: float


@router.post("/translate", response_model=TranslateResponse)
async def trigger_translation(
    force: bool = Query(default=False),
    _: User = Depends(require_admin),
):
    """
    Déclenche la traduction via Claude Haiku.
    force=true : retraduit toutes les langues même si le cache est récent.
    """
    import time
    start = time.time()

    # Chemin du script de traduction
    script_path = MESSAGES_DIR.parent / "scripts" / "translate.ts"
    if not script_path.exists():
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Script de traduction introuvable : {script_path}"
        )

    # Construire la commande
    args = ["npx", "ts-node", "--esm", str(script_path)]
    if force:
        args.append("--force")

    try:
        result = subprocess.run(
            args,
            cwd=str(MESSAGES_DIR.parent),
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutes max
        )
        if result.returncode != 0:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur de traduction : {result.stderr[:500]}"
            )
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Traduction trop longue (timeout 5min)"
        )

    # Vérifier les fichiers générés
    updated = []
    for lang in LANGUAGES:
        f = MESSAGES_DIR / f"{lang}.json"
        if f.exists():
            updated.append(lang)

    duration = round(time.time() - start, 2)
    return TranslateResponse(
        message=f"Traduction terminée en {duration}s. {len(updated)} langues mises à jour.",
        languages_updated=updated,
        duration_seconds=duration,
    )