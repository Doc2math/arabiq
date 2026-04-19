"""
LangDad — Moteur CAT (Computerized Adaptive Testing)
=====================================================
Implémente un test adaptatif basé sur l'IRT (Item Response Theory)
modèle 3PL : P(correct | θ) = c + (1-c) / (1 + exp(-a*(θ-b)))

Installation :
    pip install numpy scipy

Usage :
    from cat_engine import CATEngine
    engine = CATEngine()
    session = engine.start_session(user_id="u123", lang="fr")
    next_q  = engine.next_question(session)
    session = engine.record_response(session, item_id="vis_001", correct=True, latency_ms=1200)
    if engine.should_stop(session):
        profile = engine.build_profile(session)
"""

import json
import math
import time
import uuid
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field, asdict


# ── Paramètres globaux ─────────────────────────────────────────
ITEM_BANK_PATH   = Path(__file__).parent / "item_bank.json"
AXES             = ["visual", "syllable", "signs", "morphology", "vocabulary"]
SE_THRESHOLD     = 0.30    # Arrêt si erreur standard < 0.30 sur tous les axes actifs
MAX_ITEMS        = 40      # Garde-fou absolu
MIN_ITEMS_AXIS   = 2       # Minimum de questions par axe avant de conclure
INITIAL_THETA    = 0.0     # Niveau de départ (médian)
INITIAL_SE       = 2.0     # Incertitude initiale élevée


# ── Modèle IRT 3PL ─────────────────────────────────────────────
def irt_probability(theta: float, a: float, b: float, c: float) -> float:
    """P(correct | θ) selon le modèle logistique 3 paramètres."""
    return c + (1 - c) / (1 + math.exp(-a * (theta - b)))


def fisher_information(theta: float, a: float, b: float, c: float) -> float:
    """Information de Fisher pour un item (θ, a, b, c)."""
    p = irt_probability(theta, a, b, c)
    q = 1 - p
    if p <= c or q <= 0:
        return 0.0
    return (a ** 2 * (p - c) ** 2) / ((1 - c) ** 2 * p * q)


def mle_update_theta(theta: float, responses: list[dict]) -> tuple[float, float]:
    """
    Mise à jour de θ par Maximum Likelihood Estimation.
    Retourne (theta_new, standard_error).
    responses: [{"a": float, "b": float, "c": float, "correct": bool}]
    """
    if not responses:
        return theta, INITIAL_SE

    # Newton-Raphson sur la log-vraisemblance
    for _ in range(20):  # max iterations
        L1 = 0.0  # première dérivée
        L2 = 0.0  # deuxième dérivée (négative)

        for r in responses:
            a, b, c = r["a"], r["b"], r["c"]
            p = irt_probability(theta, a, b, c)
            u = (p - c) / (1 - c)  # proportion de P dû aux connaissances

            if 0 < p < 1:
                correct = int(r["correct"])
                L1 += a * u * (correct - p) / p
                L2 -= a**2 * u * (1 - u) * (correct * (1 - p) / p**2 + (1 - correct) / (1 - p)**2) * p**2 / p

        # Clamp L2 pour éviter division par zéro
        if abs(L2) < 1e-8:
            break

        delta = L1 / (-L2 + 1e-8)
        delta = max(-1.5, min(1.5, delta))  # clamp le pas
        theta += delta

        if abs(delta) < 1e-4:
            break

    # Bornes réalistes [-4, 4]
    theta = max(-4.0, min(4.0, theta))

    # Erreur standard = 1 / sqrt(Information totale)
    total_info = sum(
        fisher_information(theta, r["a"], r["b"], r["c"])
        for r in responses
    )
    se = 1.0 / math.sqrt(total_info) if total_info > 0 else INITIAL_SE
    return theta, se


# ── Structures de données ──────────────────────────────────────
@dataclass
class AxisState:
    theta: float = INITIAL_THETA
    se: float    = INITIAL_SE
    n_items: int = 0
    responses: list = field(default_factory=list)
    converged: bool = False


@dataclass
class CATSession:
    session_id: str
    user_id: str
    lang: str                             # fr / es / en
    started_at: float
    items_administered: list = field(default_factory=list)   # [item_id, ...]
    responses: list = field(default_factory=list)            # [{item_id, correct, latency_ms, timestamp}]
    axes: dict = field(default_factory=lambda: {ax: AxisState() for ax in AXES})
    stopped: bool = False
    stop_reason: str = ""
    total_items: int = 0


