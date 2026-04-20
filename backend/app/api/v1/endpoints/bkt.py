"""
BKT (Bayesian Knowledge Tracing) — Endpoint FastAPI
Modèle BKT simplifié pour suivre la maîtrise des compétences

Paramètres BKT standard :
  P(L0)  = probabilité initiale de maîtrise
  P(T)   = probabilité d'apprentissage (transit)
  P(G)   = probabilité de devinette (guess)
  P(S)   = probabilité de lapsus (slip)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, LessonProgress, Lesson, Course
from pydantic import BaseModel
from typing import Optional
import json

router = APIRouter(prefix="/bkt", tags=["bkt"])

# ── Paramètres BKT par compétence ─────────────────────────────
BKT_PARAMS = {
    "letter_recognition":  {"L0": 0.1, "T": 0.3, "G": 0.2, "S": 0.1},
    "letter_writing":      {"L0": 0.1, "T": 0.25, "G": 0.1, "S": 0.15},
    "harakat":             {"L0": 0.15, "T": 0.3, "G": 0.25, "S": 0.1},
    "vocabulary":          {"L0": 0.2, "T": 0.35, "G": 0.2, "S": 0.1},
    "letter_forms":        {"L0": 0.1, "T": 0.3, "G": 0.15, "S": 0.1},
    "reading":             {"L0": 0.05, "T": 0.2, "G": 0.15, "S": 0.1},
}
DEFAULT_PARAMS = {"L0": 0.1, "T": 0.3, "G": 0.2, "S": 0.1}

SKILL_NAMES = {
    "letter_recognition": "Reconnaissance des lettres",
    "letter_writing":     "Écriture des lettres",
    "harakat":            "Voyelles (harakat)",
    "vocabulary":         "Vocabulaire",
    "letter_forms":       "Formes des lettres",
    "reading":            "Lecture",
}

# Seuils de maîtrise
MASTERY_THRESHOLD = 0.80
GOOD_THRESHOLD    = 0.60
PROGRESS_THRESHOLD = 0.40


def bkt_update(p_mastery: float, correct: bool, params: dict) -> float:
    """Met à jour P(L_n) après une réponse correcte ou incorrecte."""
    L, T, G, S = params["L0"], params["T"], params["G"], params["S"]

    # P(correct | L) = L*(1-S) + (1-L)*G
    p_correct_given_L  = p_mastery * (1 - S) + (1 - p_mastery) * G
    p_correct_given_nL = (1 - p_mastery) * G + p_mastery * S  # unused but for clarity

    if correct:
        # Bayes: P(L | correct) = P(correct | L) * P(L) / P(correct)
        p_evidence = p_mastery * (1 - S) + (1 - p_mastery) * G
        if p_evidence == 0:
            p_evidence = 1e-10
        p_l_given_obs = (p_mastery * (1 - S)) / p_evidence
    else:
        # P(L | incorrect)
        p_evidence = p_mastery * S + (1 - p_mastery) * (1 - G)
        if p_evidence == 0:
            p_evidence = 1e-10
        p_l_given_obs = (p_mastery * S) / p_evidence

    # Transit : P(L_{n+1}) = P(L | obs) + (1 - P(L | obs)) * T
    return p_l_given_obs + (1 - p_l_given_obs) * T


# ── Schémas ────────────────────────────────────────────────────
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


# ── Stockage BKT (JSON dans user.bkt_profile si disponible, sinon simple) ──
# On utilise une table simple via LessonProgress pour dériver la maîtrise
# En production : ajouter une table UserSkillMastery dédiée

async def get_skill_mastery(user_id, skill_id: str, db: AsyncSession) -> float:
    """Calcule la maîtrise BKT à partir des progressions de leçons."""
    params = BKT_PARAMS.get(skill_id, DEFAULT_PARAMS)
    mastery = params["L0"]

    # Récupère toutes les progressions de l'utilisateur
    result = await db.execute(
        select(LessonProgress)
        .where(LessonProgress.user_id == user_id)
        .order_by(LessonProgress.id)
    )
    progressions = result.scalars().all()

    for prog in progressions:
        correct = prog.score >= 0.7
        mastery = bkt_update(mastery, correct, params)

    return round(mastery, 4)


# ── Endpoints ──────────────────────────────────────────────────

@router.post("/update", response_model=BKTUpdateResponse)
async def update_bkt(
    payload: BKTUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour le profil BKT de l'utilisateur après un exercice."""
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
    from datetime import datetime, timezone

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

    # Récupérer les progressions de l'utilisateur pour ce module
    lesson_ids = [l.id for l in lessons]
    prog_result = await db.execute(
        select(LessonProgress)
        .where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    progressions = prog_result.scalars().all()

    if not progressions:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Aucune progression trouvée. Terminez l'évaluation du module."
        )

    # Calculer le score global
    scores = [p.score for p in progressions]
    overall_score = sum(scores) / len(scores) if scores else 0.0
    passed = overall_score >= 0.70

    # Calculer la maîtrise par compétence
    skill_reports = []
    for skill_id, skill_name in SKILL_NAMES.items():
        mastery = await get_skill_mastery(current_user.id, skill_id, db)
        attempts = len(progressions)
        correct_count = sum(1 for p in progressions if p.score >= 0.7)

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

    # Recommandation globale
    weak_skills = [s for s in skill_reports if s.status in ("weak", "in_progress")]
    if passed and not weak_skills:
        recommendation = "Excellent travail ! Vous maîtrisez toutes les compétences du module. Passez au module suivant."
    elif passed:
        names = ", ".join(s.skill_name for s in weak_skills[:2])
        recommendation = f"Module réussi ! Pour consolider, révisez encore : {names}."
    else:
        names = ", ".join(s.skill_name for s in weak_skills[:3])
        recommendation = f"Continuez à pratiquer avant de passer au module suivant. Focus sur : {names}."

    # Titre du module
    module_result = await db.execute(
        select(Course).where(Course.module_id == module_id)
    )
    course = module_result.scalar_one_or_none()
    module_title = f"Module {module_id}"
    if course:
        from app.models.models import Module as ModuleModel
        mod_result = await db.execute(select(ModuleModel).where(ModuleModel.id == module_id))
        mod = mod_result.scalar_one_or_none()
        if mod:
            module_title = mod.title

    return BKTEvaluationReport(
        module_id=module_id,
        module_title=module_title,
        overall_score=round(overall_score, 4),
        passed=passed,
        skills=skill_reports,
        recommendation=recommendation,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )