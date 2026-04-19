"""
LangDad — Endpoints API pour le diagnostic CAT
===============================================
Routes :
  POST /api/v1/diagnostic/start          → démarre une session
  GET  /api/v1/diagnostic/{session_id}/next  → prochaine question
  POST /api/v1/diagnostic/{session_id}/respond → enregistre une réponse
  GET  /api/v1/diagnostic/{session_id}/profile → profil final
  GET  /api/v1/diagnostic/{session_id}/status  → état de la session
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import json
import time

from app.api.deps import get_current_user
from app.models.models import User
from app.db.session import AsyncSessionLocal

router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])

# Stockage sessions en mémoire (Redis en production)
_sessions: dict = {}

# Instance moteur CAT (singleton)
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
from cat_engine import CATEngine

_engine = CATEngine(
    item_bank_path=Path(__file__).parent.parent.parent.parent / "item_bank.json"
)


# ── Schémas Pydantic ───────────────────────────────────────────
class StartRequest(BaseModel):
    lang: str = Field(default="fr", pattern="^(fr|es|en)$")

class RespondRequest(BaseModel):
    item_id:     str
    correct:     bool
    latency_ms:  int = Field(ge=0, le=120_000)
    confidence:  Optional[float] = Field(default=None, ge=0.0, le=1.0)
    answer_given: Optional[str] = None   # pour les questions à saisie libre

class QuestionOut(BaseModel):
    item_id:    str
    axis:       str
    type:       str
    modality:   str
    question:   dict
    stimulus:   Optional[dict]
    choices:    Optional[list]
    hint:       Optional[dict] = None
    session_progress: dict

class StatusOut(BaseModel):
    session_id: str
    total_items: int
    stopped:    bool
    stop_reason: str
    axes_progress: dict

class ProfileOut(BaseModel):
    session_id:    str
    global_level:  str
    global_theta:  float
    axes:          dict
    strengths:     list
    weaknesses:    list
    recommendation: dict
    skill_vector:  dict
    total_items:   int
    duration_s:    int


# ── Endpoints ──────────────────────────────────────────────────

@router.post("/start", response_model=dict)
async def start_diagnostic(
    body: StartRequest,
    current_user: User = Depends(get_current_user),
):
    """Démarre une session de diagnostic adaptatif."""
    session = _engine.start_session(
        user_id=str(current_user.id),
        lang=body.lang
    )
    _sessions[session.session_id] = session
    return {
        "session_id": session.session_id,
        "message": {
            "fr": "Diagnostic démarré. Les questions s'adapteront à vos réponses.",
            "en": "Diagnostic started. Questions will adapt to your answers.",
            "es": "Diagnóstico iniciado. Las preguntas se adaptarán a sus respuestas.",
        }.get(body.lang, "Diagnostic started."),
        "lang": body.lang,
    }


@router.get("/{session_id}/next", response_model=Optional[QuestionOut])
async def get_next_question(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """Retourne la prochaine question optimale pour cet élève."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if session.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")
    if session.stopped:
        return None

    item = _engine.next_question(session)
    if not item:
        return None

    # Calculer la progression pour l'UI
    axes_progress = {
        ax: {
            "n_items": state.n_items,
            "converged": state.converged,
            "level": _engine._theta_to_level(state.theta) if state.n_items > 0 else None,
        }
        for ax, state in session.axes.items()
    }
    convergence_rate = sum(
        1 for s in session.axes.values() if s.converged
    ) / len(session.axes)

    return QuestionOut(
        item_id=item["id"],
        axis=item["axis"],
        type=item["type"],
        modality=item["modality"],
        question=item["question"],
        stimulus=item.get("stimulus"),
        choices=item.get("choices"),
        hint=item.get("hint"),
        session_progress={
            "total_items":       session.total_items,
            "convergence_rate":  round(convergence_rate, 2),
            "axes":              axes_progress,
            "estimated_remaining": max(0, int((1 - convergence_rate) * 8)),
        }
    )


@router.post("/{session_id}/respond", response_model=StatusOut)
async def record_response(
    session_id: str,
    body: RespondRequest,
    current_user: User = Depends(get_current_user),
):
    """Enregistre la réponse de l'élève et met à jour son profil."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if session.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")
    if session.stopped:
        raise HTTPException(status_code=400, detail="Session déjà terminée")

    session = _engine.record_response(
        session=session,
        item_id=body.item_id,
        correct=body.correct,
        latency_ms=body.latency_ms,
        confidence=body.confidence,
    )
    _sessions[session_id] = session

    # Si terminé → sauvegarder le profil en base
    if session.stopped:
        await _save_profile_to_db(session, current_user)

    return StatusOut(
        session_id=session_id,
        total_items=session.total_items,
        stopped=session.stopped,
        stop_reason=session.stop_reason,
        axes_progress={
            ax: {
                "theta":     round(state.theta, 2),
                "se":        round(state.se, 2),
                "n_items":   state.n_items,
                "converged": state.converged,
                "level":     _engine._theta_to_level(state.theta),
            }
            for ax, state in session.axes.items()
        }
    )


@router.get("/{session_id}/profile", response_model=ProfileOut)
async def get_profile(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """Retourne le profil cognitif complet une fois le diagnostic terminé."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if session.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")
    if not session.stopped:
        raise HTTPException(status_code=400, detail="Diagnostic non terminé")

    profile = _engine.build_profile(session)
    return ProfileOut(**profile)


@router.get("/{session_id}/status", response_model=StatusOut)
async def get_status(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """État courant de la session."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if session.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")

    return StatusOut(
        session_id=session_id,
        total_items=session.total_items,
        stopped=session.stopped,
        stop_reason=session.stop_reason,
        axes_progress={
            ax: {
                "theta":     round(state.theta, 2),
                "se":        round(state.se, 2),
                "n_items":   state.n_items,
                "converged": state.converged,
                "level":     _engine._theta_to_level(state.theta),
            }
            for ax, state in session.axes.items()
        }
    )


# ── Sauvegarde profil en base ──────────────────────────────────
async def _save_profile_to_db(session, user: User):
    """Persiste le profil cognitif en base de données."""
    try:
        profile = _engine.build_profile(session)
        async with AsyncSessionLocal() as db:
            # Mise à jour du user avec son profil cognitif
            from sqlalchemy import update
            from app.models.models import User as UserModel
            await db.execute(
                update(UserModel)
                .where(UserModel.id == user.id)
                .values(
                    cognitive_profile=json.dumps(profile),
                    placement_level=profile["global_level"],
                    placement_module=profile["recommendation"]["start_module"],
                    placement_lesson=profile["recommendation"]["start_lesson"],
                )
            )
            await db.commit()
    except Exception as e:
        print(f"[CAT] Erreur sauvegarde profil : {e}")