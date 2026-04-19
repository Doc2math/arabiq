"""
LangDad — Moteur BKT (Bayesian Knowledge Tracing)
==================================================
Modèle à 4 paramètres par compétence :
  P(init)   — probabilité de maîtrise initiale
  P(learn)  — probabilité d'apprendre après un essai
  P(forget) — probabilité d'oublier après maîtrise
  P(slip)   — probabilité de faute malgré maîtrise
  P(guess)  — probabilité de réussite sans maîtrise

Collecte dataset pour futur entraînement DKT :
  Chaque interaction est loggée en base sous forme de séquence
  (skill_id, correct, latency_ms, timestamp, user_id)

Seuil migration BKT → DKT : 20 000 interactions
"""

import json
import time
import uuid
import math
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional


# ── Chemins ────────────────────────────────────────────────────
SKILL_GRAPH_PATH = Path(__file__).parent / "skill_graph.json"
MASTERY_THRESHOLD = 0.80   # P(maîtrise) > 0.80 → compétence maîtrisée
DKT_THRESHOLD     = 20_000 # interactions avant migration DKT


# ── Chargement du graphe ───────────────────────────────────────
def load_skill_graph(path: Path = SKILL_GRAPH_PATH) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ── Modèle BKT ────────────────────────────────────────────────
def bkt_update(p_mastery: float, correct: bool, params: dict) -> float:
    """
    Met à jour P(maîtrise) après une réponse.
    Retourne la nouvelle probabilité de maîtrise.
    """
    p_l  = params["p_learn"]
    p_f  = params["p_forget"]
    p_s  = params["p_slip"]
    p_g  = params["p_guess"]

    # P(réponse correcte | maîtrise) et P(réponse correcte | non-maîtrise)
    p_correct_mastered     = 1 - p_s
    p_correct_not_mastered = p_g
    p_wrong_mastered       = p_s
    p_wrong_not_mastered   = 1 - p_g

    if correct:
        numerator   = p_correct_mastered * p_mastery
        denominator = (p_correct_mastered * p_mastery
                      + p_correct_not_mastered * (1 - p_mastery))
    else:
        numerator   = p_wrong_mastered * p_mastery
        denominator = (p_wrong_mastered * p_mastery
                      + p_wrong_not_mastered * (1 - p_mastery))

    if denominator < 1e-10:
        p_posterior = p_mastery
    else:
        p_posterior = numerator / denominator

    # Mise à jour avec apprentissage / oubli
    p_new = p_posterior * (1 - p_f) + (1 - p_posterior) * p_l

    return round(max(0.01, min(0.99, p_new)), 4)


def is_mastered(p_mastery: float) -> bool:
    return p_mastery >= MASTERY_THRESHOLD


# ── Structures de données ──────────────────────────────────────
@dataclass
class SkillState:
    skill_id:   str
    p_mastery:  float
    n_attempts: int   = 0
    n_correct:  int   = 0
    mastered:   bool  = False
    last_seen:  float = field(default_factory=time.time)


@dataclass
class Interaction:
    """Une interaction élève — unité de base du dataset DKT."""
    id:          str
    user_id:     str
    skill_id:    str
    correct:     bool
    latency_ms:  int
    p_before:    float   # P(maîtrise) avant la réponse
    p_after:     float   # P(maîtrise) après la réponse
    exercise_id: Optional[str]
    module_id:   int
    timestamp:   float = field(default_factory=time.time)


