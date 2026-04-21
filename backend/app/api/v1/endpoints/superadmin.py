"""
Endpoints Super Admin — app/api/v1/endpoints/superadmin.py
Gestion des admins, rapports d'activité, audit log
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.api.admin_audit import (
    require_superadmin, require_any_admin, audit_log,
    create_admin_session, close_admin_session,
    ROLE_PERMISSIONS, ALL_PERMISSIONS,
)
from app.models.models import User, AdminAuditLog, AdminSession
from app.core.security import hash_password
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


# ── Schémas ────────────────────────────────────────────────────
class CreateAdminRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = "admin"          # "admin" | "superadmin"
    permissions: list[str] = []
    role_template: Optional[str] = None  # utilise ROLE_PERMISSIONS si défini


class UpdateAdminRequest(BaseModel):
    permissions: Optional[list[str]] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class AdminSummary(BaseModel):
    id: str
    username: str
    email: str
    role: str
    permissions: list[str]
    is_active: bool
    created_at: str
    last_login: Optional[str] = None
    total_sessions: int = 0
    total_actions: int = 0


class AuditLogEntry(BaseModel):
    id: str
    admin_id: str
    admin_username: str
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: dict
    status: str
    ip_address: Optional[str]
    created_at: str


class AdminActivityReport(BaseModel):
    admin_id: str
    admin_username: str
    period_start: str
    period_end: str
    total_sessions: int
    total_time_seconds: int
    total_actions: int
    actions_by_type: dict[str, int]
    sessions: list[dict]
    recent_actions: list[dict]


# ── Liste des admins ───────────────────────────────────────────
@router.get("/admins", response_model=list[AdminSummary])
async def list_admins(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    result = await db.execute(
        select(User).where(User.is_admin == True).order_by(User.created_at.desc())
    )
    admins = result.scalars().all()

    summaries = []
    for admin in admins:
        # Dernière session
        sess_result = await db.execute(
            select(AdminSession)
            .where(AdminSession.admin_id == admin.id)
            .order_by(AdminSession.login_at.desc())
            .limit(1)
        )
        last_session = sess_result.scalar_one_or_none()

        # Nombre total de sessions
        sessions_count = await db.scalar(
            select(func.count(AdminSession.id)).where(AdminSession.admin_id == admin.id)
        )

        # Nombre total d'actions
        actions_count = await db.scalar(
            select(func.count(AdminAuditLog.id)).where(AdminAuditLog.admin_id == admin.id)
        )

        summaries.append(AdminSummary(
            id=str(admin.id),
            username=admin.username,
            email=admin.email,
            role=getattr(admin, 'role', 'admin'),
            permissions=getattr(admin, 'permissions', []) or [],
            is_active=admin.is_active,
            created_at=admin.created_at.isoformat(),
            last_login=last_session.login_at.isoformat() if last_session else None,
            total_sessions=sessions_count or 0,
            total_actions=actions_count or 0,
        ))

    return summaries


# ── Créer un admin ─────────────────────────────────────────────
@router.post("/admins", response_model=AdminSummary, status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: CreateAdminRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    # Vérifier email unique
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Email déjà utilisé")

    # Résoudre les permissions
    perms = payload.permissions
    if payload.role_template and payload.role_template in ROLE_PERMISSIONS:
        perms = ROLE_PERMISSIONS[payload.role_template]

    new_admin = User(
        id=uuid.uuid4(),
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        is_admin=True,
        is_active=True,
        is_verified=True,
        role=payload.role,
        permissions=perms,
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    await audit_log(db, current_user, "admin.create", "user", str(new_admin.id),
        {"email": payload.email, "role": payload.role, "permissions": perms}, request)

    return AdminSummary(
        id=str(new_admin.id), username=new_admin.username, email=new_admin.email,
        role=payload.role, permissions=perms, is_active=True,
        created_at=new_admin.created_at.isoformat(),
        total_sessions=0, total_actions=0,
    )


# ── Modifier un admin ──────────────────────────────────────────
@router.patch("/admins/{admin_id}", response_model=AdminSummary)
async def update_admin(
    admin_id: str,
    payload: UpdateAdminRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    result = await db.execute(select(User).where(User.id == uuid.UUID(admin_id)))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Admin introuvable")

    changes = {}
    if payload.permissions is not None:
        admin.permissions = payload.permissions
        changes["permissions"] = payload.permissions
    if payload.role is not None:
        admin.role = payload.role
        changes["role"] = payload.role
    if payload.is_active is not None:
        admin.is_active = payload.is_active
        changes["is_active"] = payload.is_active

    await db.commit()
    await audit_log(db, current_user, "admin.update", "user", admin_id, changes, request)

    return AdminSummary(
        id=str(admin.id), username=admin.username, email=admin.email,
        role=getattr(admin, 'role', 'admin'),
        permissions=getattr(admin, 'permissions', []) or [],
        is_active=admin.is_active,
        created_at=admin.created_at.isoformat(),
    )


# ── Rapport d'activité d'un admin ──────────────────────────────
@router.get("/admins/{admin_id}/activity", response_model=AdminActivityReport)
async def get_admin_activity(
    admin_id: str,
    days: int = Query(default=30, le=365),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    admin_uuid = uuid.UUID(admin_id)
    period_start = datetime.now(timezone.utc) - timedelta(days=days)
    period_end   = datetime.now(timezone.utc)

    result = await db.execute(select(User).where(User.id == admin_uuid))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Admin introuvable")

    # Sessions
    sess_result = await db.execute(
        select(AdminSession)
        .where(AdminSession.admin_id == admin_uuid, AdminSession.login_at >= period_start)
        .order_by(AdminSession.login_at.desc())
    )
    sessions = sess_result.scalars().all()

    total_time = sum(s.duration_seconds or 0 for s in sessions)

    sessions_data = [{
        "id": str(s.id),
        "login_at": s.login_at.isoformat(),
        "logout_at": s.logout_at.isoformat() if s.logout_at else None,
        "duration_seconds": s.duration_seconds,
        "ip_address": s.ip_address,
        "is_active": s.is_active,
    } for s in sessions]

    # Actions
    actions_result = await db.execute(
        select(AdminAuditLog)
        .where(AdminAuditLog.admin_id == admin_uuid, AdminAuditLog.created_at >= period_start)
        .order_by(AdminAuditLog.created_at.desc())
        .limit(50)
    )
    actions = actions_result.scalars().all()

    # Compter par type
    actions_by_type: dict[str, int] = {}
    for a in actions:
        actions_by_type[a.action] = actions_by_type.get(a.action, 0) + 1

    total_actions_count = await db.scalar(
        select(func.count(AdminAuditLog.id))
        .where(AdminAuditLog.admin_id == admin_uuid, AdminAuditLog.created_at >= period_start)
    )

    recent_actions = [{
        "id": str(a.id),
        "action": a.action,
        "resource_type": a.resource_type,
        "resource_id": a.resource_id,
        "status": a.status,
        "created_at": a.created_at.isoformat(),
        "details": a.details,
    } for a in actions[:20]]

    return AdminActivityReport(
        admin_id=admin_id,
        admin_username=admin.username,
        period_start=period_start.isoformat(),
        period_end=period_end.isoformat(),
        total_sessions=len(sessions),
        total_time_seconds=total_time,
        total_actions=total_actions_count or 0,
        actions_by_type=actions_by_type,
        sessions=sessions_data,
        recent_actions=recent_actions,
    )


# ── Journal d'audit global ─────────────────────────────────────
@router.get("/audit-log", response_model=list[AuditLogEntry])
async def get_audit_log(
    admin_id: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    days: int = Query(default=7, le=90),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    period_start = datetime.now(timezone.utc) - timedelta(days=days)

    q = select(AdminAuditLog, User).join(User, AdminAuditLog.admin_id == User.id) \
        .where(AdminAuditLog.created_at >= period_start)

    if admin_id:
        q = q.where(AdminAuditLog.admin_id == uuid.UUID(admin_id))
    if action:
        q = q.where(AdminAuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        q = q.where(AdminAuditLog.resource_type == resource_type)

    q = q.order_by(AdminAuditLog.created_at.desc()).limit(limit)
    result = await db.execute(q)
    rows = result.all()

    return [AuditLogEntry(
        id=str(log.id),
        admin_id=str(log.admin_id),
        admin_username=user.username,
        action=log.action,
        resource_type=log.resource_type,
        resource_id=log.resource_id,
        details=log.details,
        status=log.status,
        ip_address=log.ip_address,
        created_at=log.created_at.isoformat(),
    ) for log, user in rows]


# ── Admins connectés en ce moment ─────────────────────────────
@router.get("/admins/online")
async def get_online_admins(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    result = await db.execute(
        select(AdminSession, User)
        .join(User, AdminSession.admin_id == User.id)
        .where(AdminSession.is_active == True)
        .order_by(AdminSession.login_at.desc())
    )
    rows = result.all()
    return [{
        "admin_id": str(session.admin_id),
        "username": user.username,
        "login_at": session.login_at.isoformat(),
        "ip_address": session.ip_address,
        "duration_seconds": int((datetime.now(timezone.utc) - session.login_at).total_seconds()),
    } for session, user in rows]


# ── Permissions disponibles ────────────────────────────────────
@router.get("/permissions")
async def get_permissions(_: User = Depends(require_superadmin)):
    return {
        "all_permissions": ALL_PERMISSIONS,
        "role_templates": ROLE_PERMISSIONS,
    }