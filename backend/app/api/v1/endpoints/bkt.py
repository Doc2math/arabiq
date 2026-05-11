"""
BKT endpoint — app/api/v1/endpoints/bkt.py
TJ  = moyenne des scores des leçons journalières (lesson_type != 'evaluation')
EG  = score de la dernière leçon evaluation
Moyenne finale = (TJ + EG) / 2
Diagnostic pédagogique selon les 4 cas TJ/EG
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, LessonProgress, Lesson, Course, ExerciseLog
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/bkt", tags=["bkt"])

# ── Paramètres BKT ────────────────────────────────────────────
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
SEUIL_BON          = 0.70


def bkt_update(p_mastery: float, correct: bool, params: dict) -> float:
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
    params = BKT_PARAMS.get(skill_id, DEFAULT_PARAMS)
    mastery = params["L0"]
    result = await db.execute(
        select(ExerciseLog)
        .where(ExerciseLog.user_id == user_id, ExerciseLog.skill_id == skill_id)
        .order_by(ExerciseLog.created_at)
    )
    for log in result.scalars().all():
        mastery = bkt_update(mastery, log.correct, params)
    return round(mastery, 4)


# ── Schémas ───────────────────────────────────────────────────
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
    tj_score: float       # Travail journalier — moyenne leçons hors évaluation
    eg_score: float       # Évaluation globale — score leçon evaluation
    overall_score: float  # (TJ + EG) / 2
    passed: bool
    skills: list[SkillReport]
    recommendation: str
    diagnostic: str       # Analyse pédagogique TJ vs EG
    generated_at: str


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/log", response_model=ExerciseLogResponse)
async def log_exercise(
    payload: ExerciseLogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    new_mastery = await get_skill_mastery(current_user.id, payload.skill_id, db)

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
    """
    Rapport pédagogique du module.
    TJ  = moyenne des scores des leçons journalières (lesson_type != 'evaluation')
    EG  = score de la dernière leçon d'évaluation
    Moyenne finale = (TJ + EG) / 2
    """
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

    lesson_ids    = [l.id for l in lessons]
    daily_lessons = [l for l in lessons if l.lesson_type != 'evaluation']
    eval_lessons  = [l for l in lessons if l.lesson_type == 'evaluation']

    # Récupérer les progressions
    prog_result = await db.execute(
        select(LessonProgress)
        .where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    progressions   = prog_result.scalars().all()
    prog_by_lesson = {p.lesson_id: p for p in progressions}

    if not progressions:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Aucune progression trouvée. Terminez au moins une leçon."
        )

    # ── TJ — moyenne des leçons journalières ─────────────────
    daily_scores = [
        prog_by_lesson[l.id].score
        for l in daily_lessons
        if l.id in prog_by_lesson
    ]
    tj_score = round(sum(daily_scores) / len(daily_scores), 4) if daily_scores else 0.0

    # ── EG — dernière évaluation globale ─────────────────────
    eval_scores = [
        prog_by_lesson[l.id].score
        for l in eval_lessons
        if l.id in prog_by_lesson
    ]
    eg_score = round(eval_scores[-1], 4) if eval_scores else 0.0

    # ── Moyenne finale ────────────────────────────────────────
    if daily_scores and eval_scores:
        overall_score = round((tj_score + eg_score) / 2, 4)
    elif daily_scores:
        overall_score = tj_score
    else:
        overall_score = eg_score

    passed = overall_score >= SEUIL_BON

    # ── Diagnostic pédagogique ────────────────────────────────
    tj_bon = tj_score >= SEUIL_BON
    eg_bon = eg_score >= SEUIL_BON

    if tj_bon and eg_bon:
        diagnostic = (
            "✅ Maîtrise solide — Le travail régulier et la performance en évaluation "
            "sont tous deux solides. Les apprentissages sont bien consolidés."
        )
    elif tj_bon and not eg_bon:
        diagnostic = (
            "⚠️ Oubli ou stress d'évaluation — Le travail journalier est bon mais "
            "la performance en évaluation est plus faible. Cela peut indiquer un oubli "
            "entre les sessions, un manque de révision avant l'évaluation, ou un stress "
            "en situation d'examen. Encouragez des révisions régulières."
        )
    elif not tj_bon and eg_bon:
        diagnostic = (
            "⚠️ Mémorisation à court terme — La performance en évaluation est bonne "
            "mais le travail journalier est irrégulier. L'élève compense par un effort "
            "de dernière minute. Encouragez un travail plus régulier pour consolider "
            "les apprentissages sur le long terme."
        )
    else:
        diagnostic = (
            "❌ Lacunes fondamentales — Le travail journalier et la performance en "
            "évaluation sont tous deux insuffisants. Il est recommandé de revoir les "
            "leçons depuis le début avant de passer au module suivant."
        )

    # ── Logs d'exercices ──────────────────────────────────────
    log_result = await db.execute(
        select(ExerciseLog)
        .where(
            ExerciseLog.user_id == current_user.id,
            ExerciseLog.lesson_id.in_(lesson_ids),
        )
    )
    logs = log_result.scalars().all()
    skills_in_module = set(log.skill_id for log in logs) if logs else set(SKILL_NAMES.keys())

    # ── Rapport par compétence ────────────────────────────────
    skill_reports = []
    for skill_id in (skills_in_module if logs else SKILL_NAMES.keys()):
        mastery      = await get_skill_mastery(current_user.id, skill_id, db)
        skill_logs   = [l for l in logs if l.skill_id == skill_id]
        attempts     = len(skill_logs)
        correct_count = sum(1 for l in skill_logs if l.correct)

    success_rate = correct_count / max(attempts, 1)
    if success_rate >= MASTERY_THRESHOLD:
            skill_status = "mastered"
    elif success_rate >= GOOD_THRESHOLD:
            skill_status = "good"
    elif success_rate >= PROGRESS_THRESHOLD:
            skill_status = "in_progress"
    else:
        skill_status = "weak"

        recommended = 0 if skill_status in ("mastered", "good") else (3 if skill_status == "in_progress" else 5)

        skill_reports.append(SkillReport(
            skill_id=skill_id,
            skill_name=SKILL_NAMES.get(skill_id, skill_id),
            mastery=mastery,
            attempts=attempts,
            correct=correct_count,
            status=skill_status,
            recommended_exercises=recommended,
        ))

    # ── Recommandation ────────────────────────────────────────
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
    mod        = mod_result.scalar_one_or_none()
    module_title = mod.title if mod else f"Module {module_id}"

    return BKTEvaluationReport(
        module_id=module_id,
        module_title=module_title,
        tj_score=tj_score,
        eg_score=eg_score,
        overall_score=overall_score,
        passed=passed,
        skills=skill_reports,
        recommendation=recommendation,
        diagnostic=diagnostic,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/skills/{skill_id}")
async def get_skill_detail(
    skill_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mastery = await get_skill_mastery(current_user.id, skill_id, db)
    result = await db.execute(
        select(ExerciseLog)
        .where(ExerciseLog.user_id == current_user.id, ExerciseLog.skill_id == skill_id)
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