"""
Endpoints Admin — Stats, Utilisateurs, Traductions, Audit, Paramètres
Système de rôles : student | admin | superadmin
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.db.session import get_db
from app.api.deps import get_current_admin, get_current_superadmin
from app.models.models import User, LessonProgress, Module, AdminAuditLog
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import subprocess
import uuid as uuid_lib
from pathlib import Path

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Stats globales ─────────────────────────────────────────────
class AdminStats(BaseModel):
    users: int
    lessons_completed: int
    xp_distributed: int
    active_modules: int


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    if current_user.role == "admin":
        users_count = await db.scalar(
            select(func.count(User.id)).where(User.role == "student")
        )
    else:
        users_count = await db.scalar(
            select(func.count(User.id)).where(User.role.in_(["student", "admin"]))
        )

    lessons_count = await db.scalar(select(func.count(LessonProgress.id)))
    xp_total      = await db.scalar(select(func.sum(User.xp)))
    modules_count = await db.scalar(select(func.count(Module.id)))

    return AdminStats(
        users=users_count or 0,
        lessons_completed=lessons_count or 0,
        xp_distributed=int(xp_total or 0),
        active_modules=modules_count or 0,
    )


# ── Liste des utilisateurs ─────────────────────────────────────
@router.get("/users")
async def get_users(
    limit:     int = Query(default=50, le=200),
    offset:    int = Query(default=0),
    user_type: str = Query(default="independent"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    if user_type == "independent":
        where = (User.institution_id == None) & (User.role == "student")
    elif user_type == "institution":
        where = (User.institution_id != None) & (User.role == "student")
    elif user_type == "teachers":
        where = User.role.in_(["teacher", "institution_admin"])
    else:
        where = User.role.in_(["student", "teacher", "institution_admin"])

    result = await db.execute(
        select(User)
        .where(where)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    users = result.scalars().all()

    return [
        {
            "id":            str(u.id),
            "username":      u.username,
            "email":         u.email,
            "role":          u.role,
            "xp":            u.xp,
            "level":         u.level,
            "is_premium":    u.is_premium,
            "is_active":     u.is_active,
            "is_verified":   u.is_verified,
            "created_at":    u.created_at.isoformat() if u.created_at else None,
            "last_activity": u.last_activity_date.isoformat() if u.last_activity_date else None,
        }
        for u in users
    ]


# ── Détail d'un utilisateur ────────────────────────────────────
@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(User).where(User.id == uuid_lib.UUID(user_id))
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    if current_user.role == "admin" and target.role != "student":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "superadmin" and target.role == "superadmin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    prog_result = await db.execute(
        select(LessonProgress).where(LessonProgress.user_id == target.id)
    )
    progressions = prog_result.scalars().all()

    return {
        "id":                str(target.id),
        "username":          target.username,
        "email":             target.email,
        "role":              target.role,
        "xp":                target.xp,
        "level":             target.level,
        "streak":            target.streak,
        "is_premium":        target.is_premium,
        "is_active":         target.is_active,
        "is_verified":       target.is_verified,
        "native_language":   target.native_language,
        "created_at":        target.created_at.isoformat() if target.created_at else None,
        "last_activity":     target.last_activity_date.isoformat() if target.last_activity_date else None,
        "lessons_completed": len(progressions),
        "total_xp_earned":   sum(p.xp_earned for p in progressions),
    }


# ── Modifier un utilisateur ────────────────────────────────────
class UserUpdateRequest(BaseModel):
    is_active:  Optional[bool] = None
    is_premium: Optional[bool] = None
    role:       Optional[str]  = None


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(User).where(User.id == uuid_lib.UUID(user_id))
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    if current_user.role == "admin" and target.role != "student":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Un admin ne peut modifier que des students")
    if current_user.role == "superadmin" and target.role == "superadmin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Un superadmin ne peut pas modifier un autre superadmin")
    if str(target.id) == str(current_user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez pas modifier votre propre compte")

    if payload.role is not None:
        if current_user.role != "superadmin":
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Seul un superadmin peut modifier les rôles")
        if payload.role not in ("student", "admin"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Rôle invalide — valeurs acceptées : student | admin")

    changes = {}
    if payload.is_active is not None:
        target.is_active = payload.is_active
        changes["is_active"] = payload.is_active
    if payload.is_premium is not None:
        target.is_premium = payload.is_premium
        changes["is_premium"] = payload.is_premium
    if payload.role is not None:
        target.role     = payload.role
        target.is_admin = payload.role in ("admin", "superadmin")
        changes["role"] = payload.role

    await db.commit()

    action = "user.block" if payload.is_active is False else "user.update"
    try:
        from app.api.admin_audit import audit_log as do_audit
        await do_audit(db, current_user, action, "user", user_id, changes, request)
    except Exception:
        pass

    return {"success": True, "changes": changes}


# ── Liste des admins ───────────────────────────────────────────
@router.get("/admins")
async def list_admins(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    result = await db.execute(
        select(User)
        .where(User.role == "admin")
        .order_by(User.created_at.desc())
    )
    admins = result.scalars().all()
    return [
        {
            "id":         str(u.id),
            "username":   u.username,
            "email":      u.email,
            "role":       u.role,
            "is_active":  u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in admins
    ]


# ── Promouvoir un student en admin ─────────────────────────────
@router.post("/admins/promote/{user_id}")
async def promote_to_admin(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    result = await db.execute(
        select(User).where(User.id == uuid_lib.UUID(user_id))
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    if target.role != "student":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="L'utilisateur n'est pas un student")

    target.role     = "admin"
    target.is_admin = True
    await db.commit()

    return {"success": True, "message": f"{target.username} est maintenant admin"}


# ── Rétrograder un admin en student ───────────────────────────
@router.post("/admins/demote/{user_id}")
async def demote_to_student(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    result = await db.execute(
        select(User).where(User.id == uuid_lib.UUID(user_id))
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    if target.role != "admin":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="L'utilisateur n'est pas un admin")

    target.role     = "student"
    target.is_admin = False
    await db.commit()

    return {"success": True, "message": f"{target.username} est maintenant student"}


# ── Journal d'audit ────────────────────────────────────────────
@router.get("/audit-log")
async def get_audit_log(
    days:     int           = Query(default=7, le=90),
    limit:    int           = Query(default=100, le=500),
    admin_id: Optional[str] = Query(default=None),
    action:   Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    query = select(AdminAuditLog, User).join(
        User, AdminAuditLog.admin_id == User.id
    ).where(AdminAuditLog.created_at >= since)

    if admin_id:
        try:
            query = query.where(AdminAuditLog.admin_id == uuid_lib.UUID(admin_id))
        except ValueError:
            pass
    if action:
        query = query.where(AdminAuditLog.action.ilike(f"%{action}%"))

    query = query.order_by(desc(AdminAuditLog.created_at)).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id":             str(log.id),
            "admin_id":       str(log.admin_id),
            "admin_username": admin.username,
            "action":         log.action,
            "resource_type":  log.resource_type,
            "resource_id":    log.resource_id,
            "details":        log.details,
            "status":         log.status,
            "ip_address":     log.ip_address,
            "created_at":     log.created_at.isoformat(),
        }
        for log, admin in rows
    ]


# ── Paramètres ─────────────────────────────────────────────────
@router.get("/settings")
async def get_settings(
    _: User = Depends(get_current_superadmin),
):
    return {
        "two_factor_required":   False,
        "session_timeout_hours": 8,
        "max_failed_logins":     5,
        "ip_whitelist_enabled":  False,
        "notify_new_admin":      True,
        "notify_blocked_user":   True,
        "notify_payment":        True,
        "alert_email":           "superadmin@langdad.com",
        "auto_backup_enabled":   True,
        "backup_frequency_days": 7,
        "maintenance_mode":      False,
        "debug_mode":            False,
    }


@router.post("/settings")
async def save_settings(
    payload: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    try:
        from app.api.admin_audit import audit_log as do_audit
        await do_audit(db, current_user, "settings.update", "settings", None, payload, request)
    except Exception:
        pass
    return {"success": True, "message": "Paramètres sauvegardés"}


# ── Statut des traductions ─────────────────────────────────────
MESSAGES_DIR = Path(__file__).parent.parent.parent.parent / "frontend" / "messages"
TRANSLATE_SCRIPT = Path(__file__).parent.parent.parent.parent.parent / "translate_messages.py"
LANGUAGES = ["en", "es", "de", "nl"]


class TranslationStatus(BaseModel):
    languages: list[str]
    last_updated: dict[str, Optional[str]]


@router.get("/translations/status", response_model=TranslationStatus)
async def get_translation_status(
    _: User = Depends(get_current_admin),
):
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
    _: User = Depends(get_current_admin),
):
    import time, sys
    start = time.time()

    script_path = Path(__file__).parent.parent.parent.parent.parent / "translate_messages.py"
    if not script_path.exists():
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Script de traduction introuvable : {script_path}"
        )

    args = [sys.executable, str(script_path)]
    if force:
        args.append("--force")

    try:
        result = subprocess.run(
            args,
            cwd=str(script_path.parent),
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur: {result.stderr[:500]}"
            )
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Traduction trop longue (timeout 5min)"
        )

    duration = round(time.time() - start, 2)
    updated  = [lang for lang in LANGUAGES if (MESSAGES_DIR / f"{lang}.json").exists()]

    return TranslateResponse(
        message=f"Traduction terminée en {duration}s. {len(updated)} langues mises à jour.",
        languages_updated=updated,
        duration_seconds=duration,
    )
    
    # ── Gestion des institutions (superadmin) ──────────────────────
from app.models.models import Institution, InstitutionMember

PLAN_MAX = {
    "starter": 100,
    "medium":  200,
    "school":  500,
    "premium": 1000,
}

class InstitutionPlanUpdate(BaseModel):
    plan:                Optional[str]  = None
    subscription_status: Optional[str]  = None
    is_active:           Optional[bool] = None
    notes:               Optional[str]  = None


@router.get("/institutions")
async def list_institutions(
    limit:  int = Query(default=50, le=200),
    offset: int = Query(default=0),
    status_filter: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    """Liste toutes les institutions — superadmin uniquement."""
    query = select(Institution).order_by(Institution.created_at.desc())
    if status_filter:
        query = query.where(Institution.subscription_status == status_filter)
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    institutions = result.scalars().all()

    out = []
    for inst in institutions:
        # Compter les membres
        count = await db.scalar(
            select(func.count(InstitutionMember.id))
            .where(InstitutionMember.institution_id == inst.id)
        )
        # Récupérer le owner
        owner = await db.get(User, inst.owner_id)
        out.append({
            "id":                  str(inst.id),
            "name":                inst.name,
            "slug":                inst.slug,
            "institution_type":    inst.institution_type,
            "plan":                inst.plan,
            "max_students":        inst.max_students,
            "student_count":       count or 0,
            "subscription_status": inst.subscription_status,
            "trial_ends_at":       inst.trial_ends_at.isoformat() if inst.trial_ends_at else None,
            "subscription_ends_at":inst.subscription_ends_at.isoformat() if inst.subscription_ends_at else None,
            "is_active":           inst.is_active,
            "owner_username":      owner.username if owner else None,
            "owner_email":         owner.email if owner else None,
            "country":             inst.country,
            "city":                inst.city,
            "created_at":          inst.created_at.isoformat(),
            "notes":               inst.notes,
        })

    return out


@router.get("/institutions/{institution_id}")
async def get_institution(
    institution_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    """Détail d'une institution."""
    inst = await db.get(Institution, uuid_lib.UUID(institution_id))
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Institution introuvable")

    owner = await db.get(User, inst.owner_id)

    members_result = await db.execute(
        select(InstitutionMember, User)
        .join(User, InstitutionMember.user_id == User.id)
        .where(InstitutionMember.institution_id == inst.id)
        .order_by(InstitutionMember.joined_at.desc())
    )
    members = members_result.all()

    return {
        "id":                  str(inst.id),
        "name":                inst.name,
        "slug":                inst.slug,
        "institution_type":    inst.institution_type,
        "plan":                inst.plan,
        "max_students":        inst.max_students,
        "subscription_status": inst.subscription_status,
        "trial_ends_at":       inst.trial_ends_at.isoformat() if inst.trial_ends_at else None,
        "subscription_ends_at":inst.subscription_ends_at.isoformat() if inst.subscription_ends_at else None,
        "stripe_customer_id":  inst.stripe_customer_id,
        "is_active":           inst.is_active,
        "notes":               inst.notes,
        "country":             inst.country,
        "city":                inst.city,
        "contact_email":       inst.contact_email,
        "website":             inst.website,
        "created_at":          inst.created_at.isoformat(),
        "owner": {
            "id":       str(owner.id) if owner else None,
            "username": owner.username if owner else None,
            "email":    owner.email if owner else None,
        },
        "members": [
            {
                "id":         str(user.id),
                "username":   user.username,
                "email":      user.email,
                "role":       member.role,
                "group_name": member.group_name,
                "is_active":  member.is_active,
                "joined_at":  member.joined_at.isoformat(),
            }
            for member, user in members
        ],
    }