# ── Moteur principal ───────────────────────────────────────────
class BKTEngine:

    def __init__(self, skill_graph_path: Path = SKILL_GRAPH_PATH):
        graph = load_skill_graph(skill_graph_path)
        # Index skills par id
        self._skills: dict[str, dict] = {
            s["id"]: s for s in graph["skills"]
        }
        self._modules: list[dict] = graph["modules"]

    # ── État initial d'un élève ────────────────────────────────
    def init_student_state(
        self,
        user_id: str,
        skill_vector: Optional[dict] = None
    ) -> dict[str, SkillState]:
        """
        Crée l'état BKT initial pour un élève.
        skill_vector : dict {skill_id: p_mastery} issu du diagnostic CAT
        """
        state = {}
        for skill_id, skill in self._skills.items():
            p_init = skill["bkt"]["p_init"]
            # Si le diagnostic a fourni une estimation, on l'utilise
            if skill_vector and skill_id in skill_vector:
                p_init = float(skill_vector[skill_id])
            state[skill_id] = SkillState(
                skill_id=skill_id,
                p_mastery=p_init,
                mastered=p_init >= MASTERY_THRESHOLD,
            )
        return state

    # ── Mise à jour après une interaction ─────────────────────
    def record_interaction(
        self,
        user_id:     str,
        skill_id:    str,
        correct:     bool,
        latency_ms:  int,
        state:       dict[str, SkillState],
        exercise_id: Optional[str] = None,
        module_id:   int = 1,
    ) -> tuple[dict[str, SkillState], Interaction]:
        """
        Met à jour P(maîtrise) et retourne l'interaction loggée.
        """
        if skill_id not in self._skills:
            raise ValueError(f"Compétence inconnue : {skill_id}")

        skill  = self._skills[skill_id]
        params = skill["bkt"]
        ss     = state[skill_id]

        p_before = ss.p_mastery
        p_after  = bkt_update(p_before, correct, params)

        # Mettre à jour l'état
        ss.p_mastery  = p_after
        ss.n_attempts += 1
        ss.n_correct  += int(correct)
        ss.mastered    = is_mastered(p_after)
        ss.last_seen   = time.time()

        interaction = Interaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            skill_id=skill_id,
            correct=correct,
            latency_ms=latency_ms,
            p_before=p_before,
            p_after=p_after,
            exercise_id=exercise_id,
            module_id=module_id,
        )
        return state, interaction

    # ── Prochaine compétence recommandée ──────────────────────
    def next_skill(
        self,
        state: dict[str, SkillState],
        current_module: int = 1,
    ) -> Optional[str]:
        """
        Retourne la compétence la plus urgente à travailler :
        - Non maîtrisée
        - Prérequis satisfaits
        - Dans le module courant ou précédent
        """
        candidates = []

        for skill_id, skill in self._skills.items():
            # Filtre module
            if skill["module"] > current_module:
                continue

            ss = state[skill_id]
            if ss.mastered:
                continue

            # Vérifier prérequis
            prereqs_ok = all(
                state[p].mastered
                for p in skill["prerequisites"]
                if p in state
            )
            if not prereqs_ok:
                continue

            # Score de priorité : plus P(maîtrise) est bas, plus urgent
            priority = 1 - ss.p_mastery
            candidates.append((priority, skill_id))

        if not candidates:
            return None

        candidates.sort(reverse=True)
        return candidates[0][1]

    # ── Module débloqué ? ─────────────────────────────────────
    def module_unlocked(
        self,
        module_id: int,
        state: dict[str, SkillState],
    ) -> bool:
        """
        Un module est débloqué si toutes les compétences
        du module précédent sont maîtrisées.
        """
        if module_id <= 1:
            return True

        prev_module = next(
            (m for m in self._modules if m["id"] == module_id - 1), None
        )
        if not prev_module:
            return False

        return all(
            state.get(sid, SkillState(sid, 0)).mastered
            for sid in prev_module["skill_ids"]
        )

    # ── Résumé du profil élève ─────────────────────────────────
    def student_summary(
        self,
        user_id: str,
        state: dict[str, SkillState],
    ) -> dict:
        total     = len(state)
        mastered  = sum(1 for ss in state.values() if ss.mastered)
        in_progress = sum(
            1 for ss in state.values()
            if not ss.mastered and ss.n_attempts > 0
        )

        # Par module
        modules_progress = []
        for mod in self._modules:
            skills_in_mod = [
                state[sid] for sid in mod["skill_ids"] if sid in state
            ]
            if not skills_in_mod:
                continue
            n_mastered = sum(1 for ss in skills_in_mod if ss.mastered)
            modules_progress.append({
                "module_id":    mod["id"],
                "name":         mod["name"],
                "translation":  mod["translation"],
                "total_skills": len(skills_in_mod),
                "mastered":     n_mastered,
                "completion":   round(n_mastered / len(skills_in_mod), 2),
                "unlocked":     self.module_unlocked(mod["id"], state),
            })

        # Compétences à travailler
        weak_skills = sorted(
            [ss for ss in state.values() if not ss.mastered and ss.n_attempts > 0],
            key=lambda ss: ss.p_mastery
        )[:3]

        return {
            "user_id":          user_id,
            "total_skills":     total,
            "mastered":         mastered,
            "in_progress":      in_progress,
            "completion_rate":  round(mastered / total, 2),
            "modules":          modules_progress,
            "weak_skills":      [
                {
                    "skill_id":  ss.skill_id,
                    "label":     self._skills[ss.skill_id]["label"],
                    "p_mastery": ss.p_mastery,
                    "attempts":  ss.n_attempts,
                }
                for ss in weak_skills
            ],
        }


