"""
Script de génération audio — Module 1 LangDad
Génère tous les fichiers .mp3 via ElevenLabs (primaire) ou OpenAI TTS (fallback)

Usage:
    python generate_audio.py --api elevenlabs
    python generate_audio.py --api openai
    python generate_audio.py --api elevenlabs --only letters
    python generate_audio.py --api elevenlabs --only words

Configuration dans backend/.env :
    ELEVENLABS_API_KEY=votre_clé
    ELEVENLABS_VOICE_MALE=voice_id_homme
    ELEVENLABS_VOICE_FEMALE=voice_id_femme
    OPENAI_API_KEY=votre_clé (optionnel, pour fallback)

Installation:
    pip install requests openai python-dotenv
"""

import os
import sys
import time
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv

# ── Charger .env ──────────────────────────────────────────────
load_dotenv("backend/.env")

# ── Configuration ─────────────────────────────────────────────
OUTPUT_DIR = Path("frontend/public/assets/audio")

ELEVENLABS_API_KEY      = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_MALE   = os.getenv("ELEVENLABS_VOICE_MALE", "pNInz6obpgDQGcFmaJgB")
ELEVENLABS_VOICE_FEMALE = os.getenv("ELEVENLABS_VOICE_FEMALE", "EXAVITQu4vr4xnSDxMaL")

OPENAI_API_KEY      = os.getenv("OPENAI_API_KEY", "")
OPENAI_VOICE_MALE   = "shimmer"
# OPENAI_VOICE_FEMALE = "echo"

