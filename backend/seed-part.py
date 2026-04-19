"""
LangDad — Seed des 5 parties du cours
======================================
Crée les 5 parties thématiques et lie les 9 modules existants à la Partie 1.

Usage :
    cd backend
    python seed_parts.py

    # Pour réinitialiser :
    python seed_parts.py --reset
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import AsyncSessionLocal
from app.models.models import Module
from sqlalchemy import text, select


PARTS = [
    {
        "id":          1,
        "slug":        "alphabet-ecriture",
        "title":       "Alphabet et écriture",
        "description": "Maîtrisez les 28 lettres arabes, leurs formes, leurs sons et les règles d'écriture fondamentales.",
        "theme":       "Alphabet",
        "sort_order":  1,
    },
    {
        "id":          2,
        "slug":        "lecture-base",
        "title":       "Lecture de base",
        "description": "Apprenez à lire des mots et phrases simples avec harakat, puis progressivement sans voyelles.",
        "theme":       "Lecture",
        "sort_order":  2,
    },
    {
        "id":          3,
        "slug":        "vocabulaire-fondamental",
        "title":       "Vocabulaire fondamental",
        "description": "Acquérez les 500 mots les plus fréquents de l'arabe courant et du Coran.",
        "theme":       "Vocabulaire",
        "sort_order":  3,
    },
    {
        "id":          4,
        "slug":        "grammaire-base",
        "title":       "Grammaire de base",
        "description": "Comprenez les règles essentielles : genre, nombre, cas, verbes au présent et au passé.",
        "theme":       "Grammaire",
        "sort_order":  4,
    },
    {
        "id":          5,
        "slug":        "comprehension-expression",
        "title":       "Compréhension et expression",
        "description": "Lisez des textes arabes authentiques et exprimez-vous à l'oral et à l'écrit.",
        "theme":       "Expression",
        "sort_order":  5,
    },
]

# Les 9 modules actuels appartiennent tous à la Partie 1
MODULES_PART1 = [1, 2, 3, 4, 5, 6, 7, 8, 9]


async def seed(reset: bool = False):
    async with AsyncSessionLocal() as db:

        # ── Reset si demandé ────────────────────────────────
        if reset:
            await db.execute(text("UPDATE modules SET part_id = NULL"))
            await db.execute(text("DELETE FROM parts"))
            await db.commit()
            print("[RESET] Parties supprimées.")

        # ── Créer les 5 parties ─────────────────────────────
        for p in PARTS:
            existing = await db.execute(
                text("SELECT id FROM parts WHERE id = :id"), {"id": p["id"]}
            )
            if existing.fetchone():
                print(f"[INFO] Partie {p['id']} existe déjà : {p['title']}")
                continue

            await db.execute(text("""
                INSERT INTO parts (id, slug, title, description, theme, sort_order)
                VALUES (:id, :slug, :title, :description, :theme, :sort_order)
            """), p)
            print(f"[OK] Partie {p['id']} créée : {p['title']}")

        await db.commit()

        # ── Lier les 9 modules à la Partie 1 ───────────────
        for module_id in MODULES_PART1:
            mod = await db.get(Module, module_id)
            if mod:
                await db.execute(
                    text("UPDATE modules SET part_id = 1 WHERE id = :id"),
                    {"id": module_id}
                )
                print(f"  [OK] Module {module_id} lié à Partie 1")
            else:
                print(f"  [SKIP] Module {module_id} absent en base")

        await db.commit()

        # ── Résumé ──────────────────────────────────────────
        print("\n[✓] Seed des parties terminé !")
        result = await db.execute(text("""
            SELECT p.title, COUNT(m.id) as nb_modules
            FROM parts p
            LEFT JOIN modules m ON m.part_id = p.id
            GROUP BY p.id
            ORDER BY p.sort_order
        """))
        for row in result.fetchall():
            print(f"    {row[0]} → {row[1]} module(s)")


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    if reset:
        print("Mode RESET — les parties seront supprimées et recréées.\n")
    asyncio.run(seed(reset=reset))