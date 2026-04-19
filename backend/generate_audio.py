"""
LangDad — Génération audio complète Module 1
=============================================
Génère les MP3 pour :
  - Noms des lettres (7)
  - Syllabes : harakat, tanwīn, voyelles longues (44)
  - Positions des lettres (28)
  - Mots (19)
  - Phrases (4)

Usage :
    cd backend
    pip install gtts --break-system-packages
    python generate_audio.py

    # Un seul type :
    python generate_audio.py --only letters
    python generate_audio.py --only syllables
    python generate_audio.py --only positions
    python generate_audio.py --only words
    python generate_audio.py --only phrases
"""

import json
import sys
import time
from pathlib import Path

try:
    from gtts import gTTS
except ImportError:
    print("[ERREUR] pip install gtts --break-system-packages")
    sys.exit(1)

REGISTRY   = Path(__file__).parent.parent / "frontend" / "src" / "data" / "assets-registry.json"
PUBLIC_DIR = Path(__file__).parent.parent / "frontend" / "public"

DIRS = {
    "letters":   PUBLIC_DIR / "assets" / "audio" / "letters",
    "syllables": PUBLIC_DIR / "assets" / "audio" / "syllables",
    "positions": PUBLIC_DIR / "assets" / "audio" / "positions",
    "words":     PUBLIC_DIR / "assets" / "audio" / "words",
    "phrases":   PUBLIC_DIR / "assets" / "audio" / "phrases",
}

# Noms arabes complets des lettres
LETTER_NAMES = {
    "mim": "ميم", "kaf": "كاف", "ta": "تاء",
    "ba":  "باء", "waw": "واو", "alif": "ألف", "ya": "ياء",
}

# Noms arabes des positions
POSITION_NAMES = {
    "isolated": "مفردة",
    "initial":  "في البداية",
    "medial":   "في الوسط",
    "final":    "في النهاية",
}


def mp3(text: str, dest: Path, slow: bool = False) -> bool:
    try:
        gTTS(text=text, lang='ar', slow=slow).save(str(dest))
        return True
    except Exception as e:
        print(f"    [ERR] {e}")
        return False


def skip_or_make(dest: Path) -> bool:
    if dest.exists():
        print(f"  [SKIP] {dest.name}")
        return True
    return False


def run(label: str, fn, only: str) -> None:
    if only and only != label:
        return
    print(f"\n── {label.capitalize()} {'─' * (44 - len(label))}")
    fn()


def main():
    only = None
    if "--only" in sys.argv:
        idx = sys.argv.index("--only")
        if idx + 1 < len(sys.argv):
            only = sys.argv[idx + 1]

    if not REGISTRY.exists():
        print(f"[ERREUR] Registre introuvable : {REGISTRY}")
        sys.exit(1)

    with open(REGISTRY, encoding='utf-8') as f:
        reg = json.load(f)

    for d in DIRS.values():
        d.mkdir(parents=True, exist_ok=True)

    total = {"ok": 0, "skip": 0, "err": 0}

    # ── 1. Lettres ─────────────────────────────────────────────
    def gen_letters():
        for key, data in reg.get("letters", {}).items():
            dest = DIRS["letters"] / f"{key}.mp3"
            if skip_or_make(dest):
                total["skip"] += 1; continue
            text = LETTER_NAMES.get(key, data["ar"])
            ok = mp3(text, dest, slow=True)
            print(f"  {'[OK]' if ok else '[ERR]'} {key}.mp3 ← {text}")
            total["ok" if ok else "err"] += 1
            time.sleep(0.5)

    run("letters", gen_letters, only)

    # ── 2. Syllabes (harakat, tanwīn, voyelles longues) ────────
    def gen_syllables():
        for key, data in reg.get("syllables", {}).items():
            filename = Path(data["audio"]).name
            dest = DIRS["syllables"] / filename
            if skip_or_make(dest):
                total["skip"] += 1; continue
            # Lire le caractère arabe directement (avec haraka)
            ok = mp3(data["ar"], dest, slow=True)
            print(f"  {'[OK]' if ok else '[ERR]'} {filename} ← {data['ar']} ({data['description']})")
            total["ok" if ok else "err"] += 1
            time.sleep(0.4)

    run("syllables", gen_syllables, only)

    # ── 3. Positions des lettres ───────────────────────────────
    def gen_positions():
        for letter_key, data in reg.get("positions", {}).items():
            letter_name = LETTER_NAMES.get(letter_key, letter_key)
            for pos, form in data["forms"].items():
                filename = f"{letter_key}_{pos}.mp3"
                dest = DIRS["positions"] / filename
                if skip_or_make(dest):
                    total["skip"] += 1; continue
                # Dire : "lettre X en position Y"
                pos_name = POSITION_NAMES.get(pos, pos)
                text = f"{form} {pos_name}"
                ok = mp3(text, dest, slow=True)
                print(f"  {'[OK]' if ok else '[ERR]'} {filename} ← {text}")
                total["ok" if ok else "err"] += 1
                time.sleep(0.4)

    run("positions", gen_positions, only)

    # ── 4. Mots ────────────────────────────────────────────────
    def gen_words():
        for key, data in reg.get("words", {}).items():
            filename = Path(data["audio"]).name
            dest = DIRS["words"] / filename
            if skip_or_make(dest):
                total["skip"] += 1; continue
            ok = mp3(data["ar"], dest)
            print(f"  {'[OK]' if ok else '[ERR]'} {filename} ← {data['ar']} ({data['fr']})")
            total["ok" if ok else "err"] += 1
            time.sleep(0.5)

    run("words", gen_words, only)

    # ── 5. Phrases ─────────────────────────────────────────────
    def gen_phrases():
        for key, data in reg.get("phrases", {}).items():
            filename = Path(data["audio"]).name
            dest = DIRS["phrases"] / filename
            if skip_or_make(dest):
                total["skip"] += 1; continue
            ok = mp3(data["ar"], dest)
            print(f"  {'[OK]' if ok else '[ERR]'} {filename} ← {data['ar']}")
            total["ok" if ok else "err"] += 1
            time.sleep(0.8)

    run("phrases", gen_phrases, only)

    # ── Résumé ─────────────────────────────────────────────────
    print(f"\n{'─'*50}")
    print(f"[✓] Terminé — {total['ok']} générés, {total['skip']} ignorés, {total['err']} erreurs")
    print(f"\nDossiers :")
    for name, path in DIRS.items():
        count = len(list(path.glob("*.mp3"))) if path.exists() else 0
        print(f"  {name:12} → {count} fichiers  ({path})")


if __name__ == "__main__":
    main()