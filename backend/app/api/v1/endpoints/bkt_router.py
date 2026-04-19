"""
LangDad — Endpoints BKT
========================
À ajouter dans router.py :
    from app.api.v1.endpoints.bkt_router import router as bkt_router
    api_router.include_router(bkt_router, prefix="/bkt", tags=["bkt"])
"""

from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.models import User
from app.bkt.engine import bkt_engine

router = APIRouter()


@router.post("/update")
async def update_skill(payload: dict, current_user: User = Depends(get_current_user)):
    return bkt_engine.update(
        user_id    = str(current_user.id),
        skill_id   = payload["skill_id"],
        correct    = payload["correct"],
        latency_ms = payload.get("latency_ms", 0),
        module_id  = payload.get("module_id", 1),
    )


@router.get("/diagnostic/next")
async def next_diagnostic(answered: str = "", current_user: User = Depends(get_current_user)):
    answered_list = [s for s in answered.split(",") if s]
    return bkt_engine.next_diagnostic_question(str(current_user.id), answered_list)


@router.get("/evaluate/{module_id}")
async def evaluate_module(module_id: int, current_user: User = Depends(get_current_user)):
    return bkt_engine.evaluate_module(str(current_user.id), module_id)


@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return bkt_engine.get_profile_summary(str(current_user.id))


@router.get("/profile/full")
async def get_full_profile(current_user: User = Depends(get_current_user)):
    return bkt_engine.load_profile(str(current_user.id))