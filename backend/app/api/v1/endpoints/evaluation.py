from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.models import User, ExerciseLog
from app.api.deps import get_current_user
import json, random
from pathlib import Path

router = APIRouter(prefix="/curriculum", tags=["evaluation"])

# ── Chemins ──────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent.parent.parent.parent
CURR_DIR = BASE_DIR / "curriculum"

# ── Seuils BKT ───────────────────────────────────────────────
THRESHOLD_BASIC        = 0.5
THRESHOLD_INTERMEDIATE = 0.8
NB_BASIC               = 2
NB_INTERMEDIATE        = 1
MAX_EXERCISES          = 20
NB_ADVANCED            = 1

# ── Paramètres BKT ───────────────────────────────────────────
BKT_PARAMS = {
    "letter_recognition":  {"L0": 0.1,  "T": 0.3,  "G": 0.2,  "S": 0.1},
    "letter_writing":      {"L0": 0.1,  "T": 0.25, "G": 0.1,  "S": 0.15},
    "harakat_reading":     {"L0": 0.15, "T": 0.3,  "G": 0.25, "S": 0.1},
    "long_vowels":         {"L0": 0.15, "T": 0.3,  "G": 0.2,  "S": 0.1},
    "tanwin":              {"L0": 0.1,  "T": 0.25, "G": 0.2,  "S": 0.1},
    "letter_positions":    {"L0": 0.1,  "T": 0.3,  "G": 0.15, "S": 0.1},
    "word_reading":        {"L0": 0.2,  "T": 0.35, "G": 0.2,  "S": 0.1},
    "word_comprehension":  {"L0": 0.2,  "T": 0.35, "G": 0.2,  "S": 0.1},
    "word_writing":        {"L0": 0.1,  "T": 0.25, "G": 0.1,  "S": 0.15},
    "word_building":       {"L0": 0.15, "T": 0.3,  "G": 0.15, "S": 0.1},
    "sentence_reading":    {"L0": 0.05, "T": 0.2,  "G": 0.15, "S": 0.1},
}
DEFAULT_PARAMS = {"L0": 0.1, "T": 0.3, "G": 0.2, "S": 0.1}


# ── BKT update ───────────────────────────────────────────────
def bkt_update(p_mastery: float, correct: bool, params: dict) -> float:
    L, T, G, S = params["L0"], params["T"], params["G"], params["S"]
    if correct:
        p_evidence = p_mastery * (1 - S) + (1 - p_mastery) * G
        if p_evidence == 0: p_evidence = 1e-10
        p_l = (p_mastery * (1 - S)) / p_evidence
    else:
        p_evidence = p_mastery * S + (1 - p_mastery) * (1 - G)
        if p_evidence == 0: p_evidence = 1e-10
        p_l = (p_mastery * S) / p_evidence
    return p_l + (1 - p_l) * T


# ── Mastery depuis la DB ──────────────────────────────────────
async def get_mastery_map(user_id, db: AsyncSession) -> dict:
    result = await db.execute(
        select(ExerciseLog)
        .where(ExerciseLog.user_id == user_id)
        .order_by(ExerciseLog.created_at)
    )
    logs = result.scalars().all()
    mastery_map = {}
    for skill_id, params in BKT_PARAMS.items():
        p = params["L0"]
        for log in [l for l in logs if l.skill_id == skill_id]:
            p = bkt_update(p, log.correct, params)
        mastery_map[skill_id] = round(p, 4)
    return mastery_map


# ── Lecture banque statique ───────────────────────────────────
def load_evaluation_bank(degree: int, module_id: int) -> dict:
    bank_path = CURR_DIR / f"d{degree}" / f"evaluation_bank_m{module_id}.json"
    if not bank_path.exists():
        raise HTTPException(status_code=404, detail=f"Banque introuvable : module {module_id} degré {degree}")
    return json.loads(bank_path.read_text(encoding="utf-8"))


# ── Lecture contenu du module ─────────────────────────────────
def load_module_content(degree: int, module_id: int) -> dict:
    path = CURR_DIR / f"d{degree}" / f"module{module_id}_d{degree}_content.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


# ── Extraction des mots/lettres/phrases du module ─────────────
def extract_module_vocabulary(module_content: dict) -> dict:
    """Extrait tous les mots, lettres et phrases vus dans le module."""
    words    = []
    letters  = []
    phrases  = []
    seen_ar  = set()

    for lesson in module_content.get("lessons", []):
        intro = lesson.get("content", {}).get("introduction", {})

        for w in intro.get("words", []):
            if w.get("ar") and w["ar"] not in seen_ar:
                words.append(w)
                seen_ar.add(w["ar"])

        for l in intro.get("letters", []):
            if l.get("ar") and l["ar"] not in seen_ar:
                letters.append(l)
                seen_ar.add(l["ar"])

        for p in intro.get("words", []):
            if p.get("type") == "phrase" and p.get("ar") and p["ar"] not in seen_ar:
                phrases.append(p)
                seen_ar.add(p["ar"])

    return {"words": words, "letters": letters, "phrases": phrases}


