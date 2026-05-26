"""
export_dataset.py — Export du dataset LangDad pour publication/DKT
Usage : python export_dataset.py --output ./dataset --format both

Génère :
  - interactions.csv / interactions.json
  - students.csv / students.json
  - exercises.csv / exercises.json
  - skills.csv / skills.json
  - README.md
"""

import asyncio
import argparse
import csv
import json
import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Anonymisation ─────────────────────────────────────────────
def anonymize_id(user_id: str, salt: str = "langdad_2026") -> str:
    """Hash irréversible de l'UUID utilisateur."""
    return hashlib.sha256(f"{salt}:{user_id}".encode()).hexdigest()[:16]

# ── Métadonnées des compétences ───────────────────────────────
SKILLS = [
    {"skill_id": "letter_recognition",  "skill_name": "Letter Recognition",  "module": 1, "degree": 1, "category": "phonetics"},
    {"skill_id": "harakat_reading",     "skill_name": "Harakat Reading",      "module": 1, "degree": 1, "category": "phonetics"},
    {"skill_id": "long_vowels",         "skill_name": "Long Vowels",          "module": 1, "degree": 1, "category": "phonetics"},
    {"skill_id": "tanwin",              "skill_name": "Tanwin",               "module": 1, "degree": 1, "category": "phonetics"},
    {"skill_id": "letter_positions",    "skill_name": "Letter Positions",     "module": 1, "degree": 1, "category": "morphology"},
    {"skill_id": "word_reading",        "skill_name": "Word Reading",         "module": 1, "degree": 1, "category": "reading"},
    {"skill_id": "word_comprehension",  "skill_name": "Word Comprehension",   "module": 1, "degree": 1, "category": "comprehension"},
    {"skill_id": "word_writing",        "skill_name": "Word Writing",         "module": 1, "degree": 1, "category": "writing"},
    {"skill_id": "word_building",       "skill_name": "Word Building",        "module": 1, "degree": 1, "category": "morphology"},
    {"skill_id": "sentence_reading",    "skill_name": "Sentence Reading",     "module": 1, "degree": 1, "category": "reading"},
]

EXERCISE_TYPES = {
    "mcq":                 "Multiple Choice Question",
    "audio_choice":        "Audio-based Multiple Choice",
    "input_text":          "Text Input",
    "drag_drop":           "Drag and Drop",
    "word_order":          "Word Ordering",
    "matching":            "Text Matching",
    "matching_image_word": "Image-Word Matching",
    "matching_text_audio": "Text-Audio Matching",
    "drawing":             "Letter Drawing",
    "oral_reading":        "Oral Reading",
}

