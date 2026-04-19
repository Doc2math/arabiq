"""
LangDad — Moteur BKT (Bayesian Knowledge Tracing)
==================================================
3 fonctions principales :
  1. update(user_id, skill, correct, latency_ms)  → mise à jour temps réel
  2. next_diagnostic_question(user_id)            → diagnostic CAT adaptatif
  3. evaluate_module(user_id, module_id)          → évaluation fin de module

Usage :
    from app.bkt.engine import bkt_engine
    result = bkt_engine.update(user_id, "harakat_reading", correct=True)
    report = bkt_engine.evaluate_module(user_id, module_id=1)
"""

import json
from datetime import datetime, timezone
from pathlib import Path


MASTERY_THRESHOLD = 0.80
WEAK_THRESHOLD    = 0.40

DEFAULT_PARAMS = {
    "p_l0": 0.10,
    "p_t":  0.20,
    "p_g":  0.25,
    "p_s":  0.10,
}

MODULE1_SKILLS = {
    "letter_recognition":  {"label": "Reconnaître les lettres",   "description": "Identifier م ك ت ب isolées",                  "module": 1, "order": 1, "params": {**DEFAULT_PARAMS, "p_l0": 0.10}},
    "harakat_reading":     {"label": "Lire avec harakat",          "description": "Lire les voyelles courtes fatha, kasra, damma", "module": 1, "order": 2, "params": {**DEFAULT_PARAMS, "p_l0": 0.05, "p_t": 0.18}},
    "long_vowels":         {"label": "Voyelles longues",           "description": "Lire ا و ي comme voyelles longues",            "module": 1, "order": 3, "params": {**DEFAULT_PARAMS, "p_l0": 0.05, "p_t": 0.15}},
    "tanwin":              {"label": "Tanwīn",                     "description": "Reconnaître et lire ً ٍ ٌ",                    "module": 1, "order": 4, "params": {**DEFAULT_PARAMS, "p_l0": 0.05, "p_t": 0.15}},
    "letter_positions":    {"label": "Positions des lettres",      "description": "Formes isolée, initiale, médiane, finale",     "module": 1, "order": 5, "params": {**DEFAULT_PARAMS, "p_l0": 0.05, "p_t": 0.12}},
    "word_reading":        {"label": "Lecture de mots",            "description": "Lire des mots construits avec م ك ت ب",        "module": 1, "order": 6, "params": {**DEFAULT_PARAMS, "p_l0": 0.08, "p_t": 0.15}},
    "word_comprehension":  {"label": "Compréhension des mots",     "description": "Associer un mot arabe à sa traduction",        "module": 1, "order": 7, "params": {**DEFAULT_PARAMS, "p_l0": 0.10, "p_t": 0.20}},
    "word_writing":        {"label": "Écriture des mots",          "description": "Écrire des mots arabes au clavier",            "module": 1, "order": 8, "params": {**DEFAULT_PARAMS, "p_l0": 0.05, "p_t": 0.12, "p_g": 0.05}},
    "word_building":       {"label": "Construction de mots",       "description": "Assembler des lettres pour former un mot",     "module": 1, "order": 9, "params": {**DEFAULT_PARAMS, "p_l0": 0.05, "p_t": 0.12, "p_g": 0.05}},
    "sentence_reading":    {"label": "Lecture de phrases",         "description": "Lire et comprendre des phrases simples",       "module": 1, "order": 10, "params": {**DEFAULT_PARAMS, "p_l0": 0.05, "p_t": 0.10}},
}

ALL_SKILLS = {**MODULE1_SKILLS}

PROFILES_DIR = Path(__file__).parent / "profiles"

QUESTION_TYPES = {
    "letter_recognition": "mcq",
    "harakat_reading":    "audio_choice",
    "long_vowels":        "audio_choice",
    "tanwin":             "mcq",
    "letter_positions":   "mcq",
    "word_reading":       "pronunciation",
    "word_comprehension": "matching",
    "word_writing":       "input_text",
    "word_building":      "drag_drop",
    "sentence_reading":   "mcq",
}