# ── Moteur principal ───────────────────────────────────────────
class CATEngine:

    def __init__(self, item_bank_path: Path = ITEM_BANK_PATH):
        with open(item_bank_path, encoding="utf-8") as f:
            self._bank: list[dict] = json.load(f)
        # Index par axe pour accès rapide
        self._by_axis: dict[str, list[dict]] = {ax: [] for ax in AXES}
        for item in self._bank:
            ax = item.get("axis")
            if ax in self._by_axis:
                self._by_axis[ax].append(item)

    # ── Démarrer une session ───────────────────────────────────
    def start_session(self, user_id: str, lang: str = "fr") -> CATSession:
        return CATSession(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            lang=lang,
            started_at=time.time(),
        )

    # ── Choisir la prochaine question ──────────────────────────
    def next_question(self, session: CATSession) -> Optional[dict]:
        """
        Sélectionne l'item qui maximise l'information de Fisher
        sur l'axe le plus incertain non encore couvert.
        """
        if session.stopped:
            return None

        administered_ids = set(session.items_administered)

        # Choisir l'axe prioritaire : celui avec le plus d'incertitude
        # et pas encore convergé, avec le moins de questions posées
        active_axes = [
            ax for ax in AXES
            if not session.axes[ax].converged
        ]
        if not active_axes:
            return None

        # Trier par : (n_items_posés ASC, se DESC) — couvrir d'abord les axes vierges
        active_axes.sort(key=lambda ax: (
            session.axes[ax].n_items,
            -session.axes[ax].se
        ))

        # Chercher le meilleur item dans les axes prioritaires
        best_item = None
        best_info = -1.0
        best_axis = None

        for ax in active_axes[:2]:  # regarder les 2 axes les plus prioritaires
            theta = session.axes[ax].theta
            candidates = [
                item for item in self._by_axis[ax]
                if item["id"] not in administered_ids
            ]
            if not candidates:
                continue

            for item in candidates:
                irt = item["irt"]
                info = fisher_information(theta, irt["a"], irt["b"], irt["c"])
                if info > best_info:
                    best_info = info
                    best_item = item
                    best_axis = ax

        return best_item

    # ── Enregistrer une réponse ────────────────────────────────
    def record_response(
        self,
        session: CATSession,
        item_id: str,
        correct: bool,
        latency_ms: int,
        confidence: Optional[float] = None,  # 0.0 - 1.0, si collecté
    ) -> CATSession:
        """Enregistre la réponse et met à jour θ pour l'axe concerné."""

        item = next((i for i in self._bank if i["id"] == item_id), None)
        if not item:
            return session

        ax = item["axis"]
        irt = item["irt"]

        # Log brut
        session.responses.append({
            "item_id":     item_id,
            "axis":        ax,
            "correct":     correct,
            "latency_ms":  latency_ms,
            "confidence":  confidence,
            "timestamp":   time.time(),
            "irt_b":       irt["b"],
        })
        session.items_administered.append(item_id)
        session.total_items += 1

        # Mise à jour de l'axe
        axis_state = session.axes[ax]
        axis_state.responses.append({
            "a": irt["a"], "b": irt["b"], "c": irt["c"],
            "correct": correct
        })
        axis_state.n_items += 1

        # Recalculer θ avec MLE si assez de réponses
        if axis_state.n_items >= 2:
            axis_state.theta, axis_state.se = mle_update_theta(
                axis_state.theta,
                axis_state.responses
            )
        elif axis_state.n_items == 1:
            # Après 1 réponse : ajustement simple
            axis_state.theta += 0.5 if correct else -0.5

        # Convergence de l'axe ?
        if (axis_state.se < SE_THRESHOLD and axis_state.n_items >= MIN_ITEMS_AXIS):
            axis_state.converged = True

        # Vérifier si le test doit s'arrêter
        session = self._check_stop(session)
        return session

    # ── Critères d'arrêt ──────────────────────────────────────
    def _check_stop(self, session: CATSession) -> CATSession:
        """Vérifie si tous les critères d'arrêt sont remplis."""

        # Garde-fou absolu
        if session.total_items >= MAX_ITEMS:
            session.stopped = True
            session.stop_reason = "max_items_reached"
            return session

        # Tous les axes actifs sont convergés
        all_converged = all(
            ax_state.converged
            for ax_state in session.axes.values()
        )
        # Et au moins 1 axe non vierge
        any_answered = any(
            ax_state.n_items >= MIN_ITEMS_AXIS
            for ax_state in session.axes.values()
        )
        if all_converged and any_answered:
            session.stopped = True
            session.stop_reason = "all_axes_converged"
            return session

        # Plus d'items disponibles
        administered_ids = set(session.items_administered)
        remaining = [i for i in self._bank if i["id"] not in administered_ids]
        if not remaining:
            session.stopped = True
            session.stop_reason = "bank_exhausted"

        return session

    def should_stop(self, session: CATSession) -> bool:
        return session.stopped

    # ── Construire le profil cognitif ──────────────────────────
    def build_profile(self, session: CATSession) -> dict:
        """
        Génère le profil cognitif complet avec recommandations.
        """
        axes_summary = {}
        for ax, state in session.axes.items():
            level = self._theta_to_level(state.theta)
            axes_summary[ax] = {
                "theta":     round(state.theta, 3),
                "se":        round(state.se, 3),
                "level":     level,
                "n_items":   state.n_items,
                "converged": state.converged,
            }

        # Niveau global = moyenne pondérée par nombre de réponses
        total_n = sum(s.n_items for s in session.axes.values())
        if total_n > 0:
            global_theta = sum(
                s.theta * s.n_items for s in session.axes.values()
            ) / total_n
        else:
            global_theta = 0.0

        global_level = self._theta_to_level(global_theta)

        # Points forts et axes à renforcer
        sorted_axes = sorted(
            axes_summary.items(),
            key=lambda x: x[1]["theta"],
            reverse=True
        )
        strengths = [ax for ax, data in sorted_axes if data["theta"] >= 0.5]
        weaknesses = [ax for ax, data in sorted_axes if data["theta"] < -0.5]

        # Recommandation de positionnement
        recommendation = self._generate_recommendation(
            global_theta, global_level, axes_summary
        )

        profile = {
            "session_id":       session.session_id,
            "user_id":          session.user_id,
            "completed_at":     time.time(),
            "duration_s":       round(time.time() - session.started_at),
            "total_items":      session.total_items,
            "stop_reason":      session.stop_reason,
            "global_theta":     round(global_theta, 3),
            "global_level":     global_level,
            "axes":             axes_summary,
            "strengths":        strengths,
            "weaknesses":       weaknesses,
            "recommendation":   recommendation,
            # Vecteur de compétences pour le BKT
            "skill_vector":     self._build_skill_vector(session),
        }
        return profile

    def _theta_to_level(self, theta: float) -> str:
        """Convertit θ en niveau lisible."""
        if theta < -2.0: return "débutant_absolu"
        if theta < -1.0: return "débutant"
        if theta < 0.0:  return "faux_débutant"
        if theta < 1.0:  return "intermédiaire_bas"
        if theta < 2.0:  return "intermédiaire"
        return "avancé"

    def _generate_recommendation(
        self,
        global_theta: float,
        global_level: str,
        axes: dict
    ) -> dict:
        """Génère les recommandations de positionnement."""

        # Module de départ selon le niveau global
        module_map = {
            "débutant_absolu":    {"module": 1, "lesson": 1,  "label": "Début absolu — Leçon 1"},
            "débutant":           {"module": 1, "lesson": 5,  "label": "Alphabet — milieu de module"},
            "faux_débutant":      {"module": 1, "lesson": 15, "label": "Alphabet — révision avancée"},
            "intermédiaire_bas":  {"module": 2, "lesson": 1,  "label": "Module 2 — Connexions"},
            "intermédiaire":      {"module": 3, "lesson": 1,  "label": "Module 3 — Voyageur temporel"},
            "avancé":             {"module": 4, "lesson": 1,  "label": "Module 4 — Éloquence"},
        }
        start = module_map.get(global_level, {"module": 1, "lesson": 1, "label": "Début"})

        # Axes prioritaires à renforcer
        priority_axes = sorted(
            [(ax, data["theta"]) for ax, data in axes.items() if data["n_items"] > 0],
            key=lambda x: x[1]
        )[:2]

        axis_labels = {
            "visual":     "Reconnaissance visuelle des lettres",
            "syllable":   "Lecture des syllabes",
            "signs":      "Signes de vocalisation",
            "morphology": "Morphologie et racines",
            "vocabulary": "Vocabulaire de base",
        }

        return {
            "start_module":  start["module"],
            "start_lesson":  start["lesson"],
            "start_label":   start["label"],
            "global_level":  global_level,
            "priority_work": [
                {"axis": ax, "label": axis_labels.get(ax, ax), "theta": round(t, 2)}
                for ax, t in priority_axes
            ],
            "message": {
                "fr": self._recommendation_message_fr(global_level, priority_axes, axis_labels),
                "en": self._recommendation_message_en(global_level),
            }
        }

    def _recommendation_message_fr(self, level: str, priority_axes: list, labels: dict) -> str:
        base = {
            "débutant_absolu":    "Bienvenue ! Vous débutez depuis zéro — parfait, LangDad est fait pour vous.",
            "débutant":           "Vous connaissez quelques bases. On commence par consolider l'alphabet.",
            "faux_débutant":      "Vous avez des acquis ! On va combler les lacunes et accélérer.",
            "intermédiaire_bas":  "Bon niveau ! Vous pouvez passer directement aux connexions de mots.",
            "intermédiaire":      "Très bon niveau ! On passe aux structures grammaticales avancées.",
            "avancé":             "Niveau avancé détecté. Module 4 recommandé pour aller vers l'éloquence.",
        }.get(level, "Diagnostic terminé.")

        if priority_axes:
            ax, _ = priority_axes[0]
            base += f" Point à renforcer en priorité : {labels.get(ax, ax)}."
        return base

    def _recommendation_message_en(self, level: str) -> str:
        return {
            "débutant_absolu":   "Welcome! You're starting from scratch — LangDad is built for you.",
            "débutant":          "You know a few basics. Let's start by consolidating the alphabet.",
            "faux_débutant":     "You have prior knowledge! We'll fill the gaps and accelerate.",
            "intermédiaire_bas": "Good level! You can jump straight to word connections.",
            "intermédiaire":     "Great level! Moving on to advanced grammatical structures.",
            "avancé":            "Advanced level detected. Module 4 recommended.",
        }.get(level, "Diagnostic complete.")

    def _build_skill_vector(self, session: CATSession) -> dict:
        """
        Vecteur de compétences initial pour initialiser le BKT.
        P(maîtrise) estimée par axe, bornée [0.05, 0.95].
        """
        def theta_to_mastery(theta: float) -> float:
            # Sigmoïde centrée : θ=0 → 0.5, θ=2 → 0.88, θ=-2 → 0.12
            return round(1 / (1 + math.exp(-theta * 0.8)), 3)

        return {
            ax: theta_to_mastery(state.theta)
            for ax, state in session.axes.items()
            if state.n_items > 0
        }


