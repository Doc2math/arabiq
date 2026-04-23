"""
BKT endpoint mis à jour — app/api/v1/endpoints/bkt.py
Changements :
  - Nouveau endpoint POST /bkt/log (enregistrer une réponse)
  - get_skill_mastery filtre maintenant par skill_id via exercise_log
  - POST /bkt/update inchangé mais plus précis
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, LessonProgress, Lesson, Course, ExerciseLog
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/bkt", tags=["bkt"])

# ── Paramètres BKT par compétence ─────────────────────────────
BKT_PARAMS = {
    "letter_recognition":  {"L0": 0.1,  "T": 0.3,  "G": 0.2,  "S": 0.1},
    "letter_writing":      {"L0": 0.1,  "T": 0.25, "G": 0.1,  "S": 0.15},
    "harakat_reading":     {"L0": 0.15, "T": 0.3,  "G": 0.25, "S": 0.1},
    "long_vowels":         {"L0": 0.15, "T": 0.3,  "G": 0.2,  "S": 0.1},
    "tanwin":              {"L0": 0.1,  "T": 0.25, "G": 0.2,  "S": 0.1},
    "letter_positions":    {"L0": 0.1,  "T": 0.3,  "G": 0.15, "S": 0.1},
    "word_reading":        {"L0": 0.2,  "T": 0.35, "G": 0.2,  "S": 0.1},
    "word_comprehension":  {"L0": 0.2,  "T": 0.35, "G": 0.2,  "S": 0.1},
    "word_writing":        {"L0": 0.1,  "T": 0.25, "G": 0.1,  "S": 0.15},
    "word_building":       {"L0": 0.15, "T": 0.3,  "G": 0.15, "S": 0.1},
    "sentence_reading":    {"L0": 0.05, "T": 0.2,  "G": 0.15, "S": 0.1},
}
DEFAULT_PARAMS = {"L0": 0.1, "T": 0.3, "G": 0.2, "S": 0.1}

SKILL_NAMES = {
    "letter_recognition": "Reconnaissance des lettres",
    "letter_writing":     "Écriture des lettres",
    "harakat_reading":    "Voyelles (harakat)",
    "long_vowels":        "Voyelles longues",
    "tanwin":             "Tanwīn",
    "letter_positions":   "Positions des lettres",
    "word_reading":       "Lecture des mots",
    "word_comprehension": "Compréhension des mots",
    "word_writing":       "Écriture des mots",
    "word_building":      "Construction de mots",
    "sentence_reading":   "Lecture de phrases",
}

MASTERY_THRESHOLD  = 0.80
GOOD_THRESHOLD     = 0.60
PROGRESS_THRESHOLD = 0.40


def bkt_update(p_mastery: float, correct: bool, params: dict) -> float:
    """Met à jour P(L_n) après une réponse."""
    L, T, G, S = params["L0"], params["T"], params["G"], params["S"]
    if correct:
        p_evidence = p_mastery * (1 - S) + (1 - p_mastery) * G
        if p_evidence == 0: p_evidence = 1e-10
        p_l_given_obs = (p_mastery * (1 - S)) / p_evidence
    else:
        p_evidence = p_mastery * S + (1 - p_mastery) * (1 - G)
        if p_evidence == 0: p_evidence = 1e-10
        p_l_given_obs = (p_mastery * S) / p_evidence
    return p_l_given_obs + (1 - p_l_given_obs) * T


async def get_skill_mastery(user_id, skill_id: str, db: AsyncSession) -> float:
    """Calcule la maîtrise BKT à partir de l'exercise_log filtré par skill_id."""
    params = BKT_PARAMS.get(skill_id, DEFAULT_PARAMS)
    mastery = params["L0"]

    # Récupère les logs pour ce skill_id spécifique
    result = await db.execute(
        select(ExerciseLog)
        .where(
            ExerciseLog.user_id == user_id,
            ExerciseLog.skill_id == skill_id,
        )
        .order_by(ExerciseLog.created_at)
    )
    logs = result.scalars().all()

    for log in logs:
        mastery = bkt_update(mastery, log.correct, params)

    return round(mastery, 4)