# ── Catalogue audio ────────────────────────────────────────────
AUDIO_FILES = {

    # ── 28 Lettres (noms complets pour prononciation correcte) ──
    "letters/alif.mp3":      { "text": "أَلِف",    "gender": "female" },
    "letters/ba.mp3":        { "text": "بَاء",     "gender": "female" },
    "letters/ta.mp3":        { "text": "تَاء",     "gender": "female" },
    "letters/tha.mp3":       { "text": "ثَاء",     "gender": "female" },
    "letters/jim.mp3":       { "text": "جِيم",     "gender": "female" },
    "letters/ha_guttu.mp3":  { "text": "حَاء",     "gender": "female" },  # ح
    "letters/kha.mp3":       { "text": "خَاء",     "gender": "female" },
    "letters/dal.mp3":       { "text": "دَال",     "gender": "female" },
    "letters/dhal.mp3":      { "text": "ذَال",     "gender": "female" },
    "letters/ra.mp3":        { "text": "رَاء",     "gender": "female" },
    "letters/zay.mp3":       { "text": "زَاي",     "gender": "female" },
    "letters/sin.mp3":       { "text": "سِين",     "gender": "female" },
    "letters/shin.mp3":      { "text": "شِين",     "gender": "female" },
    "letters/sad.mp3":       { "text": "صَاد",     "gender": "female" },
    "letters/dad.mp3":       { "text": "ضَاد",     "gender": "female" },
    "letters/ta_emph.mp3":   { "text": "طَاء",     "gender": "female" },  # ط
    "letters/dha_emph.mp3":  { "text": "ظَاء",     "gender": "female" },  # ظ
    "letters/ayn.mp3":       { "text": "عَيْن",    "gender": "female" },
    "letters/ghayn.mp3":     { "text": "غَيْن",    "gender": "female" },
    "letters/fa.mp3":        { "text": "فَاء",     "gender": "female" },
    "letters/qaf.mp3":       { "text": "قَاف",     "gender": "female" },
    "letters/kaf.mp3":       { "text": "كَاف",     "gender": "female" },
    "letters/lam.mp3":       { "text": "لَام",     "gender": "female" },
    "letters/mim.mp3":       { "text": "مِيم",     "gender": "female" },
    "letters/nun.mp3":       { "text": "نُون",     "gender": "female" },
    "letters/ha.mp3":        { "text": "هَاء",     "gender": "female" },  # ه
    "letters/waw.mp3":       { "text": "وَاو",     "gender": "female" },
    "letters/ya.mp3":        { "text": "يَاء",     "gender": "female" },

    # ── Syllabes harakat ─────────────────────────────────────
    "syllables/ba_fatha.mp3":  { "text": "بَ", "gender": "female" },
    "syllables/ba_kasra.mp3":  { "text": "بِ", "gender": "female" },
    "syllables/ba_damma.mp3":  { "text": "بُ", "gender": "female" },
    "syllables/ba_sukun.mp3":  { "text": "بْ", "gender": "female" },
    "syllables/kaf_fatha.mp3": { "text": "كَ", "gender": "female" },
    "syllables/kaf_kasra.mp3": { "text": "كِ", "gender": "female" },
    "syllables/kaf_damma.mp3": { "text": "كُ", "gender": "female" },
    "syllables/ta_fatha.mp3":  { "text": "تَ", "gender": "female" },
    "syllables/ta_kasra.mp3":  { "text": "تِ", "gender": "female" },
    "syllables/ta_damma.mp3":  { "text": "تُ", "gender": "female" },
    "syllables/mim_fatha.mp3": { "text": "مَ", "gender": "female" },
    "syllables/mim_kasra.mp3": { "text": "مِ", "gender": "female" },
    "syllables/mim_damma.mp3": { "text": "مُ", "gender": "female" },
    "syllables/mim_sukun.mp3": { "text": "مْ", "gender": "female" },

    # ── Voyelles longues ─────────────────────────────────────
    "syllables/ba_alif_long.mp3":  { "text": "بَا", "gender": "female" },
    "syllables/ba_waw_long.mp3":   { "text": "بُو", "gender": "female" },
    "syllables/ba_ya_long.mp3":    { "text": "بِي", "gender": "female" },
    "syllables/kaf_alif_long.mp3": { "text": "كَا", "gender": "female" },
    "syllables/kaf_waw_long.mp3":  { "text": "كُو", "gender": "female" },
    "syllables/kaf_ya_long.mp3":   { "text": "كِي", "gender": "female" },

    # ── Tanwīn ───────────────────────────────────────────────
    "syllables/ba_tanwin_fath.mp3": { "text": "بً", "gender": "female" },
    "syllables/ba_tanwin_kasr.mp3": { "text": "بٍ", "gender": "female" },
    "syllables/ba_tanwin_damm.mp3": { "text": "بٌ", "gender": "female" },
    "syllables/ta_tanwin_fath.mp3":  {"text": "\u062a\u064b", "gender": "female"},
    "syllables/ta_tanwin_kasr.mp3":  {"text": "\u062a\u064d", "gender": "female"},
    "syllables/ta_tanwin_damm.mp3":  {"text": "\u062a\u064c", "gender": "female"},
    "syllables/kaf_tanwin_fath.mp3": {"text": "\u0643\u064b", "gender": "female"},
    "syllables/kaf_tanwin_kasr.mp3": {"text": "\u0643\u064d", "gender": "female"},
    "syllables/kaf_tanwin_damm.mp3": {"text": "\u0643\u064c", "gender": "female"},
    "syllables/mim_tanwin_fath.mp3": {"text": "\u0645\u064b", "gender": "female"},
    "syllables/mim_tanwin_kasr.mp3": {"text": "\u0645\u064d", "gender": "female"},
    "syllables/mim_tanwin_damm.mp3": {"text": "\u0645\u064c", "gender": "female"},

    # ── Mots ─────────────────────────────────────────────────
    "words/maktab.mp3":     { "text": "مَكْتَبٌ",   "gender": "male"   },
    "words/kitab.mp3":      { "text": "كِتَابٌ",    "gender": "male"   },
    "words/bab.mp3":        { "text": "بَابٌ",      "gender": "male"   },
    "words/kataba.mp3":     { "text": "كَتَبَ",     "gender": "male"   },
    "words/bayt.mp3":       { "text": "بَيْتٌ",     "gender": "male"   },
    "words/kub.mp3":        { "text": "كُوبٌ",      "gender": "male"   },
    "words/buma.mp3":       { "text": "بُومَةٌ",    "gender": "female" },
    "words/mama.mp3":       { "text": "مَامَا",     "gender": "female" },
    "words/kutub.mp3":      { "text": "كُتُبٌ",     "gender": "male"   },
    "words/katib.mp3":      { "text": "كَاتِبٌ",    "gender": "male"   },
    "words/maktaba.mp3":    { "text": "مَكْتَبَةٌ", "gender": "female" },
    "words/kitaba_nom.mp3": { "text": "كِتَابَةٌ",  "gender": "female" },
    "words/baba.mp3":       { "text": "بَابَا",     "gender": "female" },
    "words/katkut.mp3":     { "text": "كَتْكُوتٌ",  "gender": "female" },
    "words/mata.mp3":       { "text": "مَاتَ",      "gender": "male"   },
    "words/bata.mp3":       { "text": "بَاتَ",      "gender": "male"   },
    "words/tamma.mp3":      { "text": "تَمَّ",      "gender": "male"   },
    "words/katam.mp3":      { "text": "كَتَمَ",     "gender": "male"   },
    "words/bakat.mp3":      { "text": "بَكَتْ",     "gender": "female" },

    # ── Phrases ──────────────────────────────────────────────
    "phrases/mata_katkut.mp3":  { "text": "مَاتَ كَتْكُوتٌ",         "gender": "male"   },
    "phrases/bata_bubi.mp3":    { "text": "بَاتَ بُوبِي بِبَابِي",   "gender": "male"   },
    "phrases/kataba_katib.mp3": { "text": "كَتَبَ كَاتِبٌ كِتَاباً", "gender": "male"   },
    "phrases/bakat_mama.mp3":   { "text": "بَكَتْ مَامَا",           "gender": "female" },
}


