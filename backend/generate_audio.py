# -*- coding: utf-8 -*-
"""
Script de generation audio — LangDad
Usage:
    python generate_audio.py --api elevenlabs
    python generate_audio.py --api elevenlabs --only syllables
    python generate_audio.py --api elevenlabs --only letters
    python generate_audio.py --api elevenlabs --only words
    python generate_audio.py --api elevenlabs --only phrases
"""

import os
import sys
import time
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv("backend/.env")

OUTPUT_DIR = Path("frontend/public/assets/audio")

ELEVENLABS_API_KEY      = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_MALE   = os.getenv("ELEVENLABS_VOICE_MALE", "pNInz6obpgDQGcFmaJgB")
ELEVENLABS_VOICE_FEMALE = os.getenv("ELEVENLABS_VOICE_FEMALE", "EXAVITQu4vr4xnSDxMaL")
OPENAI_API_KEY          = os.getenv("OPENAI_API_KEY", "")
OPENAI_VOICE_MALE       = "shimmer"

AUDIO_FILES = {
    # 28 Lettres
    "letters/alif.mp3":      {"text": "\u0623\u064e\u0644\u0650\u0641",                "gender": "female"},
    "letters/ba.mp3":        {"text": "\u0628\u064e\u0627\u0621",                       "gender": "female"},
    "letters/ta.mp3":        {"text": "\u062a\u064e\u0627\u0621",                       "gender": "female"},
    "letters/tha.mp3":       {"text": "\u062b\u064e\u0627\u0621",                       "gender": "female"},
    "letters/jim.mp3":       {"text": "\u062c\u0650\u064a\u0645",                       "gender": "female"},
    "letters/ha_guttu.mp3":  {"text": "\u062d\u064e\u0627\u0621",                       "gender": "female"},
    "letters/kha.mp3":       {"text": "\u062e\u064e\u0627\u0621",                       "gender": "female"},
    "letters/dal.mp3":       {"text": "\u062f\u064e\u0627\u0644",                       "gender": "female"},
    "letters/dhal.mp3":      {"text": "\u0630\u064e\u0627\u0644",                       "gender": "female"},
    "letters/ra.mp3":        {"text": "\u0631\u064e\u0627\u0621",                       "gender": "female"},
    "letters/zay.mp3":       {"text": "\u0632\u064e\u0627\u064a",                       "gender": "female"},
    "letters/sin.mp3":       {"text": "\u0633\u0650\u064a\u0646",                       "gender": "female"},
    "letters/shin.mp3":      {"text": "\u0634\u0650\u064a\u0646",                       "gender": "female"},
    "letters/sad.mp3":       {"text": "\u0635\u064e\u0627\u062f",                       "gender": "female"},
    "letters/dad.mp3":       {"text": "\u0636\u064e\u0627\u062f",                       "gender": "female"},
    "letters/ta_emph.mp3":   {"text": "\u0637\u064e\u0627\u0621",                       "gender": "female"},
    "letters/dha_emph.mp3":  {"text": "\u0638\u064e\u0627\u0621",                       "gender": "female"},
    "letters/ayn.mp3":       {"text": "\u0639\u064e\u064a\u0652\u0646",                 "gender": "female"},
    "letters/ghayn.mp3":     {"text": "\u063a\u064e\u064a\u0646",                       "gender": "female"},
    "letters/fa.mp3":        {"text": "\u0641\u064e\u0627\u0621",                       "gender": "female"},
    "letters/qaf.mp3":       {"text": "\u0642\u064e\u0627\u0641",                       "gender": "female"},
    "letters/kaf.mp3":       {"text": "\u0643\u064e\u0627\u0641",                       "gender": "female"},
    "letters/lam.mp3":       {"text": "\u0644\u064e\u0627\u0645",                       "gender": "female"},
    "letters/mim.mp3":       {"text": "\u0645\u0650\u064a\u0645",                       "gender": "female"},
    "letters/nun.mp3":       {"text": "\u0646\u064f\u0648\u0646",                       "gender": "female"},
    "letters/ha.mp3":        {"text": "\u0647\u064e\u0627\u0621",                       "gender": "female"},
    "letters/waw.mp3":       {"text": "\u0648\u064e\u0627\u0648",                       "gender": "female"},
    "letters/ya.mp3":        {"text": "\u064a\u064e\u0627\u0621",                       "gender": "female"},

    # Syllabes harakat
    "syllables/ba_fatha.mp3":  {"text": "\u0628\u064e", "gender": "female"},
    "syllables/ba_kasra.mp3":  {"text": "\u0628\u0650", "gender": "female"},
    "syllables/ba_damma.mp3":  {"text": "\u0628\u064f", "gender": "female"},
    "syllables/ba_sukun.mp3":  {"text": "\u0628\u0652", "gender": "female"},
    "syllables/kaf_fatha.mp3": {"text": "\u0643\u064e", "gender": "female"},
    "syllables/kaf_kasra.mp3": {"text": "\u0643\u0650", "gender": "female"},
    "syllables/kaf_damma.mp3": {"text": "\u0643\u064f", "gender": "female"},
    "syllables/kaf_sukun.mp3": {"text": "\u0643\u0652", "gender": "female"},
    "syllables/ta_fatha.mp3":  {"text": "\u062a\u064e", "gender": "female"},
    "syllables/ta_kasra.mp3":  {"text": "\u062a\u0650", "gender": "female"},
    "syllables/ta_damma.mp3":  {"text": "\u062a\u064f", "gender": "female"},
    "syllables/ta_sukun.mp3":  {"text": "\u062a\u0652", "gender": "female"},
    "syllables/mim_fatha.mp3": {"text": "\u0645\u064e", "gender": "female"},
    "syllables/mim_kasra.mp3": {"text": "\u0645\u0650", "gender": "female"},
    "syllables/mim_damma.mp3": {"text": "\u0645\u064f", "gender": "female"},
    "syllables/mim_sukun.mp3": {"text": "\u0645\u0652", "gender": "female"},

    # Voyelles longues
    "syllables/ba_alif_long.mp3":  {"text": "\u0628\u064e\u0627", "gender": "female"},
    "syllables/ba_waw_long.mp3":   {"text": "\u0628\u064f\u0648", "gender": "female"},
    "syllables/ba_ya_long.mp3":    {"text": "\u0628\u0650\u064a", "gender": "female"},
    "syllables/kaf_alif_long.mp3": {"text": "\u0643\u064e\u0627", "gender": "female"},
    "syllables/kaf_waw_long.mp3":  {"text": "\u0643\u064f\u0648", "gender": "female"},
    "syllables/kaf_ya_long.mp3":   {"text": "\u0643\u0650\u064a", "gender": "female"},
    "syllables/ta_alif_long.mp3":  {"text": "\u062a\u064e\u0627", "gender": "female"},
    "syllables/ta_waw_long.mp3":   {"text": "\u062a\u064f\u0648", "gender": "female"},
    "syllables/ta_ya_long.mp3":    {"text": "\u062a\u0650\u064a", "gender": "female"},
    "syllables/mim_alif_long.mp3": {"text": "\u0645\u064e\u0627", "gender": "female"},
    "syllables/mim_waw_long.mp3":  {"text": "\u0645\u064f\u0648", "gender": "female"},
    "syllables/mim_ya_long.mp3":   {"text": "\u0645\u0650\u064a", "gender": "female"},

    # Tanwin
    "syllables/ba_tanwin_fath.mp3": {"text": "\u0628\u064b", "gender": "female"},
    "syllables/ba_tanwin_kasr.mp3": {"text": "\u0628\u064d", "gender": "female"},
    "syllables/ba_tanwin_damm.mp3": {"text": "\u0628\u064c", "gender": "female"},
    "syllables/ta_tanwin_fath.mp3":  {"text": "\u062a\u064b", "gender": "female"},
    "syllables/ta_tanwin_kasr.mp3":  {"text": "\u062a\u064d", "gender": "female"},
    "syllables/ta_tanwin_damm.mp3":  {"text": "\u062a\u064c", "gender": "female"},
    "syllables/kaf_tanwin_fath.mp3": {"text": "\u0643\u064b", "gender": "female"},
    "syllables/kaf_tanwin_kasr.mp3": {"text": "\u0643\u064d", "gender": "female"},
    "syllables/kaf_tanwin_damm.mp3": {"text": "\u0643\u064c", "gender": "female"},
    "syllables/mim_tanwin_fath.mp3": {"text": "\u0645\u064b", "gender": "female"},
    "syllables/mim_tanwin_kasr.mp3": {"text": "\u0645\u064d", "gender": "female"},
    "syllables/mim_tanwin_damm.mp3": {"text": "\u0645\u064c", "gender": "female"},

    # Mots
    "words/maktab.mp3":     {"text": "\u0645\u064e\u0643\u0652\u062a\u064e\u0628\u064c",            "gender": "male"},
    "words/kitab.mp3":      {"text": "\u0643\u0650\u062a\u064e\u0627\u0628\u064c",                  "gender": "male"},
    "words/bab.mp3":        {"text": "\u0628\u064e\u0627\u0628\u064c",                              "gender": "male"},
    "words/kataba.mp3":     {"text": "\u0643\u064e\u062a\u064e\u0628\u064e",                        "gender": "male"},
    "words/bayt.mp3":       {"text": "\u0628\u064e\u064a\u0652\u062a\u064c",                        "gender": "male"},
    "words/kub.mp3":        {"text": "\u0643\u064f\u0648\u0628\u064c",                              "gender": "male"},
    "words/buma.mp3":       {"text": "\u0628\u064f\u0648\u0645\u064e\u0629\u064c",                  "gender": "female"},
    "words/mama.mp3":       {"text": "\u0645\u064e\u0627\u0645\u064e\u0627",                        "gender": "female"},
    "words/kutub.mp3":      {"text": "\u0643\u064f\u062a\u064f\u0628\u064c",                        "gender": "male"},
    "words/katib.mp3":      {"text": "\u0643\u064e\u0627\u062a\u0650\u0628\u064c",                  "gender": "male"},
    "words/maktaba.mp3":    {"text": "\u0645\u064e\u0643\u0652\u062a\u064e\u0628\u064e\u0629\u064c","gender": "female"},
    "words/kitaba_nom.mp3": {"text": "\u0643\u0650\u062a\u064e\u0627\u0628\u064e\u0629\u064c",      "gender": "female"},
    "words/baba.mp3":       {"text": "\u0628\u064e\u0627\u0628\u064e\u0627",                        "gender": "female"},
    "words/katkut.mp3":     {"text": "\u0643\u064e\u062a\u0652\u0643\u064f\u0648\u062a\u064c",      "gender": "female"},
    "words/mata.mp3":       {"text": "\u0645\u064e\u0627\u062a\u064e",                              "gender": "male"},
    "words/bata.mp3":       {"text": "\u0628\u064e\u0627\u062a\u064e",                              "gender": "male"},
    "words/tamma.mp3":      {"text": "\u062a\u064e\u0645\u064e\u0651",                              "gender": "male"},
    "words/katam.mp3":      {"text": "\u0643\u064e\u062a\u064e\u0645\u064e",                        "gender": "male"},
    "words/bakat.mp3":      {"text": "\u0628\u064e\u0643\u064e\u062a\u0652",                        "gender": "female"},

    # Phrases
    "phrases/mata_katkut.mp3":  {"text": "\u0645\u064e\u0627\u062a\u064e \u0643\u064e\u062a\u0652\u0643\u064f\u0648\u062a\u064c",                                          "gender": "male"},
    "phrases/bata_bubi.mp3":    {"text": "\u0628\u064e\u0627\u062a\u064e \u0628\u064f\u0648\u0628\u0650\u064a \u0628\u0650\u0628\u064e\u0627\u0628\u0650\u064a",            "gender": "male"},
    "phrases/kataba_katib.mp3": {"text": "\u0643\u064e\u062a\u064e\u0628\u064e \u0643\u064e\u0627\u062a\u0650\u0628\u064c \u0643\u0650\u062a\u064e\u0627\u0628\u064b",      "gender": "male"},
    "phrases/bakat_mama.mp3":   {"text": "\u0628\u064e\u0643\u064e\u062a\u0652 \u0645\u064e\u0627\u0645\u064e\u0627",                                                      "gender": "female"},
# ── Module 2 — Syllabes ث ل ج ──────────────────────────
    # Harakat Jim
    "syllables/jim_fatha.mp3":  {"text": "جَ", "gender": "female"},
    "syllables/jim_kasra.mp3":  {"text": "جِ", "gender": "female"},
    "syllables/jim_damma.mp3":  {"text": "جُ", "gender": "female"},
    "syllables/jim_sukun.mp3":  {"text": "جْ", "gender": "female"},
    # Harakat Lam
    "syllables/lam_fatha.mp3":  {"text": "لَ", "gender": "female"},
    "syllables/lam_kasra.mp3":  {"text": "لِ", "gender": "female"},
    "syllables/lam_damma.mp3":  {"text": "لُ", "gender": "female"},
    "syllables/lam_sukun.mp3":  {"text": "لْ", "gender": "female"},
    # Harakat Tha
    "syllables/tha_fatha.mp3":  {"text": "ثَ", "gender": "female"},
    "syllables/tha_kasra.mp3":  {"text": "ثِ", "gender": "female"},
    "syllables/tha_damma.mp3":  {"text": "ثُ", "gender": "female"},
    "syllables/tha_sukun.mp3":  {"text": "ثْ", "gender": "female"},
    # Voyelles longues Jim
    "syllables/jim_alif_long.mp3": {"text": "جَا", "gender": "female"},
    "syllables/jim_waw_long.mp3":  {"text": "جُو", "gender": "female"},
    "syllables/jim_ya_long.mp3":   {"text": "جِي", "gender": "female"},
    # Voyelles longues Lam
    "syllables/lam_alif_long.mp3": {"text": "لَا", "gender": "female"},
    "syllables/lam_waw_long.mp3":  {"text": "لُو", "gender": "female"},
    "syllables/lam_ya_long.mp3":   {"text": "لِي", "gender": "female"},
    # Voyelles longues Tha
    "syllables/tha_alif_long.mp3": {"text": "ثَا", "gender": "female"},
    "syllables/tha_waw_long.mp3":  {"text": "ثُو", "gender": "female"},
    "syllables/tha_ya_long.mp3":   {"text": "ثِي", "gender": "female"},

    # ── Module 2 — Mots ──────────────────────────────────────
    "words/thalj.mp3":     {"text": "ثَلْجٌ",     "gender": "male"},
    "words/jiil.mp3":      {"text": "جِيلٌ",      "gender": "male"},
    "words/kalb.mp3":      {"text": "كَلْبٌ",     "gender": "male"},
    "words/jamiil.mp3":    {"text": "جَمِيلٌ",    "gender": "male"},
    "words/kalima.mp3":    {"text": "كَلِمَةٌ",   "gender": "female"},
    "words/jabal.mp3":     {"text": "جَبَلٌ",     "gender": "male"},
    "words/maal.mp3":      {"text": "مَالٌ",      "gender": "male"},
    "words/labitha.mp3":   {"text": "لَبِثَ",     "gender": "male"},
    "words/thabit.mp3":    {"text": "ثَابِتٌ",    "gender": "male"},
    "words/timthaal.mp3":  {"text": "تِمْثَالٌ",  "gender": "male"},
    "words/mithaal.mp3":   {"text": "مِثَالٌ",    "gender": "male"},
    "words/malik.mp3":     {"text": "مَلِكٌ",     "gender": "male"},
    "words/mamlaka.mp3":   {"text": "مَمْلَكَةٌ", "gender": "female"},
    "words/thabbata.mp3":  {"text": "ثَبَّتَ",    "gender": "male"},
    "words/kallama.mp3":   {"text": "كَلَّمَ",    "gender": "male"},
    "words/malaka.mp3":    {"text": "مَلَكَ",     "gender": "male"},
    "words/jamaal.mp3":    {"text": "جَمَالٌ",    "gender": "male"},
    "words/kulthuum.mp3":  {"text": "كُلْثُومٌ",  "gender": "female"},

    # ── Module 2 — Phrases ────────────────────────────────────
    "phrases/malaka_malik.mp3":     {"text": "مَلَكَ مَلِكٌ مَمْلَكَةً",    "gender": "male"},
    "phrases/timthaal_jamiil.mp3":  {"text": "تِمْثَالٌ جَمِيلٌ",           "gender": "male"},
    "phrases/kallama_jamaal.mp3":   {"text": "كَلَّمَ جَمَالٌ مَلِكاً",     "gender": "male"},
    "phrases/jalabat_kulthuum.mp3": {"text": "جَلَبَتْ كُلْثُومُ جُبَّةً",  "gender": "female"},


}


