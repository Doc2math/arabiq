"""
PATCH à appliquer dans app/models/models.py
Ajoutez ces 2 champs dans la classe User, après is_verified :

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Champs Admin ──────────────────────────────────────────
    role: Mapped[str] = mapped_column(String(20), default="student")
    # Valeurs possibles : "student" | "admin" | "superadmin"
    permissions: Mapped[list] = mapped_column(JSON, default=list)
    # Ex: ["content:create", "users:view"]
    # ── Fin champs Admin ──────────────────────────────────────

    created_at: Mapped[datetime] = ...
"""

# Script pour créer le superadmin initial
# Placez-le dans backend/create_superadmin.py et exécutez :
# python create_superadmin.py

import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.models import User
from app.core.security import hash_password
import uuid


async def create_superadmin():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        
        email = "superadmin@arabiq.com"
        
        # Vérifier si existe déjà
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        
        if existing:
            # Mettre à jour le rôle
            existing.role = "superadmin"
            existing.is_admin = True
            existing.permissions = []  # superadmin a tout sans permissions explicites
            await db.commit()
            print(f"✓ Superadmin mis à jour : {email}")
        else:
            superadmin = User(
                id=uuid.uuid4(),
                email=email,
                username="superadmin",
                hashed_password=hash_password("SuperAdmin2024!"),
                is_admin=True,
                is_active=True,
                is_verified=True,
                role="superadmin",
                permissions=[],
            )
            db.add(superadmin)
            await db.commit()
            print(f"✓ Superadmin créé : {email}")
            print(f"  Mot de passe : SuperAdmin2024!")
            print(f"  ⚠ Changez le mot de passe après la première connexion !")


if __name__ == "__main__":
    asyncio.run(create_superadmin())