# ── Nettoyage harakat ─────────────────────────────────────────
def strip_harakat(text: str) -> str:
    harakat = "\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0640"
    for ch in harakat:
        text = text.replace(ch, "")
    return text.strip()


# ── Génération exercices dynamiques ──────────────────────────
def generate_dynamic_exercises(vocab: dict, mastery_map: dict) -> list:
    exercises = []
    words   = vocab.get("words", [])
    letters = vocab.get("letters", [])

    # ── word_writing : écrire un mot au hasard ────────────────
    if words and mastery_map.get("word_writing", 0) < THRESHOLD_INTERMEDIATE:
        # Choisir 2 mots aléatoires
        sample = random.sample(words, min(2, len(words)))
        for w in sample:
            ar_clean = strip_harakat(w["ar"])
            exercises.append({
                "id":            f"eval_dyn_ww_{ar_clean}",
                "type":          "input_text",
                "skill_id":      "word_writing",
                "prompt":        f"Écrivez « {w.get('translation', '')} » en arabe",
                "xpReward":      6,
                "acceptedAnswers": [ar_clean, w["ar"]],
                "explanation":   f"{w['ar']} = {w.get('translation', '')}",
            })

    # ── word_comprehension : MCQ traduction au hasard ─────────
    if len(words) >= 4 and mastery_map.get("word_comprehension", 0) < THRESHOLD_INTERMEDIATE:
        sample = random.sample(words, min(3, len(words)))
        for w in sample:
            distractors = [x["translation"] for x in words if x["ar"] != w["ar"]]
            distractors = random.sample(distractors, min(3, len(distractors)))
            options = distractors + [w["translation"]]
            random.shuffle(options)
            correct_idx = options.index(w["translation"])
            exercises.append({
                "id":           f"eval_dyn_wc_{strip_harakat(w['ar'])}",
                "type":         "mcq",
                "skill_id":     "word_comprehension",
                "prompt":       "Que signifie ce mot ?",
                "promptAr":     w["ar"],
                "audioUrl":     w.get("audio", ""),
                "xpReward":     4,
                "options":      options,
                "correctIndex": correct_idx,
                "explanation":  f"{w['ar']} = {w.get('translation', '')}",
            })

    # ── word_reading : audio_choice au hasard ─────────────────
    if len(words) >= 4 and mastery_map.get("word_reading", 0) < THRESHOLD_INTERMEDIATE:
        words_with_audio = [w for w in words if w.get("audio")]
        if len(words_with_audio) >= 4:
            target = random.choice(words_with_audio)
            distractors = random.sample(
                [w for w in words_with_audio if w["ar"] != target["ar"]],
                min(3, len(words_with_audio) - 1)
            )
            options = [w["ar"] for w in distractors] + [target["ar"]]
            random.shuffle(options)
            correct_idx = options.index(target["ar"])
            exercises.append({
                "id":           f"eval_dyn_wr_{strip_harakat(target['ar'])}",
                "type":         "audio_choice",
                "skill_id":     "word_reading",
                "prompt":       "Écoutez et identifiez le mot",
                "audioUrl":     target["audio"],
                "xpReward":     5,
                "options":      options,
                "correctIndex": correct_idx,
                "explanation":  f"{target['ar']} = {target.get('translation', '')}",
            })

    # ── letter_recognition : MCQ lettre au hasard ────────────
    if len(letters) >= 2 and mastery_map.get("letter_recognition", 0) < THRESHOLD_INTERMEDIATE:
        target = random.choice(letters)
        distractors = random.sample(
            [l for l in letters if l["ar"] != target["ar"]],
            min(3, len(letters) - 1)
        )
        options = [l.get("name", l["ar"]) for l in distractors] + [target.get("name", target["ar"])]
        random.shuffle(options)
        correct_idx = options.index(target.get("name", target["ar"]))
        exercises.append({
            "id":           f"eval_dyn_lr_{strip_harakat(target['ar'])}",
            "type":         "mcq",
            "skill_id":     "letter_recognition",
            "prompt":       "Quelle est cette lettre ?",
            "promptAr":     target["ar"],
            "audioUrl":     target.get("audio", ""),
            "xpReward":     3,
            "options":      options,
            "correctIndex": correct_idx,
            "explanation":  f"{target['ar']} = {target.get('name', '')}",
        })

    # ── matching : associer mots aléatoires ───────────────────
    if len(words) >= 3 and mastery_map.get("word_comprehension", 0) < THRESHOLD_INTERMEDIATE:
        sample = random.sample(words, min(4, len(words)))
        pairs  = [{"ar": w["ar"], "fr": w.get("translation", "")} for w in sample]
        exercises.append({
            "id":       "eval_dyn_match_words",
            "type":     "matching",
            "skill_id": "word_comprehension",
            "prompt":   "Associez chaque mot à sa traduction",
            "xpReward": 8,
            "pairs":    pairs,
        })

    return exercises


