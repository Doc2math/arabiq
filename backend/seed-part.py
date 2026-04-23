"""
Script pour créer les 6 parties du curriculum
Placez dans backend/ et exécutez : python seed_parts.py
"""

import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.models import Part, Module
from sqlalchemy import select

PARTS = [
    {
        "number": 1, "degree": 1,
        "title": "Partie 1 — Les fondations",
        "description": "Découverte de l'alphabet arabe, des voyelles et des premiers mots. Les 4 lettres de base : م ك ت ب",
        "color": "#6C3FC5", "icon": "🌱", "sort_order": 1, "is_premium": False,
    },
    {
        "number": 2, "degree": 2,
        "title": "Partie 2 — L'alphabet complet",
        "description": "Toutes les lettres de l'alphabet arabe, leurs positions et leurs formes.",
        "color": "#F07C1E", "icon": "📖", "sort_order": 2, "is_premium": False,
    },
    {
        "number": 3, "degree": 3,
        "title": "Partie 3 — La lecture courante",
        "description": "Lecture de textes courts, phrases complexes et vocabulaire élargi.",
        "color": "#2BA84A", "icon": "📝", "sort_order": 3, "is_premium": True,
    },
    {
        "number": 4, "degree": 4,
        "title": "Partie 4 — La grammaire",
        "description": "Bases de la grammaire arabe : genre, nombre, cas grammaticaux.",
        "color": "#1976D2", "icon": "🎯", "sort_order": 4, "is_premium": True,
    },
    {
        "number": 5, "degree": 5,
        "title": "Partie 5 — L'expression",
        "description": "Expression orale et écrite, conjugaison, phrases complexes.",
        "color": "#9C27B0", "icon": "💬", "sort_order": 5, "is_premium": True,
    },
    {
        "number": 6, "degree": 6,
        "title": "Partie 6 — La maîtrise",
        "description": "Textes littéraires, coraniques et journalistiques. Niveau avancé.",
        "color": "#F9A825", "icon": "🏆", "sort_order": 6, "is_premium": True,
    },
]

async def seed():
    async with AsyncSessionLocal() as db:
        # Vérifier si déjà seedé
        result = await db.execute(select(Part))
        existing = result.scalars().all()
        if existing:
            print(f"✓ {len(existing)} parties déjà présentes")
        else:
            for p in PARTS:
                part = Part(**p)
                db.add(part)
            await db.commit()
            print(f"✓ {len(PARTS)} parties créées")

        # Associer Module 1 à Partie 1
        result = await db.execute(select(Part).where(Part.number == 1))
        part1 = result.scalar_one_or_none()
        if part1:
            result = await db.execute(select(Module).where(Module.id == 1))
            mod1 = result.scalar_one_or_none()
            if mod1 and mod1.part_id is None:
                mod1.part_id = part1.id
                await db.commit()
                print(f"✓ Module 1 associé à Partie 1")

        print("\nParties disponibles :")
        result = await db.execute(select(Part).order_by(Part.sort_order))
        parts = result.scalars().all()
        for p in parts:
            print(f"  {p.icon} Partie {p.number} — {p.title}")

if __name__ == "__main__":
    asyncio.run(seed())