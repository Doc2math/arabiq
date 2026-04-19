"""
Migration BKT — LangDad
========================
1. Ajoute la table interaction_logs (dataset DKT)
2. Le champ skill_vector dans users existe déjà (migration précédente)

Lancer : python migration_bkt.py
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "arabiq.db"

CREATE_INTERACTION_LOGS = """
CREATE TABLE IF NOT EXISTS interaction_logs (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    skill_id     TEXT NOT NULL,
    correct      INTEGER NOT NULL,
    latency_ms   INTEGER NOT NULL,
    p_before     REAL NOT NULL,
    p_after      REAL NOT NULL,
    exercise_id  TEXT,
    module_id    INTEGER NOT NULL DEFAULT 1,
    timestamp    REAL NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_intlog_user ON interaction_logs(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_intlog_skill ON interaction_logs(skill_id);",
    "CREATE INDEX IF NOT EXISTS idx_intlog_ts ON interaction_logs(timestamp);",
]

def apply():
    if not DB_PATH.exists():
        print(f"[ERREUR] Base introuvable : {DB_PATH}")
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(CREATE_INTERACTION_LOGS)
    for idx in CREATE_INDEXES:
        cursor.execute(idx)
    conn.commit()
    conn.close()
    print("[OK] Table interaction_logs créée avec indexes.")
    print("[OK] Migration BKT terminée.")

if __name__ == "__main__":
    apply()