"""
Script pour promouvoir un utilisateur en admin.
Usage : python make_admin.py test@example.com
"""
import asyncio
import sys
from app.db.session import AsyncSessionLocal
from app.models.models import User
from sqlalchemy import update, select


async def make_admin(email: str):
    async with AsyncSessionLocal() as db:
        # Vérifie que l'utilisateur existe
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            print(f"[ERREUR] Aucun utilisateur avec l'email : {email}")
            return

        # Promeut en admin
        await db.execute(
            update(User)
            .where(User.email == email)
            .values(is_admin=True)
        )
        await db.commit()
        print(f"[OK] {email} est maintenant administrateur.")
        print(f"     Username : {user.username}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage : python make_admin.py <email>")
        print("Exemple : python make_admin.py test@example.com")
        sys.exit(1)

    email = sys.argv[1]
    asyncio.run(make_admin(email))