# ── Exemple d'utilisation ──────────────────────────────────────
if __name__ == "__main__":
    import random

    engine = CATEngine()
    session = engine.start_session(user_id="test_user_001", lang="fr")

    print("=== Démarrage session CAT ===")
    print(f"Session ID : {session.session_id}\n")

    step = 0
    while not engine.should_stop(session):
        item = engine.next_question(session)
        if not item is None:
            step += 1
            # Simuler une réponse aléatoire (pour le test)
            # En production : réponse réelle de l'élève
            correct  = random.random() > 0.4   # 60% de succès
            latency  = random.randint(800, 4000)

            question_text = item["question"].get("fr", "?")
            print(f"Q{step:02d} [{item['axis']:12s}] b={item['irt']['b']:+.1f} | {question_text[:50]}")
            print(f"     → {'✓' if correct else '✗'}  latence={latency}ms")

            session = engine.record_response(
                session, item["id"], correct, latency
            )

            # Afficher l'état des axes
            for ax, state in session.axes.items():
                if state.n_items > 0:
                    print(f"     {ax:12s}: θ={state.theta:+.2f} SE={state.se:.2f} {'✓ convergé' if state.converged else ''}")
            print()
        else:
            break

    print(f"=== Arrêt après {session.total_items} questions ({session.stop_reason}) ===\n")

    profile = engine.build_profile(session)
    print("=== PROFIL COGNITIF ===")
    print(f"Niveau global     : {profile['global_level']} (θ={profile['global_theta']:+.2f})")
    print(f"Durée             : {profile['duration_s']}s")
    print(f"\nRecommandation : {profile['recommendation']['start_label']}")
    print(f"Message : {profile['recommendation']['message']['fr']}")
    print(f"\nVecteur compétences : {profile['skill_vector']}")