"""
LangDad — Migration : ajout de la table 'parts'
================================================
Ajoute :
  - Table parts (id, slug, title, description, theme, sort_order, is_active)
  - Colonne part_id dans modules (FK nullable → parts.id)

Usage :
    cd backend
    python migration_parts.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import AsyncSessionLocal
from sqlalchemy import text


async def migrate():
    async with AsyncSessionLocal() as db:

        # ── Créer la table parts ────────────────────────────
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS parts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                slug        VARCHAR(50)  NOT NULL UNIQUE,
                title       VARCHAR(200) NOT NULL,
                description TEXT         NOT NULL DEFAULT '',
                theme       VARCHAR(100) NOT NULL DEFAULT '',
                sort_order  INTEGER      NOT NULL DEFAULT 1,
                is_active   BOOLEAN      NOT NULL DEFAULT 1,
                created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("[OK] Table 'parts' créée (ou déjà existante)")

        # ── Ajouter part_id dans modules ────────────────────
        # SQLite ne supporte pas ADD COLUMN avec FK directement
        # On vérifie d'abord si la colonne existe
        result = await db.execute(text("PRAGMA table_info(modules)"))
        columns = [row[1] for row in result.fetchall()]

        if 'part_id' not in columns:
            await db.execute(text("""
                ALTER TABLE modules ADD COLUMN part_id INTEGER REFERENCES parts(id)
            """))
            print("[OK] Colonne 'part_id' ajoutée dans 'modules'")
        else:
            print("[INFO] Colonne 'part_id' déjà présente dans 'modules'")

        await db.commit()
        print("\n[✓] Migration terminée !")


if __name__ == "__main__":
    asyncio.run(migrate())