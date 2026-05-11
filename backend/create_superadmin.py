"""
Script pour créer ou promouvoir un superadmin.

Usage :
    python create_superadmin.py
    python create_superadmin.py --email mon@email.com --username monadmin --password MonPass123!
    python create_superadmin.py --promote --email user@existant.com
"""

import asyncio
import argparse
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.models import User
from app.core.security import hash_password
from sqlalchemy import select
import uuid


async def create_or_promote_superadmin(
    email: str,
    username: str,
    password: str,
    promote_only: bool = False,
):
    async with AsyncSessionLocal() as db:

        # Vérifier si l'utilisateur existe déjà
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()

        if existing:
            if existing.role == "superadmin":
                print(f"[INFO] {email} est déjà superadmin.")
                return

            # Promouvoir en superadmin
            existing.role        = "superadmin"
            existing.is_admin    = True
            existing.is_active   = True
            existing.is_verified = True
            existing.permissions = []
            await db.commit()
            print(f"[OK] {email} promu superadmin.")

        elif promote_only:
            print(f"[ERREUR] Utilisateur introuvable : {email}")
            print("         Retirez --promote pour créer un nouveau superadmin.")
            sys.exit(1)

        else:
            # Vérifier si le username est déjà pris
            result2 = await db.execute(select(User).where(User.username == username))
            if result2.scalar_one_or_none():
                print(f"[ERREUR] Username déjà utilisé : {username}")
                sys.exit(1)

            superadmin = User(
                id              = uuid.uuid4(),
                email           = email,
                username        = username,
                hashed_password = hash_password(password),
                is_admin        = True,
                is_active       = True,
                is_verified     = True,
                role            = "superadmin",
                permissions     = [],
            )
            db.add(superadmin)
            await db.commit()

            print(f"\n[OK] Superadmin créé avec succès !")
            print(f"     Email    : {email}")
            print(f"     Username : {username}")
            print(f"     Password : {password}")
            print(f"\n[!] Changez le mot de passe après la première connexion.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Créer ou promouvoir un superadmin LangDad")
    parser.add_argument("--email",    default="superadmin@langdad.com", help="Email du superadmin")
    parser.add_argument("--username", default="superadmin",             help="Nom d'utilisateur")
    parser.add_argument("--password", default="SuperAdmin2024!",        help="Mot de passe initial")
    parser.add_argument("--promote",  action="store_true",              help="Promouvoir un utilisateur existant")
    args = parser.parse_args()

    asyncio.run(create_or_promote_superadmin(
        email        = args.email,
        username     = args.username,
        password     = args.password,
        promote_only = args.promote,
    ))