"""
LangDad — Seed Module générique
================================
Insère un module complet en base depuis un fichier JSON.

Usage :
    cd backend
    python seed_module.py --module 1 --degree 1
    python seed_module.py --module 1 --degree 1 --reset   # supprime et recrée
    python seed_module.py --module 1 --degree 1 --update  # met à jour le contenu sans toucher aux progressions

Fichiers attendus dans :
    backend/curriculum/d{degree}/module{module}_d{degree}_content.json
"""

import asyncio
import json
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import AsyncSessionLocal
from app.models.models import Module, Course, Lesson, LessonProgress, ExerciseLog, Certification
from sqlalchemy import select, delete, update


def get_content_file(module: int, degree: int) -> Path:
    return (
        Path(__file__).parent
        / "curriculum"
        / f"d{degree}"
        / f"module{module}_d{degree}_content.json"
    )


async def seed(module: int, degree: int, reset: bool = False, update_mode: bool = False):
    content_file = get_content_file(module, degree)

    if not content_file.exists():
        print(f"[ERREUR] Fichier introuvable : {content_file}")
        print(f"Placez le fichier dans backend/curriculum/d{degree}/")
        return

    with open(content_file, encoding="utf-8") as f:
        data = json.load(f)

    mod_data     = data["module"]
    lessons_data = data["lessons"]

    async with AsyncSessionLocal() as db:

        # ── Mode UPDATE ─────────────────────────────────────
        if update_mode:
            existing_mod = await db.get(Module, mod_data["id"])
            if not existing_mod:
                print(f"[ERREUR] Module {mod_data['id']} introuvable en DB.")
                print("         Lancez d'abord sans --update pour créer le module.")
                return

            # Mettre à jour les métadonnées du module
            existing_mod.title       = mod_data["title"]
            existing_mod.description = mod_data["description"]
            existing_mod.arabic_ratio= mod_data["arabic_ratio"]
            existing_mod.is_premium  = mod_data["is_premium"]
            existing_mod.sort_order  = mod_data["sort_order"]
            existing_mod.part_id     = mod_data.get("part_id")
            existing_mod.degree      = mod_data.get("degree", 1)
            existing_mod.degree_name = mod_data.get("degree_name")
            print(f"[UPDATE] Module mis à jour : {existing_mod.title}")

            # Récupérer le cours du module
            courses_res = await db.execute(
                select(Course).where(Course.module_id == mod_data["id"])
            )
            course = courses_res.scalars().first()
            if not course:
                print(f"[ERREUR] Aucun cours trouvé pour le module {mod_data['id']}.")
                return

            # Récupérer les leçons existantes
            lessons_res = await db.execute(
                select(Lesson).where(Lesson.course_id == course.id)
                .order_by(Lesson.sort_order)
            )
            existing_lessons = {l.sort_order: l for l in lessons_res.scalars().all()}

            updated = 0
            added   = 0

            for les_data in lessons_data:
                sort_order = les_data["sort_order"]

                if sort_order in existing_lessons:
                    # Leçon existante → mettre à jour uniquement le contenu
                    lesson = existing_lessons[sort_order]
                    lesson.title            = les_data["title"]
                    lesson.lesson_type      = les_data["lesson_type"]
                    lesson.xp_reward        = les_data["xp_reward"]
                    lesson.duration_minutes = les_data["duration_minutes"]
                    lesson.content          = les_data["content"]
                    n_ex = len(les_data["content"].get("exercises", []))
                    print(f"  [UPDATE] Leçon {sort_order}: {les_data['title']} ({n_ex} exercices)")
                    updated += 1
                else:
                    # Nouvelle leçon → l'ajouter
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
                    print(f"  [ADD]    Leçon {sort_order}: {les_data['title']} ({n_ex} exercices) ← NOUVELLE")
                    added += 1

            await db.commit()
            print(f"\n[✓] Module {module} Degré {degree} mis à jour !")
            print(f"    → {updated} leçons mises à jour · {added} leçons ajoutées")
            print(f"    → Progressions élèves : INTACTES ✅")
            await _show_stats(db, mod_data["id"])
            return

        # ── Mode RESET ──────────────────────────────────────
        if reset:
            existing_mod = await db.get(Module, mod_data["id"])
            if existing_mod:
                courses_res = await db.execute(
                    select(Course).where(Course.module_id == mod_data["id"])
                )
                courses = courses_res.scalars().all()

                for course in courses:
                    lessons_res = await db.execute(
                        select(Lesson).where(Lesson.course_id == course.id)
                    )
                    lessons    = lessons_res.scalars().all()
                    lesson_ids = [l.id for l in lessons]

                    if lesson_ids:
                        try:
                            await db.execute(
                                delete(ExerciseLog).where(ExerciseLog.lesson_id.in_(lesson_ids))
                            )
                            print(f"[RESET] exercise_log supprimés pour {len(lesson_ids)} leçons.")
                        except Exception as e:
                            print(f"[WARN] exercise_log : {e}")

                        try:
                            await db.execute(
                                delete(LessonProgress).where(LessonProgress.lesson_id.in_(lesson_ids))
                            )
                            print(f"[RESET] lesson_progress supprimés.")
                        except Exception as e:
                            print(f"[WARN] lesson_progress : {e}")

                    await db.execute(delete(Lesson).where(Lesson.course_id == course.id))

                await db.execute(delete(Course).where(Course.module_id == mod_data["id"]))

                try:
                    await db.execute(
                        delete(Certification).where(Certification.module_id == mod_data["id"])
                    )
                    print(f"[RESET] certifications supprimées.")
                except Exception as e:
                    print(f"[WARN] certifications : {e}")

                await db.delete(existing_mod)
                await db.commit()
                print(f"[RESET] Module {mod_data['id']} supprimé complètement.\n")
            else:
                print(f"[RESET] Module {mod_data['id']} introuvable — rien à supprimer.\n")

        # ── Mode CREATE (défaut) ────────────────────────────
        existing = await db.get(Module, mod_data["id"])
        if existing and not reset:
            print(f"[INFO] Module {mod_data['id']} existe déjà.")
            print("       Utilisez --reset pour réinitialiser.")
            print("       Utilisez --update pour mettre à jour le contenu.")
            await _show_stats(db, mod_data["id"])
            return

        # Créer le module
        module_obj = Module(
            id           = mod_data["id"],
            slug         = mod_data["slug"],
            title        = mod_data["title"],
            description  = mod_data["description"],
            arabic_ratio = mod_data["arabic_ratio"],
            is_premium   = mod_data["is_premium"],
            sort_order   = mod_data["sort_order"],
            part_id      = mod_data.get("part_id"),
            degree       = mod_data.get("degree", 1),
            degree_name  = mod_data.get("degree_name"),
        )
        db.add(module_obj)
        await db.flush()
        print(f"[OK] Module créé : {module_obj.title}")

        # Créer le cours principal
        course = Course(
            module_id  = module_obj.id,
            title      = mod_data["title"],
            sort_order = 1,
        )
        db.add(course)
        await db.flush()
        print(f"[OK] Cours créé : {course.title}")

        # Créer les leçons
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
        print(f"\n[✓] Module {module} Degré {degree} seedé avec succès !")
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
    parser = argparse.ArgumentParser(description="Seed d'un module LangDad")
    parser.add_argument("--module", type=int, required=True, help="Numéro du module (ex: 1)")
    parser.add_argument("--degree", type=int, required=True, help="Degré (ex: 1)")
    parser.add_argument("--reset",  action="store_true", help="Supprimer et recréer le module")
    parser.add_argument("--update", action="store_true", help="Mettre à jour le contenu sans toucher aux progressions")
    args = parser.parse_args()

    if args.reset and args.update:
        print("[ERREUR] --reset et --update sont incompatibles.")
        sys.exit(1)

    if args.reset:
        print(f"Mode RESET — Module {args.module} Degré {args.degree} sera supprimé et recréé.\n")
    elif args.update:
        print(f"Mode UPDATE — Contenu mis à jour, progressions élèves préservées.\n")

    asyncio.run(seed(args.module, args.degree, args.reset, args.update))