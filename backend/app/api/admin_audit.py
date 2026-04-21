"""
Middleware d'audit admin — app/api/admin_audit.py

Utilitaires pour logger automatiquement les actions admin.
Usage dans les endpoints :
    await audit_log(db, current_user, "user.block", "user", str(user_id), {"reason": "spam"}, request)
"""

from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, AdminAuditLog, AdminSession
import uuid
from datetime import datetime, timezone
from typing import Optional

# ── Permissions disponibles ───────────────────────────────────
ALL_PERMISSIONS = [
    # Utilisateurs
    "users:view", "users:edit", "users:block", "users:delete", "users:grant_admin",
    # Contenu
    "content:view", "content:create", "content:edit", "content:delete", "content:publish",
    # Blog
    "blog:view", "blog:create", "blog:edit", "blog:publish", "blog:delete",
    # Paiements
    "payments:view", "payments:refund", "payments:manage",
    # Traductions
    "translations:view", "translations:trigger",
    # Paramètres
    "settings:view", "settings:edit",
    # Rapports
    "reports:view",
    # Admins (super admin seulement)
    "admins:view", "admins:create", "admins:edit", "admins:suspend",
]

# Permissions par défaut par rôle
ROLE_PERMISSIONS = {
    "content_manager": [
        "content:view", "content:create", "content:edit",
        "blog:view", "blog:create", "blog:edit", "blog:publish",
    ],
    "moderator": [
        "users:view", "users:block",
        "content:view", "reports:view",
    ],
    "translator": [
        "translations:view", "translations:trigger",
        "content:view",
    ],
    "admin": [
        "users:view", "users:edit", "users:block",
        "content:view", "content:create", "content:edit", "content:delete", "content:publish",
        "blog:view", "blog:create", "blog:edit", "blog:publish", "blog:delete",
        "payments:view",
        "translations:view", "translations:trigger",
        "settings:view",
        "reports:view",
    ],
}


# ── Vérification des permissions ──────────────────────────────
def check_permission(user: User, permission: str) -> bool:
    """Vérifie si un utilisateur a une permission donnée."""
    if getattr(user, 'role', None) == 'superadmin':
        return True  # Super admin a tout
    if not getattr(user, 'is_admin', False):
        return False
    user_perms = getattr(user, 'permissions', []) or []
    return permission in user_perms


def require_permission(permission: str):
    """Dépendance FastAPI pour vérifier une permission."""
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if not check_permission(current_user, permission):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail=f"Permission requise : {permission}"
            )
        return current_user
    return checker


def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """Dépendance : super admin uniquement."""
    if getattr(current_user, 'role', None) != 'superadmin':
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès super admin requis")
    return current_user


def require_any_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dépendance : admin ou super admin."""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès admin requis")
    return current_user


# ── Logging d'audit ───────────────────────────────────────────
async def audit_log(
    db: AsyncSession,
    admin: User,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None,
    result_status: str = "success",
):
    """Enregistre une action admin dans le journal d'audit."""
    ip = None
    ua = None
    if request:
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent")

    log = AdminAuditLog(
        id=uuid.uuid4(),
        admin_id=admin.id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        details=details or {},
        ip_address=ip,
        user_agent=ua,
        status=result_status,
    )
    db.add(log)
    await db.commit()


# ── Gestion des sessions admin ────────────────────────────────
async def create_admin_session(
    db: AsyncSession,
    admin: User,
    request: Optional[Request] = None,
) -> AdminSession:
    """Crée une session admin lors de la connexion."""
    ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None

    session = AdminSession(
        id=uuid.uuid4(),
        admin_id=admin.id,
        ip_address=ip,
        user_agent=ua,
        is_active=True,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def close_admin_session(
    db: AsyncSession,
    admin_id: uuid.UUID,
):
    """Ferme la session active d'un admin."""
    from sqlalchemy import update
    from datetime import datetime, timezone

    result = await db.execute(
        select(AdminSession)
        .where(AdminSession.admin_id == admin_id, AdminSession.is_active == True)
        .order_by(AdminSession.login_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()
    if session:
        now = datetime.now(timezone.utc)
        duration = int((now - session.login_at).total_seconds())
        session.logout_at = now
        session.duration_seconds = duration
        session.is_active = False
        await db.commit()