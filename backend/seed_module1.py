"""
LangDad — Seed Module 1 : مَكْتَبٌ
=====================================
Insère le Module 1 complet (module + cours + 7 leçons + exercices) en base.

Usage :
    cd backend
    python seed_module1.py

    # Pour réinitialiser (supprimer et recréer) :
    python seed_module1.py --reset
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import AsyncSessionLocal
from app.models.models import Module, Course, Lesson
from sqlalchemy import select, delete

# Chercher le JSON dans le même dossier que le script
CONTENT_FILE = Path(__file__).parent / "module1_content.json"


async def seed(reset: bool = False):
    if not CONTENT_FILE.exists():
        print(f"[ERREUR] Fichier introuvable : {CONTENT_FILE}")
        print("Placez module1_content.json dans le dossier backend/")
        return

    with open(CONTENT_FILE, encoding="utf-8") as f:
        data = json.load(f)

    mod_data     = data["module"]
    lessons_data = data["lessons"]

    async with AsyncSessionLocal() as db:

        # ── Reset si demandé ────────────────────────────────
        if reset:
            existing_mod = await db.get(Module, mod_data["id"])
            if existing_mod:
                courses_res = await db.execute(select(Course).where(Course.module_id == mod_data["id"]))
                for course in courses_res.scalars().all():
                    await db.execute(delete(Lesson).where(Lesson.course_id == course.id))
                await db.execute(delete(Course).where(Course.module_id == mod_data["id"]))
                await db.delete(existing_mod)
                await db.commit()
                print(f"[RESET] Module {mod_data['id']} supprimé.")

        # ── Vérifier si le module existe déjà ──────────────
        existing = await db.get(Module, mod_data["id"])
        if existing and not reset:
            print(f"[INFO] Module {mod_data['id']} existe déjà.")
            print("       Utilisez --reset pour réinitialiser.")
            await _show_stats(db, mod_data["id"])
            return

        # ── Créer le module ─────────────────────────────────
        module = Module(
            id           = mod_data["id"],
            slug         = mod_data["slug"],
            title        = mod_data["title"],
            description  = mod_data["description"],
            arabic_ratio = mod_data["arabic_ratio"],
            is_premium   = mod_data["is_premium"],
            sort_order   = mod_data["sort_order"],
        )
        db.add(module)
        await db.flush()
        print(f"[OK] Module créé : {module.title}")

        # ── Créer le cours principal ────────────────────────
        course = Course(
            module_id  = module.id,
            title      = mod_data["title"],
            sort_order = 1,
        )
        db.add(course)
        await db.flush()
        print(f"[OK] Cours créé : {course.title}")

        # ── Créer les 7 leçons ──────────────────────────────
        for les_data in lessons_data:
            lesson = Lesson(
                course_id        = course.id,
                title            = les_data["title"],
                lesson_type      = les_data["lesson_type"],
                xp_reward        = les_data["xp_reward"],
                duration_minutes = les_data["duration_minutes"],
                sort_order       = les_data["sort_order"],
                content          = les_data["content"],
            )
            db.add(lesson)
            n_ex = len(les_data["content"].get("exercises", []))
            print(f"  [OK] Leçon {les_data['sort_order']}: {les_data['title']} ({n_ex} exercices)")

        await db.commit()

        print(f"\n[✓] Module 1 seedé avec succès !")
        await _show_stats(db, mod_data["id"])


async def _show_stats(db, module_id: int):
    courses_res = await db.execute(select(Course).where(Course.module_id == module_id))
    total_lessons = 0
    total_ex = 0
    for c in courses_res.scalars().all():
        lessons_res = await db.execute(select(Lesson).where(Lesson.course_id == c.id))
        for l in lessons_res.scalars().all():
            total_lessons += 1
            total_ex += len((l.content or {}).get("exercises", []))
    print(f"    → {total_lessons} leçons · {total_ex} exercices au total")


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    if reset:
        print("Mode RESET — le module existant sera supprimé et recréé.\n")
    asyncio.run(seed(reset=reset))