# ── Schémas ────────────────────────────────────────────────────
class ExerciseLogRequest(BaseModel):
    lesson_id: int
    exercise_id: str
    skill_id: str
    exercise_type: str
    variant: int = 1
    correct: bool
    response_time_ms: Optional[int] = None
    hint_used: bool = False
    attempt: int = 1


class ExerciseLogResponse(BaseModel):
    id: str
    skill_id: str
    mastery: float
    correct: bool
    message: str


class BKTUpdateRequest(BaseModel):
    skill_id: str
    correct: bool
    latency_ms: Optional[int] = None
    module_id: Optional[int] = None


class BKTUpdateResponse(BaseModel):
    skill_id: str
    mastery: float
    correct: bool


class SkillReport(BaseModel):
    skill_id: str
    skill_name: str
    mastery: float
    attempts: int
    correct: int
    status: str
    recommended_exercises: int


class BKTEvaluationReport(BaseModel):
    module_id: int
    module_title: str
    overall_score: float
    passed: bool
    skills: list[SkillReport]
    recommendation: str
    generated_at: str


# ── Endpoints ──────────────────────────────────────────────────

@router.post("/log", response_model=ExerciseLogResponse)
async def log_exercise(
    payload: ExerciseLogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Enregistre une réponse d'exercice et retourne la maîtrise mise à jour.
    Appelé après CHAQUE exercice depuis le frontend.
    """
    log = ExerciseLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        lesson_id=payload.lesson_id,
        exercise_id=payload.exercise_id,
        skill_id=payload.skill_id,
        exercise_type=payload.exercise_type,
        variant=payload.variant,
        correct=payload.correct,
        response_time_ms=payload.response_time_ms,
        hint_used=payload.hint_used,
        attempt=payload.attempt,
    )
    db.add(log)
    await db.commit()

    # Calculer la nouvelle maîtrise
    new_mastery = await get_skill_mastery(current_user.id, payload.skill_id, db)

    # Message de feedback
    if payload.correct:
        if new_mastery >= MASTERY_THRESHOLD:
            message = "Excellent ! Compétence maîtrisée !"
        elif new_mastery >= GOOD_THRESHOLD:
            message = "Très bien ! Continuez ainsi."
        else:
            message = "Bonne réponse ! Continuez à pratiquer."
    else:
        if new_mastery < PROGRESS_THRESHOLD:
            message = "Pas de souci, continuez à pratiquer cette compétence."
        else:
            message = "Pas tout à fait. Réessayez !"

    return ExerciseLogResponse(
        id=str(log.id),
        skill_id=payload.skill_id,
        mastery=new_mastery,
        correct=payload.correct,
        message=message,
    )


@router.post("/update", response_model=BKTUpdateResponse)
async def update_bkt(
    payload: BKTUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour le profil BKT (endpoint legacy — préférer /log)."""
    params = BKT_PARAMS.get(payload.skill_id, DEFAULT_PARAMS)
    current_mastery = await get_skill_mastery(current_user.id, payload.skill_id, db)
    new_mastery = bkt_update(current_mastery, payload.correct, params)

    return BKTUpdateResponse(
        skill_id=payload.skill_id,
        mastery=round(new_mastery, 4),
        correct=payload.correct,
    )


@router.get("/evaluate/{module_id}", response_model=BKTEvaluationReport)
async def evaluate_module(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Génère le rapport BKT de fin de module."""
    # Récupérer les leçons du module
    result = await db.execute(
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(Course.module_id == module_id)
        .order_by(Lesson.sort_order)
    )
    lessons = result.scalars().all()
    if not lessons:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Module introuvable")

    lesson_ids = [l.id for l in lessons]

    # Récupérer les logs d'exercices pour ce module
    log_result = await db.execute(
        select(ExerciseLog)
        .where(
            ExerciseLog.user_id == current_user.id,
            ExerciseLog.lesson_id.in_(lesson_ids),
        )
    )
    logs = log_result.scalars().all()

    # Récupérer les progressions
    prog_result = await db.execute(
        select(LessonProgress)
        .where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    progressions = prog_result.scalars().all()

    if not progressions and not logs:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Aucune progression trouvée. Terminez au moins une leçon."
        )

    # Score global depuis les progressions
    scores = [p.score for p in progressions]
    overall_score = sum(scores) / len(scores) if scores else 0.0
    passed = overall_score >= 0.70

    # Compétences présentes dans les logs de ce module
    skills_in_module = set(log.skill_id for log in logs) if logs else set(SKILL_NAMES.keys())

    # Rapport par compétence
    skill_reports = []
    for skill_id in (skills_in_module if logs else SKILL_NAMES.keys()):
        skill_name = SKILL_NAMES.get(skill_id, skill_id)
        mastery = await get_skill_mastery(current_user.id, skill_id, db)

        skill_logs = [l for l in logs if l.skill_id == skill_id]
        attempts = len(skill_logs)
        correct_count = sum(1 for l in skill_logs if l.correct)

        if mastery >= MASTERY_THRESHOLD:
            skill_status = "mastered"
        elif mastery >= GOOD_THRESHOLD:
            skill_status = "good"
        elif mastery >= PROGRESS_THRESHOLD:
            skill_status = "in_progress"
        else:
            skill_status = "weak"

        recommended = 0 if skill_status in ("mastered", "good") else (3 if skill_status == "in_progress" else 5)

        skill_reports.append(SkillReport(
            skill_id=skill_id,
            skill_name=skill_name,
            mastery=mastery,
            attempts=attempts,
            correct=correct_count,
            status=skill_status,
            recommended_exercises=recommended,
        ))

    # Recommandation
    weak_skills = [s for s in skill_reports if s.status in ("weak", "in_progress")]
    if passed and not weak_skills:
        recommendation = "Excellent ! Vous maîtrisez toutes les compétences du module. Passez au module suivant."
    elif passed:
        names = ", ".join(s.skill_name for s in weak_skills[:2])
        recommendation = f"Module réussi ! Pour consolider, révisez encore : {names}."
    else:
        names = ", ".join(s.skill_name for s in weak_skills[:3])
        recommendation = f"Continuez à pratiquer avant de passer au module suivant. Focus sur : {names}."

    # Titre du module
    from app.models.models import Module as ModuleModel
    mod_result = await db.execute(select(ModuleModel).where(ModuleModel.id == module_id))
    mod = mod_result.scalar_one_or_none()
    module_title = mod.title if mod else f"Module {module_id}"

    return BKTEvaluationReport(
        module_id=module_id,
        module_title=module_title,
        overall_score=round(overall_score, 4),
        passed=passed,
        skills=skill_reports,
        recommendation=recommendation,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/skills/{skill_id}")
async def get_skill_detail(
    skill_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne le détail d'une compétence pour l'utilisateur."""
    mastery = await get_skill_mastery(current_user.id, skill_id, db)

    result = await db.execute(
        select(ExerciseLog)
        .where(
            ExerciseLog.user_id == current_user.id,
            ExerciseLog.skill_id == skill_id,
        )
        .order_by(ExerciseLog.created_at.desc())
        .limit(20)
    )
    logs = result.scalars().all()

    return {
        "skill_id": skill_id,
        "skill_name": SKILL_NAMES.get(skill_id, skill_id),
        "mastery": mastery,
        "total_attempts": len(logs),
        "correct": sum(1 for l in logs if l.correct),
        "avg_response_time_ms": sum(l.response_time_ms or 0 for l in logs) // max(len(logs), 1),
        "recent_logs": [
            {
                "exercise_id": l.exercise_id,
                "correct": l.correct,
                "response_time_ms": l.response_time_ms,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs[:10]
        ],
    }