# ── Collecteur de dataset pour le DKT ────────────────────────
class DatasetCollector:
    """
    Collecte les interactions en mémoire et les sérialise
    en format compatible avec l'entraînement DKT (LSTM).

    Format DKT : séquences (skill_id, correct) par élève
    Compatible avec : pyKT, DKT original (Piech 2015)
    """

    def __init__(self):
        self._interactions: list[Interaction] = []
        self._sequences:    dict[str, list]   = {}  # user_id → séquence

    def log(self, interaction: Interaction):
        self._interactions.append(interaction)

        uid = interaction.user_id
        if uid not in self._sequences:
            self._sequences[uid] = []

        self._sequences[uid].append({
            "skill_id":   interaction.skill_id,
            "correct":    int(interaction.correct),
            "latency_ms": interaction.latency_ms,
            "p_before":   interaction.p_before,
            "p_after":    interaction.p_after,
            "module_id":  interaction.module_id,
            "timestamp":  interaction.timestamp,
        })

    @property
    def total_interactions(self) -> int:
        return len(self._interactions)

    @property
    def ready_for_dkt(self) -> bool:
        return self.total_interactions >= DKT_THRESHOLD

    @property
    def dkt_readiness_pct(self) -> float:
        return round(min(100, self.total_interactions / DKT_THRESHOLD * 100), 1)

    def export_for_dkt(self) -> list[dict]:
        """
        Exporte les séquences au format attendu par pyKT / DKT.
        Chaque entrée = un élève avec sa séquence d'interactions.
        """
        result = []
        for user_id, seq in self._sequences.items():
            if len(seq) < 5:  # ignorer les séquences trop courtes
                continue
            result.append({
                "user_id":    user_id,
                "n_steps":    len(seq),
                "sequence":   seq,
            })
        return result

    def stats(self) -> dict:
        n_users = len(self._sequences)
        avg_seq = (
            sum(len(s) for s in self._sequences.values()) / n_users
            if n_users > 0 else 0
        )
        # Distribution correctes/incorrectes
        n_correct = sum(1 for i in self._interactions if i.correct)
        return {
            "total_interactions": self.total_interactions,
            "n_users":            n_users,
            "avg_seq_length":     round(avg_seq, 1),
            "correct_rate":       round(n_correct / max(1, self.total_interactions), 3),
            "dkt_readiness_pct":  self.dkt_readiness_pct,
            "ready_for_dkt":      self.ready_for_dkt,
            "dkt_threshold":      DKT_THRESHOLD,
        }


# ── Singletons (importés par les endpoints FastAPI) ───────────
_bkt_engine: Optional[BKTEngine]        = None
_collector:  Optional[DatasetCollector] = None


def get_bkt_engine() -> BKTEngine:
    global _bkt_engine
    if _bkt_engine is None:
        _bkt_engine = BKTEngine()
    return _bkt_engine


def get_collector() -> DatasetCollector:
    global _collector
    if _collector is None:
        _collector = DatasetCollector()
    return _collector


# ── Test / démo ───────────────────────────────────────────────
if __name__ == "__main__":
    import random

    engine    = get_bkt_engine()
    collector = get_collector()

    user_id = "demo_user_001"
    state   = engine.init_student_state(user_id)

    print("=== Simulation BKT — LangDad ===\n")

    # Simuler 30 interactions sur les compétences du Module 1
    module1_skills = [
        "diag_visual", "letter_name", "harakat",
        "short_syllables", "sukun_shadda", "long_syllables"
    ]

    for i in range(30):
        skill_id = engine.next_skill(state, current_module=1)
        if not skill_id:
            print("Toutes les compétences du module 1 sont maîtrisées !")
            break

        correct    = random.random() > 0.3   # 70% succès
        latency_ms = random.randint(600, 3000)

        state, interaction = engine.record_interaction(
            user_id=user_id,
            skill_id=skill_id,
            correct=correct,
            latency_ms=latency_ms,
            state=state,
            module_id=1,
        )
        collector.log(interaction)

        ss = state[skill_id]
        skill_label = engine._skills[skill_id]["label"]
        print(f"{'✓' if correct else '✗'} [{skill_label[:25]:25s}] "
              f"P={ss.p_mastery:.3f} "
              f"{'★ MAÎTRISÉ' if ss.mastered else ''}")

    print("\n=== Résumé élève ===")
    summary = engine.student_summary(user_id, state)
    print(f"Maîtrisé : {summary['mastered']}/{summary['total_skills']}")
    for mod in summary["modules"]:
        bar = "█" * mod["mastered"] + "░" * (mod["total_skills"] - mod["mastered"])
        print(f"  {mod['name']} : [{bar}] {mod['completion']*100:.0f}%")

    print("\n=== Dataset DKT ===")
    stats = collector.stats()
    print(f"Interactions : {stats['total_interactions']}")
    print(f"Progression vers DKT : {stats['dkt_readiness_pct']}% ({stats['total_interactions']}/{DKT_THRESHOLD})")
    print(f"Taux de réussite : {stats['correct_rate']*100:.1f}%")