from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.security import decode_token
from app.models.models import User

bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_id = decode_token(credentials.credentials, expected_type="access")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    await db.refresh(user)
    return user


async def get_current_student(
    current_user: User = Depends(get_current_user),
) -> User:
    """Accessible par tous les utilisateurs actifs (student, admin, superadmin)."""
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Accessible uniquement par admin et superadmin."""
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Accès admin requis"
        )
    return current_user


async def get_current_superadmin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Accessible uniquement par superadmin."""
    if current_user.role != "superadmin":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Accès superadmin requis"
        )
    return current_user


def require_role(*roles: str):
    """
    Dépendance paramétrable pour les cas spéciaux.
    Usage : Depends(require_role("admin", "superadmin"))
    """
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail=f"Rôle requis : {' | '.join(roles)}"
            )
        return current_user
    return checker