async def export_dataset(output_dir: str, fmt: str):
    """Export principal depuis PostgreSQL."""
    import asyncpg

    db_url = os.getenv("DATABASE_URL", "postgresql://localhost/langdad")
    # asyncpg utilise postgresql:// pas postgresql+asyncpg://
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql+psycopg2://", "postgresql://")

    print(f"Connexion à la base de données...")
    conn = await asyncpg.connect(db_url)

    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    export_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # ── 1. Interactions ──────────────────────────────────────
    print("Export des interactions...")
    rows = await conn.fetch("""
        SELECT 
            el.id,
            el.user_id,
            el.lesson_id,
            el.exercise_id,
            el.skill_id,
            el.exercise_type,
            el.variant,
            el.correct,
            el.response_time_ms,
            el.hint_used,
            el.attempt,
            el.created_at,
            l.lesson_type,
            c.module_id
        FROM exercise_log el
        LEFT JOIN lessons l ON el.lesson_id = l.id
        LEFT JOIN courses c ON l.course_id = c.id
        ORDER BY el.created_at
    """)

    interactions = []
    student_ids  = set()

    for r in rows:
        anon_id = anonymize_id(str(r["user_id"]))
        student_ids.add((str(r["user_id"]), anon_id))
        interactions.append({
            "interaction_id":    str(r["id"]),
            "student_id":        anon_id,
            "timestamp":         r["created_at"].isoformat(),
            "lesson_id":         r["lesson_id"],
            "exercise_id":       r["exercise_id"],
            "skill_id":          r["skill_id"],
            "exercise_type":     r["exercise_type"],
            "variant":           r["variant"],
            "correct":           int(r["correct"]),
            "response_time_ms":  r["response_time_ms"],
            "hint_used":         int(r["hint_used"]) if r["hint_used"] is not None else 0,
            "attempt":           r["attempt"],
            "lesson_type":       r["lesson_type"],
            "module_id":         r["module_id"],
        })

    _save(output, "interactions", interactions, fmt)
    print(f"  → {len(interactions)} interactions exportées")

    # ── 2. Students ──────────────────────────────────────────
    print("Export des élèves (anonymisés)...")
    if student_ids:
        user_uuid_list = [uid for uid, _ in student_ids]
        users = await conn.fetch("""
            SELECT id, native_language, level, created_at
            FROM users
            WHERE id = ANY($1::uuid[])
        """, user_uuid_list)

        anon_map = {str(uid): anon for uid, anon in student_ids}
        students = []
        for u in users:
            students.append({
                "student_id":      anon_map[str(u["id"])],
                "native_language": u["native_language"],
                "level":           u["level"],
                "created_at":      u["created_at"].isoformat(),
            })

        _save(output, "students", students, fmt)
        print(f"  → {len(students)} élèves exportés")

    # ── 3. Exercises ─────────────────────────────────────────
    print("Export des exercices...")
    exercise_ids = list({i["exercise_id"] for i in interactions})
    exercises = []
    for ex_id in exercise_ids:
        # Trouver le skill_id et le type depuis les interactions
        ex_ints = [i for i in interactions if i["exercise_id"] == ex_id]
        if ex_ints:
            exercises.append({
                "exercise_id":   ex_id,
                "skill_id":      ex_ints[0]["skill_id"],
                "exercise_type": ex_ints[0]["exercise_type"],
                "type_label":    EXERCISE_TYPES.get(ex_ints[0]["exercise_type"], ex_ints[0]["exercise_type"]),
                "module_id":     ex_ints[0]["module_id"],
                "n_interactions": len(ex_ints),
                "success_rate":  round(sum(i["correct"] for i in ex_ints) / len(ex_ints), 3),
            })

    _save(output, "exercises", exercises, fmt)
    print(f"  → {len(exercises)} exercices exportés")

    # ── 4. Skills ────────────────────────────────────────────
    print("Export des compétences...")
    _save(output, "skills", SKILLS, fmt)
    print(f"  → {len(SKILLS)} compétences exportées")

    # ── 5. README ────────────────────────────────────────────
    print("Génération du README...")
    readme = f"""# LangDad Arabic Learning Dataset

**Export date:** {export_date}
**Language:** Arabic (Modern Standard Arabic)
**Platform:** LangDad (https://langdad.com)
**License:** CC BY-NC-SA 4.0

## Description

This dataset contains anonymized learning interactions from the LangDad Arabic learning platform.
It covers Degree 1, Module 1: Arabic alphabet, short vowels (harakat), long vowels, tanwin, letter positions, basic vocabulary and sentences.

## Files

| File | Description | Rows |
|------|-------------|------|
| interactions.csv | Learning interactions (main file) | {len(interactions)} |
| students.csv | Anonymized student profiles | {len(students) if student_ids else 0} |
| exercises.csv | Exercise metadata | {len(exercises)} |
| skills.csv | Skills taxonomy | {len(SKILLS)} |

## Interactions Schema

| Column | Type | Description |
|--------|------|-------------|
| interaction_id | string | Unique interaction ID |
| student_id | string | Anonymized student ID (SHA256) |
| timestamp | datetime | UTC timestamp |
| lesson_id | int | Lesson ID |
| exercise_id | string | Exercise ID |
| skill_id | string | Knowledge component (skill) |
| exercise_type | string | Type of exercise |
| variant | int | Difficulty variant (1-4) |
| correct | int | 1 = correct, 0 = incorrect |
| response_time_ms | int | Response time in milliseconds |
| hint_used | int | 1 = hint used |
| attempt | int | Attempt number |
| lesson_type | string | Type of lesson |
| module_id | int | Module ID |

## Skills

| skill_id | Description |
|----------|-------------|
| letter_recognition | Identify Arabic letters م ك ت ب |
| harakat_reading | Read short vowels (fatha, kasra, damma) |
| long_vowels | Read long vowels ا و ي |
| tanwin | Read tanwin (nunation) |
| letter_positions | Identify letter forms (isolated, initial, medial, final) |
| word_reading | Read simple Arabic words |
| word_comprehension | Understand Arabic word meanings |
| word_writing | Write Arabic words |
| word_building | Construct words from letters |
| sentence_reading | Read and understand simple sentences |

## Exercise Types

| type | description |
|------|-------------|
{chr(10).join(f'| {k} | {v} |' for k, v in EXERCISE_TYPES.items())}

## Privacy

All student identifiers have been anonymized using SHA256 hashing with a salt.
No personally identifiable information (PII) is included in this dataset.

## Citation

If you use this dataset in your research, please cite:
```
@dataset{{langdad2026,
  title     = {{LangDad Arabic Learning Dataset}},
  author    = {{LangDad}},
  year      = {{2026}},
  url       = {{https://langdad.com}},
  license   = {{CC BY-NC-SA 4.0}}
}}
```

## Contact

contact@langdad.com
"""
    (output / "README.md").write_text(readme, encoding="utf-8")
    print("  → README.md généré")

    await conn.close()
    print(f"\n✅ Dataset exporté dans : {output_dir}/")
    print(f"   {len(interactions)} interactions | {len(students) if student_ids else 0} élèves | {len(exercises)} exercices")


def _save(output: Path, name: str, data: list, fmt: str):
    """Sauvegarde en CSV et/ou JSON."""
    if not data:
        return

    if fmt in ("csv", "both"):
        path = output / f"{name}.csv"
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)

    if fmt in ("json", "both"):
        path = output / f"{name}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export LangDad dataset")
    parser.add_argument("--output", default="./dataset", help="Dossier de sortie")
    parser.add_argument("--format", choices=["csv", "json", "both"], default="both", help="Format d'export")
    args = parser.parse_args()

    asyncio.run(export_dataset(args.output, args.format))