def generate_elevenlabs(text, gender, api_key, output_path):
    voice_id = ELEVENLABS_VOICE_MALE if gender == "male" else ELEVENLABS_VOICE_FEMALE
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {"Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": api_key}
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.75, "similarity_boost": 0.85, "style": 0.2, "use_speaker_boost": True}
    }
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=30)
        if res.status_code == 200:
            output_path.write_bytes(res.content)
            return True
        print(f"    ERREUR ElevenLabs {res.status_code}: {res.text[:120]}")
        return False
    except Exception as e:
        print(f"    ERREUR ElevenLabs: {e}")
        return False


def generate_openai(text, gender, api_key, output_path):
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.audio.speech.create(model="tts-1-hd", voice=OPENAI_VOICE_MALE, input=text, response_format="mp3")
        output_path.write_bytes(response.content)
        return True
    except Exception as e:
        print(f"    ERREUR OpenAI: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", choices=["elevenlabs", "openai"], default="elevenlabs")
    parser.add_argument("--key", default="")
    parser.add_argument("--fallback-key", default="")
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--only", default=None)
    args = parser.parse_args()

    api_key = args.key or (ELEVENLABS_API_KEY if args.api == "elevenlabs" else OPENAI_API_KEY)
    if not api_key:
        print("Cle API manquante")
        sys.exit(1)

    fallback_key = args.fallback_key or OPENAI_API_KEY
    total = sum(1 for k in AUDIO_FILES if not args.only or k.startswith(args.only))

    print(f"\nGeneration audio — {total} fichiers — filtre: {args.only or 'tous'}\n")

    success = skipped = failed = 0
    failed_files = []

    for rel_path, config in AUDIO_FILES.items():
        if args.only and not rel_path.startswith(args.only):
            continue

        output_path = OUTPUT_DIR / rel_path
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if args.skip_existing and output_path.exists() and output_path.stat().st_size > 0:
            print(f"  skip  {rel_path}")
            skipped += 1
            continue

        print(f"  gen   {rel_path}")

        ok = False
        if args.api == "elevenlabs":
            ok = generate_elevenlabs(config["text"], config["gender"], api_key, output_path)
            if not ok and fallback_key:
                ok = generate_openai(config["text"], config["gender"], fallback_key, output_path)
        else:
            ok = generate_openai(config["text"], config["gender"], api_key, output_path)

        if ok:
            print(f"    OK {output_path.stat().st_size // 1024} KB")
            success += 1
        else:
            failed += 1
            failed_files.append(rel_path)

        time.sleep(0.6)

    print(f"\nSucces: {success} | Ignores: {skipped} | Echecs: {failed}")
    if failed_files:
        print("Echecs:")
        for f in failed_files:
            print(f"  {f}")


if __name__ == "__main__":
    main()