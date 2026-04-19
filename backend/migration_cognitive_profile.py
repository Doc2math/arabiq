"""
Migration — Ajout colonnes profil cognitif au modèle User
=========================================================

Ajoutez ces colonnes dans app/models/models.py
dans la classe User, après is_verified :

    cognitive_profile  = Column(Text,    nullable=True)   # JSON du profil CAT
    placement_level    = Column(String,  nullable=True)   # ex: "débutant"
    placement_module   = Column(Integer, nullable=True)   # ex: 1
    placement_lesson   = Column(Integer, nullable=True)   # ex: 5
    diagnostic_done    = Column(Boolean, default=False)   # a fait le diagnostic ?
    skill_vector       = Column(Text,    nullable=True)   # JSON vecteur BKT

Et dans le schéma UserRead (app/schemas/auth.py) :
    cognitive_profile:  Optional[str]  = None
    placement_level:    Optional[str]  = None
    placement_module:   Optional[int]  = None
    placement_lesson:   Optional[int]  = None
    diagnostic_done:    bool           = False

Pour la migration Alembic :
    alembic revision --autogenerate -m "add_cognitive_profile"
    alembic upgrade head

Ou directement via SQLite (dev) :
    ALTER TABLE users ADD COLUMN cognitive_profile TEXT;
    ALTER TABLE users ADD COLUMN placement_level VARCHAR;
    ALTER TABLE users ADD COLUMN placement_module INTEGER;
    ALTER TABLE users ADD COLUMN placement_lesson INTEGER;
    ALTER TABLE users ADD COLUMN diagnostic_done BOOLEAN DEFAULT 0;
    ALTER TABLE users ADD COLUMN skill_vector TEXT;
"""

# Script d'application directe sur SQLite (dev seulement)
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "arabiq.db"

COLUMNS = [
    ("cognitive_profile", "TEXT"),
    ("placement_level",   "VARCHAR(50)"),
    ("placement_module",  "INTEGER"),
    ("placement_lesson",  "INTEGER"),
    ("diagnostic_done",   "BOOLEAN DEFAULT 0"),
    ("skill_vector",      "TEXT"),
]

def apply():
    if not DB_PATH.exists():
        print(f"[ERREUR] Base introuvable : {DB_PATH}")
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    existing = {row[1] for row in cursor.fetchall()}
    added = []
    for col_name, col_type in COLUMNS:
        if col_name not in existing:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            added.append(col_name)
    conn.commit()
    conn.close()
    if added:
        print(f"[OK] Colonnes ajoutées : {', '.join(added)}")
    else:
        print("[OK] Toutes les colonnes existent déjà.")

if __name__ == "__main__":
    apply()