@router.patch("/institutions/{institution_id}")
async def update_institution(
    institution_id: str,
    payload: InstitutionPlanUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    """Modifier le plan, statut, notes d'une institution."""
    inst = await db.get(Institution, uuid_lib.UUID(institution_id))
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Institution introuvable")

    if payload.plan is not None:
        if payload.plan not in PLAN_MAX:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Plan invalide. Choisissez parmi: {list(PLAN_MAX.keys())}")
        inst.plan        = payload.plan
        inst.max_students = PLAN_MAX[payload.plan]

    if payload.subscription_status is not None:
        valid = ("active", "trial", "suspended", "cancelled")
        if payload.subscription_status not in valid:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Statut invalide. Valeurs: {valid}")
        inst.subscription_status = payload.subscription_status

    if payload.is_active is not None:
        inst.is_active = payload.is_active

    if payload.notes is not None:
        inst.notes = payload.notes

    await db.commit()
    return {"success": True, "message": "Institution mise à jour"}


@router.post("/institutions/{institution_id}/suspend")
async def suspend_institution(
    institution_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    """Suspendre une institution."""
    inst = await db.get(Institution, uuid_lib.UUID(institution_id))
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Institution introuvable")

    inst.subscription_status = "suspended"
    inst.is_active           = False
    await db.commit()
    return {"success": True, "message": f"Institution '{inst.name}' suspendue"}


@router.post("/institutions/{institution_id}/activate")
async def activate_institution(
    institution_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    """Réactiver une institution."""
    inst = await db.get(Institution, uuid_lib.UUID(institution_id))
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Institution introuvable")

    inst.subscription_status = "active"
    inst.is_active           = True
    await db.commit()
    return {"success": True, "message": f"Institution '{inst.name}' activée"}


@router.get("/institutions-stats")
async def get_institutions_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    """Stats globales des institutions."""
    total       = await db.scalar(select(func.count(Institution.id)))
    active      = await db.scalar(select(func.count(Institution.id)).where(Institution.subscription_status == "active"))
    trial       = await db.scalar(select(func.count(Institution.id)).where(Institution.subscription_status == "trial"))
    suspended   = await db.scalar(select(func.count(Institution.id)).where(Institution.subscription_status == "suspended"))
    total_members = await db.scalar(select(func.count(InstitutionMember.id)))

    # Par plan
    by_plan = {}
    for plan in PLAN_MAX:
        count = await db.scalar(
            select(func.count(Institution.id)).where(Institution.plan == plan)
        )
        by_plan[plan] = count or 0

    return {
        "total":         total or 0,
        "active":        active or 0,
        "trial":         trial or 0,
        "suspended":     suspended or 0,
        "total_members": total_members or 0,
        "by_plan":       by_plan,
    }