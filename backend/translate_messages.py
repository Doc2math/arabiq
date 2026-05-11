"""
Script de traduction — backend/translate_messages.py
Traduit frontend/messages/fr.json vers en, es, de, nl via OpenAI.
Ne traduit que les nouvelles clés manquantes par défaut.

Usage:
    cd backend
    python translate_messages.py              # traduit uniquement les nouvelles clés
    python translate_messages.py --force      # retraduit tout
    python translate_messages.py --lang en    # une seule langue
"""

import json
import sys
import argparse
import os
import copy
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

SOURCE_LANG  = "fr"
TARGET_LANGS = ["en", "es", "de", "nl"]
LANG_NAMES   = {
    "en": "English",
    "es": "Spanish (Español)",
    "de": "German (Deutsch)",
    "nl": "Dutch (Nederlands)",
}

MESSAGES_DIR = Path(__file__).parent.parent / "frontend" / "messages"


def collect_strings(obj, path=""):
    """Collecte toutes les chaînes avec leur chemin pointé."""
    strings = {}
    if isinstance(obj, str):
        strings[path] = obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            new_path = f"{path}.{k}" if path else k
            strings.update(collect_strings(v, new_path))
    return strings


def get_nested(obj, path):
    """Récupère une valeur dans un dict imbriqué via un chemin pointé."""
    try:
        keys = path.split(".")
        for key in keys:
            obj = obj[key]
        return obj
    except (KeyError, TypeError):
        return None


def set_nested(obj, path, value):
    """Définit une valeur dans un dict imbriqué via un chemin pointé."""
    keys = path.split(".")
    for key in keys[:-1]:
        if key not in obj:
            obj[key] = {}
        obj = obj[key]
    obj[keys[-1]] = value


def translate_json_keys(strings: dict, target_lang: str, client: OpenAI) -> dict:
    """Traduit un dict plat de {chemin: valeur_fr} vers la langue cible."""
    if not strings:
        return {}

    # Découper en chunks pour éviter les coupures
    CHUNK_SIZE = 80
    items  = list(strings.items())
    chunks = [dict(items[i:i+CHUNK_SIZE]) for i in range(0, len(items), CHUNK_SIZE)]
    result = {}

    for idx, chunk in enumerate(chunks):
        if len(chunks) > 1:
            print(f"      chunk {idx+1}/{len(chunks)}...")

        strings_json = json.dumps(chunk, ensure_ascii=False, indent=2)

        prompt = f"""Translate the following JSON object values from French to {LANG_NAMES[target_lang]}.

RULES:
- Translate ONLY the values (strings), never the keys
- Keep all placeholders like {{name}}, {{count}}, {{score}}, {{xp}}, {{level}}, {{date}}, {{module}}, {{number}}, {{max}}, {{type}}, {{days}} EXACTLY as they are
- Keep emojis as-is
- Keep special characters like -> and . as-is
- For Arabic learning terms (harakat, tanwin, sukun, fatha, kasra, damma), keep them as-is
- Return ONLY valid JSON, no explanation, no markdown, no code blocks

French JSON:
{strings_json}"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=4096,
            )

            translated_text = response.choices[0].message.content.strip()

            if translated_text.startswith("```"):
                lines = translated_text.split("\n")
                translated_text = "\n".join(lines[1:-1])

            parsed = json.loads(translated_text)
            result.update(parsed)

        except json.JSONDecodeError as e:
            print(f"      Erreur JSON chunk {idx+1}: {e}")
        except Exception as e:
            print(f"      Erreur chunk {idx+1}: {e}")

    return result


def main():
    parser = argparse.ArgumentParser(description="Traduction des messages LangDad")
    parser.add_argument("--force", action="store_true", help="Retraduit tout même si déjà traduit")
    parser.add_argument("--lang",  type=str, default=None, help="Traduire une seule langue (ex: en)")
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY manquante dans .env")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    source_file = MESSAGES_DIR / f"{SOURCE_LANG}.json"
    if not source_file.exists():
        print(f"Fichier source introuvable: {source_file}")
        sys.exit(1)

    with open(source_file, encoding="utf-8") as f:
        source_data = json.load(f)

    source_strings = collect_strings(source_data)
    print(f"\nTraduction des messages LangDad")
    print(f"Source: {source_file}")
    print(f"Cles totales: {len(source_strings)}\n")

    langs = [args.lang] if args.lang else TARGET_LANGS

    for lang in langs:
        if lang not in TARGET_LANGS:
            print(f"Langue inconnue: {lang}. Valeurs acceptees: {TARGET_LANGS}")
            continue

        target_file = MESSAGES_DIR / f"{lang}.json"

        # Charger le fichier existant si présent
        existing_data = {}
        if target_file.exists():
            try:
                with open(target_file, encoding="utf-8") as f:
                    existing_data = json.load(f)
            except Exception:
                existing_data = {}

        if args.force:
            to_translate = source_strings
            result       = copy.deepcopy(source_data)
            print(f"  {lang} — traduction forcee ({len(to_translate)} cles)...")
        else:
            missing = {
                path: value
                for path, value in source_strings.items()
                if get_nested(existing_data, path) is None
            }

            if not missing:
                print(f"  {lang} — deja a jour ({len(source_strings)} cles)")
                continue

            to_translate = missing
            result       = copy.deepcopy(existing_data)
            print(f"  {lang} — {len(missing)} nouvelles cles a traduire...")

        try:
            translated = translate_json_keys(to_translate, lang, client)

            for path, value in translated.items():
                set_nested(result, path, value)

            with open(target_file, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            print(f"  OK {lang} — {len(translated)} cles traduites")

        except Exception as e:
            print(f"  ERREUR {lang}: {e}")

    print("\nTermine!\n")


if __name__ == "__main__":
    main()