"""
LangDad — Seed Module 10 : مُرَاجَعَةٌ
========================================
Usage :
    cd backend
    python seed_module10.py
    python seed_module10.py --reset
"""

import asyncio, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import AsyncSessionLocal
from app.models.models import Module, Course, Lesson
from sqlalchemy import select, delete, text

CONTENT_FILE = Path(__file__).parent / "module10_content.json"


async def seed(reset: bool = False):
    if not CONTENT_FILE.exists():
        print(f"[ERREUR] {CONTENT_FILE} introuvable.")
        return

    with open(CONTENT_FILE, encoding="utf-8") as f:
        data = json.load(f)

    mod_data     = data["module"]
    lessons_data = data["lessons"]

    async with AsyncSessionLocal() as db:

        if reset:
            existing = await db.get(Module, mod_data["id"])
            if existing:
                courses = await db.execute(select(Course).where(Course.module_id == mod_data["id"]))
                for c in courses.scalars().all():
                    await db.execute(delete(Lesson).where(Lesson.course_id == c.id))
                await db.execute(delete(Course).where(Course.module_id == mod_data["id"]))
                await db.delete(existing)
                await db.commit()
                print(f"[RESET] Module {mod_data['id']} supprimé.")

        existing = await db.get(Module, mod_data["id"])
        if existing and not reset:
            print(f"[INFO] Module {mod_data['id']} existe déjà. Utilisez --reset.")
            return

        module = Module(
            id=mod_data["id"], slug=mod_data["slug"], title=mod_data["title"],
            description=mod_data["description"], arabic_ratio=mod_data["arabic_ratio"],
            is_premium=mod_data["is_premium"], sort_order=mod_data["sort_order"],
        )
        db.add(module)
        await db.flush()

        # Lier à la Partie 1
        await db.execute(text("UPDATE modules SET part_id = 1 WHERE id = :id"), {"id": module.id})

        course = Course(module_id=module.id, title=mod_data["title"], sort_order=1)
        db.add(course)
        await db.flush()
        print(f"[OK] Module créé : {module.title}")

        for les in lessons_data:
            lesson = Lesson(
                course_id=course.id, title=les["title"], lesson_type=les["lesson_type"],
                xp_reward=les["xp_reward"], duration_minutes=les["duration_minutes"],
                sort_order=les["sort_order"], content=les["content"],
            )
            db.add(lesson)
            n = len(les["content"].get("exercises", []))
            print(f"  [OK] Leçon {les['sort_order']}: {les['title']} ({n} exercices)")

        await db.commit()
        print(f"\n[✓] Module 10 seedé — 3 leçons · 35 exercices · 125 XP")


if __name__ == "__main__":
    asyncio.run(seed("--reset" in sys.argv))