# ── ElevenLabs ────────────────────────────────────────────────
def generate_elevenlabs(text: str, gender: str, api_key: str, output_path: Path) -> bool:
    voice_id = ELEVENLABS_VOICE_MALE if gender == "male" else ELEVENLABS_VOICE_FEMALE
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key,
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.75,
            "similarity_boost": 0.85,
            "style": 0.2,
            "use_speaker_boost": True,
        }
    }
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=30)
        if res.status_code == 200:
            output_path.write_bytes(res.content)
            return True
        else:
            print(f"    ✗ ElevenLabs {res.status_code}: {res.text[:120]}")
            return False
    except Exception as e:
        print(f"    ✗ ElevenLabs exception: {e}")
        return False


# ── OpenAI TTS ────────────────────────────────────────────────
def generate_openai(text: str, gender: str, api_key: str, output_path: Path) -> bool:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        voice = OPENAI_VOICE_MALE if gender == "male" else OPENAI_VOICE_FEMALE
        response = client.audio.speech.create(
            model="tts-1-hd",
            voice=voice,
            input=text,
            response_format="mp3",
        )
        output_path.write_bytes(response.content)
        return True
    except Exception as e:
        print(f"    ✗ OpenAI TTS error: {e}")
        return False


# ── Main ──────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Génération audio LangDad")
    parser.add_argument("--api", choices=["elevenlabs", "openai"], default="elevenlabs")
    parser.add_argument("--key", required=False, default="", help="Clé API (optionnel si dans .env)")
    parser.add_argument("--fallback-key", default="", help="Clé OpenAI pour fallback")
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--only", help="Générer seulement un dossier : letters | syllables | words | phrases")
    args = parser.parse_args()

    # Résoudre la clé API
    if args.api == "elevenlabs":
        api_key = args.key or ELEVENLABS_API_KEY
        if not api_key:
            print("❌ Clé ElevenLabs manquante — ajoutez ELEVENLABS_API_KEY dans backend/.env")
            sys.exit(1)
    else:
        api_key = args.key or OPENAI_API_KEY
        if not api_key:
            print("❌ Clé OpenAI manquante — ajoutez OPENAI_API_KEY dans backend/.env")
            sys.exit(1)

    fallback_key = args.fallback_key or OPENAI_API_KEY

    total = sum(1 for k in AUDIO_FILES if not args.only or k.startswith(args.only))

    print(f"\n🎙️  Génération audio LangDad")
    print(f"   API        : {args.api}")
    print(f"   Voix homme : {ELEVENLABS_VOICE_MALE}")
    print(f"   Voix femme : {ELEVENLABS_VOICE_FEMALE}")
    print(f"   Sortie     : {OUTPUT_DIR}")
    print(f"   Filtre     : {args.only or 'tous'}")
    print(f"   Total      : {total} fichiers\n")

    success = 0
    skipped = 0
    failed  = 0
    failed_files = []

    for rel_path, config in AUDIO_FILES.items():
        if args.only and not rel_path.startswith(args.only):
            continue

        output_path = OUTPUT_DIR / rel_path
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if args.skip_existing and output_path.exists() and output_path.stat().st_size > 0:
            print(f"  ⏭  {rel_path}")
            skipped += 1
            continue

        print(f"  🔊 {rel_path} — '{config['text']}' ({config['gender']})")

        ok = False
        if args.api == "elevenlabs":
            ok = generate_elevenlabs(config["text"], config["gender"], api_key, output_path)
            if not ok and fallback_key:
                print(f"    → Fallback OpenAI…")
                ok = generate_openai(config["text"], config["gender"], fallback_key, output_path)
        else:
            ok = generate_openai(config["text"], config["gender"], api_key, output_path)

        if ok:
            size = output_path.stat().st_size // 1024
            print(f"    ✓ {size} KB")
            success += 1
        else:
            failed += 1
            failed_files.append(rel_path)

        time.sleep(0.6)

    print(f"\n{'='*50}")
    print(f"✅ Succès  : {success}")
    print(f"⏭  Ignorés : {skipped}")
    print(f"❌ Échecs  : {failed}")
    if failed_files:
        print(f"\nFichiers en échec :")
        for f in failed_files:
            print(f"  - {f}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()