# ── Sélection exercices statiques ─────────────────────────────
def select_exercises(bank: dict, mastery_map: dict) -> list:
    skills       = bank.get("skills", {})
    selected     = []
    all_mastered = True

    sorted_skills = sorted(skills.items(), key=lambda x: mastery_map.get(x[0], 0.0))

    for skill_id, levels in sorted_skills:
        if len(selected) >= MAX_EXERCISES:
            break
        mastery = mastery_map.get(skill_id, 0.0)

        if mastery < THRESHOLD_BASIC:
            all_mastered = False
            pool   = levels.get("basic", [])
            chosen = random.sample(pool, min(NB_BASIC, len(pool)))
            selected.extend(chosen)

        elif mastery < THRESHOLD_INTERMEDIATE:
            all_mastered = False
            pool   = levels.get("intermediate", [])
            chosen = random.sample(pool, min(NB_INTERMEDIATE, len(pool)))
            selected.extend(chosen)

    if all_mastered:
        for skill_id, levels in skills.items():
            if len(selected) >= MAX_EXERCISES:
                break
            pool = levels.get("advanced", [])
            if pool:
                chosen = random.sample(pool, min(NB_ADVANCED, len(pool)))
                selected.extend(chosen)

    # Minimum 5 exercices
    if len(selected) < 5:
        existing_ids = {e["id"] for e in selected}
        for skill_id, levels in sorted_skills:
            if len(selected) >= 8:
                break
            for level_name in ("intermediate", "basic", "advanced"):
                for ex in levels.get(level_name, []):
                    if ex["id"] not in existing_ids and len(selected) < 8:
                        selected.append(ex)
                        existing_ids.add(ex["id"])

    return selected


# ── Endpoint principal ────────────────────────────────────────
@router.get("/evaluation/module/{module_id}")
async def get_evaluation(
    module_id: int,
    degree: int = 1,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Mastery depuis la DB
    mastery_map = await get_mastery_map(current_user.id, db)

    # Banque statique
    bank = load_evaluation_bank(degree, module_id)

    # Contenu du module pour exercices dynamiques
    module_content = load_module_content(degree, module_id)
    vocab          = extract_module_vocabulary(module_content)

    # Sélection exercices statiques
    static_exercises  = select_exercises(bank, mastery_map)

    # Génération exercices dynamiques
    dynamic_exercises = generate_dynamic_exercises(vocab, mastery_map)

    # Fusion — dédoublonnage par skill_id pour équilibrer
    all_exercises = static_exercises + dynamic_exercises
    # Supprimer les doublons d'id
    seen_ids = set()
    unique_exercises = []
    for ex in all_exercises:
        if ex["id"] not in seen_ids:
            unique_exercises.append(ex)
            seen_ids.add(ex["id"])

    random.shuffle(unique_exercises)
    exercises = unique_exercises[:MAX_EXERCISES]

    # Résumé profil
    skills_summary = {}
    for skill_id in bank.get("skills", {}).keys():
        mastery = mastery_map.get(skill_id, 0.0)
        level   = "mastered" if mastery >= THRESHOLD_INTERMEDIATE else ("medium" if mastery >= THRESHOLD_BASIC else "weak")
        skills_summary[skill_id] = {"mastery": round(mastery, 2), "level": level}

    all_mastered = all(
        mastery_map.get(sk, 0.0) >= THRESHOLD_INTERMEDIATE
        for sk in bank.get("skills", {}).keys()
    )

    print(f"EVAL module={module_id} user={current_user.username} → {len(exercises)} exercices "
          f"({len(static_exercises)} statiques + {len(dynamic_exercises)} dynamiques) | all_mastered={all_mastered}")
    for sk, v in skills_summary.items():
        print(f"  {sk}: {v['mastery']*100:.0f}% ({v['level']})")

    return {
        "module_id":      module_id,
        "degree":         degree,
        "exercise_count": len(exercises),
        "all_mastered":   all_mastered,
        "skills_summary": skills_summary,
        "exercises":      exercises,
    }