class BKTEngine:

    def __init__(self):
        PROFILES_DIR.mkdir(parents=True, exist_ok=True)

    # ── Profil ─────────────────────────────────────────────────

    def _path(self, user_id: str) -> Path:
        return PROFILES_DIR / f"{user_id}.json"

    def load_profile(self, user_id: str) -> dict:
        p = self._path(user_id)
        if p.exists():
            with open(p, encoding='utf-8') as f:
                return json.load(f)
        return self._new_profile(user_id)

    def save_profile(self, user_id: str, profile: dict) -> None:
        profile["last_updated"] = datetime.now(timezone.utc).isoformat()
        with open(self._path(user_id), 'w', encoding='utf-8') as f:
            json.dump(profile, f, ensure_ascii=False, indent=2)

    def _new_profile(self, user_id: str) -> dict:
        profile = {
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "skills": {},
            "module_progress": {},
            "diagnostic_done": False,
            "recommended_module": 1,
            "total_interactions": 0,
            "weak_skills": [],
            "strong_skills": [],
        }
        for sid, sdata in ALL_SKILLS.items():
            p = sdata["params"]
            profile["skills"][sid] = {
                "p_mastered": p["p_l0"],
                "p_l0": p["p_l0"],
                "p_t": p["p_t"],
                "p_g": p["p_g"],
                "p_s": p["p_s"],
                "attempts": 0,
                "correct": 0,
                "mastered": False,
                "last_seen": None,
            }
        return profile

    # ── Formule BKT ────────────────────────────────────────────

    def _bkt_update(self, state: dict, correct: bool) -> dict:
        p_l = state["p_mastered"]
        p_t = state["p_t"]
        p_g = state["p_g"]
        p_s = state["p_s"]

        if correct:
            p_obs = p_l * (1 - p_s) + (1 - p_l) * p_g
            p_l_given = (p_l * (1 - p_s)) / max(p_obs, 1e-10)
        else:
            p_obs = p_l * p_s + (1 - p_l) * (1 - p_g)
            p_l_given = (p_l * p_s) / max(p_obs, 1e-10)

        p_l_new = max(0.0, min(1.0, p_l_given + (1 - p_l_given) * p_t))

        state["p_mastered"] = round(p_l_new, 4)
        state["attempts"]  += 1
        state["correct"]   += 1 if correct else 0
        state["mastered"]   = p_l_new >= MASTERY_THRESHOLD
        state["last_seen"]  = datetime.now(timezone.utc).isoformat()
        return state

    # ── Fonction 1 : Mise à jour temps réel ────────────────────

    def update(self, user_id: str, skill_id: str, correct: bool,
               latency_ms: int = 0, module_id: int = 1) -> dict:
        profile = self.load_profile(user_id)

        if skill_id not in profile["skills"] and skill_id in ALL_SKILLS:
            p = ALL_SKILLS[skill_id]["params"]
            profile["skills"][skill_id] = {
                "p_mastered": p["p_l0"], "p_l0": p["p_l0"],
                "p_t": p["p_t"], "p_g": p["p_g"], "p_s": p["p_s"],
                "attempts": 0, "correct": 0, "mastered": False, "last_seen": None,
            }

        profile["skills"][skill_id] = self._bkt_update(profile["skills"][skill_id], correct)
        profile["total_interactions"] += 1

        mod_key = str(module_id)
        if mod_key not in profile["module_progress"]:
            profile["module_progress"][mod_key] = {
                "started_at": datetime.now(timezone.utc).isoformat(),
                "interactions": 0, "correct": 0,
            }
        profile["module_progress"][mod_key]["interactions"] += 1
        profile["module_progress"][mod_key]["correct"] += 1 if correct else 0

        profile["weak_skills"]   = self._get_weak(profile)
        profile["strong_skills"] = self._get_strong(profile)
        self.save_profile(user_id, profile)

        return {
            "skill_id":      skill_id,
            "p_mastered":    profile["skills"][skill_id]["p_mastered"],
            "mastered":      profile["skills"][skill_id]["mastered"],
            "weak_skills":   profile["weak_skills"],
            "strong_skills": profile["strong_skills"],
        }

    # ── Fonction 2 : Diagnostic CAT ────────────────────────────

    def next_diagnostic_question(self, user_id: str, answered: list[str] = []) -> dict | None:
        profile = self.load_profile(user_id)

        candidates = []
        for sid, state in profile["skills"].items():
            if sid in answered or state["attempts"] >= 3:
                continue
            uncertainty = 1 - abs(state["p_mastered"] - 0.5) * 2
            candidates.append((sid, uncertainty))

        if not candidates:
            profile["diagnostic_done"] = True
            self.save_profile(user_id, profile)
            return None

        candidates.sort(key=lambda x: x[1], reverse=True)
        skill_id, uncertainty = candidates[0]
        state = profile["skills"][skill_id]

        return {
            "skill_id":      skill_id,
            "skill_label":   ALL_SKILLS.get(skill_id, {}).get("label", skill_id),
            "p_mastered":    state["p_mastered"],
            "uncertainty":   round(uncertainty, 3),
            "question_type": QUESTION_TYPES.get(skill_id, "mcq"),
        }

    # ── Fonction 3 : Évaluation fin de module ──────────────────

    def evaluate_module(self, user_id: str, module_id: int) -> dict:
        profile = self.load_profile(user_id)
        module_skills = {k: v for k, v in ALL_SKILLS.items() if v.get("module") == module_id}

        skills_report = []
        for sid, sinfo in module_skills.items():
            state = profile["skills"].get(sid, {})
            p        = state.get("p_mastered", 0.0)
            attempts = state.get("attempts", 0)
            correct  = state.get("correct", 0)

            if p >= 0.95:
                status, priority, n_q = "mastered", 0, 0
            elif p >= MASTERY_THRESHOLD:
                status, priority, n_q = "good", 1, 2
            elif p >= WEAK_THRESHOLD:
                status, priority, n_q = "in_progress", 2, 4
            else:
                status, priority, n_q = "weak", 3, 6

            skills_report.append({
                "skill_id":    sid,
                "label":       sinfo["label"],
                "description": sinfo["description"],
                "p_mastered":  round(p, 3),
                "status":      status,
                "priority":    priority,
                "attempts":    attempts,
                "correct":     correct,
                "accuracy":    round(correct / attempts, 2) if attempts > 0 else 0,
                "n_questions": n_q,
            })

        skills_report.sort(key=lambda x: x["priority"], reverse=True)

        avg  = sum(s["p_mastered"] for s in skills_report) / len(skills_report) if skills_report else 0
        passed = avg >= 0.70
        weak   = [s for s in skills_report if s["status"] == "weak"]
        strong = [s for s in skills_report if s["status"] in ("good", "mastered")]

        if passed and not weak:
            rec = f"Excellent ! Vous maîtrisez le Module {module_id}. Passez au Module {module_id + 1}."
        elif passed:
            rec = f"Bien ! Avant de passer au Module {module_id + 1}, révisez : {', '.join(s['label'] for s in weak[:2])}."
        else:
            rec = f"Continuez vos efforts sur : {', '.join(s['label'] for s in weak[:3])}."

        report = {
            "user_id":      user_id,
            "module_id":    module_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "score":        round(avg * 100, 1),
            "passed":       passed,
            "skills":       skills_report,
            "summary": {
                "mastered":    len([s for s in skills_report if s["status"] == "mastered"]),
                "good":        len([s for s in skills_report if s["status"] == "good"]),
                "in_progress": len([s for s in skills_report if s["status"] == "in_progress"]),
                "weak":        len([s for s in skills_report if s["status"] == "weak"]),
                "total":       len(skills_report),
            },
            "weak_skills":          [s["label"] for s in weak],
            "strong_skills":        [s["label"] for s in strong],
            "recommendation":       rec,
            "certificate_eligible": passed and avg >= 0.85,
        }

        mod_key = str(module_id)
        if mod_key not in profile["module_progress"]:
            profile["module_progress"][mod_key] = {}
        profile["module_progress"][mod_key]["last_evaluation"] = report
        self.save_profile(user_id, profile)

        return report

    # ── Utilitaires ────────────────────────────────────────────

    def _get_weak(self, profile: dict) -> list[str]:
        return [k for k, v in profile["skills"].items()
                if v["p_mastered"] < WEAK_THRESHOLD and v["attempts"] > 0]

    def _get_strong(self, profile: dict) -> list[str]:
        return [k for k, v in profile["skills"].items()
                if v["p_mastered"] >= MASTERY_THRESHOLD]

    def get_profile_summary(self, user_id: str) -> dict:
        profile = self.load_profile(user_id)
        total    = len(profile["skills"])
        mastered = len(self._get_strong(profile))
        weak     = len(self._get_weak(profile))
        return {
            "user_id":            user_id,
            "total_interactions": profile["total_interactions"],
            "diagnostic_done":    profile["diagnostic_done"],
            "recommended_module": profile["recommended_module"],
            "skills_mastered":    mastered,
            "skills_weak":        weak,
            "skills_total":       total,
            "overall_progress":   round(mastered / total * 100, 1) if total > 0 else 0,
            "weak_skills":        self._get_weak(profile),
            "strong_skills":      self._get_strong(profile),
        }


bkt_engine = BKTEngine()