"""
LangDad — Extraction des glyphes arabes
========================================
Extrait les paths SVG des lettres arabes depuis la police Noto Naskh Arabic
et génère un fichier JSON utilisable pour les animations de tracé.

Usage :
    cd backend
    pip install fonttools --break-system-packages
    python extract_glyphs.py

Le script cherche la police dans :
    1. backend/fonts/NotoNaskhArabic-Bold.ttf
    2. Chemins système Windows
    3. Téléchargement automatique si absent
"""

import json
import math
import sys
import os
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

# ── Lettres à extraire ─────────────────────────────────────────
# Chaque entrée : (unicode, nom, forme)
LETTERS = [
    # Module 1
    (0x0628, 'ba',  'isolated',  'ب'),
    (0x0643, 'kaf', 'isolated',  'ك'),
    (0x062A, 'ta',  'isolated',  'ت'),
    (0x0645, 'mim', 'isolated',  'م'),
    # Formes initiales
    (0xFE91, 'ba_initial',  'initial', 'بـ'),
    (0xFEDF, 'kaf_initial', 'initial', 'كـ'),
    (0xFE97, 'ta_initial',  'initial', 'تـ'),
    (0xFEE3, 'mim_initial', 'initial', 'مـ'),
]

def find_font():
    """Cherche la police Noto Naskh Arabic sur le système."""
    candidates = [
        Path(__file__).parent / "fonts" / "NotoNaskhArabic-Bold.ttf",
        Path(__file__).parent / "fonts" / "NotoNaskhArabic-Regular.ttf",
        Path("C:/Windows/Fonts/NotoNaskhArabic-Bold.ttf"),
        Path("C:/Windows/Fonts/NotoNaskhArabic-Regular.ttf"),
        Path.home() / "AppData/Local/Microsoft/Windows/Fonts/NotoNaskhArabic-Bold.ttf",
    ]
    for p in candidates:
        if p.exists():
            print(f"[OK] Police trouvée : {p}")
            return p
    return None


def download_font():
    """Télécharge Noto Naskh Arabic Bold si absent."""
    import urllib.request
    fonts_dir = Path(__file__).parent / "fonts"
    fonts_dir.mkdir(exist_ok=True)
    dest = fonts_dir / "NotoNaskhArabic-Bold.ttf"
    url = "https://github.com/notofonts/arabic/releases/download/NotoNaskhArabic-v2.004/NotoNaskhArabic-Bold.ttf"
    print(f"[DOWNLOAD] Téléchargement de la police...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"[OK] Police sauvegardée : {dest}")
        return dest
    except Exception as e:
        print(f"[ERREUR] Téléchargement échoué : {e}")
        return None


def normalize_path(d: str, units_per_em: int, target_size: int = 200) -> str:
    """
    Normalise un path SVG :
    - Retourne verticalement (les polices ont Y inversé)
    - Met à l'échelle pour tenir dans target_size x target_size
    - Centre dans une viewBox 280x280
    """
    scale = target_size / units_per_em

    # Parser les coordonnées pour trouver bbox
    import re
    coords = [float(n) for n in re.findall(r'-?\d+\.?\d*', d)]
    if not coords:
        return d

    # Appliquer transform : scale + flip Y
    # On utilise une transformation matricielle simple
    # M x y → M x*s (bbox_h - y*s) pour flip Y
    result = []
    i = 0
    tokens = d.split()
    # Simple approche : recalculer via fonttools transform

    return d  # retourné tel quel, la transformation est faite via TransformPen


def extract_glyph_path(font, char_code: int, target_size: int = 180) -> dict | None:
    """Extrait le path SVG d'un glyphe et le normalise."""
    try:
        cmap = font.getBestCmap()
        if char_code not in cmap:
            return None

        glyph_name = cmap[char_code]
        glyph_set  = font.getGlyphSet()

        if glyph_name not in glyph_set:
            return None

        glyph = glyph_set[glyph_name]
        units = font['head'].unitsPerEm

        # Calculer bbox
        pen_bbox = SVGPathPen(glyph_set)
        try:
            glyph.draw(pen_bbox)
        except Exception:
            return None

        raw_d = pen_bbox.getCommands()
        if not raw_d:
            return None

        # Scale + flip Y + centrer dans 280x280
        scale = target_size / units
        # La transformation : x' = x*scale + offset_x, y' = -y*scale + offset_y
        # offset pour centrer approximativement
        offset_x = (280 - target_size) / 2
        offset_y = (280 + target_size) / 2

        pen2 = SVGPathPen(glyph_set)
        from fontTools.pens.transformPen import TransformPen
        # matrice : (xx, xy, yx, yy, dx, dy)
        # flip Y : (scale, 0, 0, -scale, offset_x, offset_y)
        transform = (scale, 0, 0, -scale, offset_x, offset_y)
        t_pen = TransformPen(pen2, transform)
        glyph.draw(t_pen)

        d = pen2.getCommands()
        if not d:
            return None

        # Largeur avance
        advance = round(glyph.width * scale)

        return {
            "char_code": char_code,
            "glyph_name": glyph_name,
            "path": d,
            "advance": advance,
            "viewBox": "0 0 280 280",
        }

    except Exception as e:
        print(f"  [WARN] Impossible d'extraire U+{char_code:04X} : {e}")
        return None


def main():
    # Trouver ou télécharger la police
    font_path = find_font()
    if not font_path:
        print("[INFO] Police non trouvée localement — tentative de téléchargement...")
        font_path = download_font()
    if not font_path:
        print("[ERREUR] Impossible de trouver la police. Placez NotoNaskhArabic-Bold.ttf dans backend/fonts/")
        sys.exit(1)

    print(f"[INFO] Chargement de la police...")
    font = TTFont(font_path)
    units = font['head'].unitsPerEm
    print(f"[INFO] unitsPerEm = {units}")

    results = {}
    for char_code, key, form, display in LETTERS:
        print(f"  Extraction U+{char_code:04X} ({display} — {key})...")
        data = extract_glyph_path(font, char_code, target_size=180)
        if data:
            results[key] = {
                "char": display,
                "form": form,
                "path": data["path"],
                "viewBox": data["viewBox"],
                "advance": data["advance"],
            }
            print(f"    [OK] path length = {len(data['path'])} chars")
        else:
            print(f"    [SKIP] glyphe non trouvé")

    # Sauvegarder
    out = Path(__file__).parent.parent / "frontend" / "src" / "data" / "arabic-glyphs.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n[✓] {len(results)} glyphes extraits → {out}")
    print("\nGlyphes disponibles :")
    for key, data in results.items():
        print(f"  {data['char']} ({key}) — path: {len(data['path'])} chars")


if __name__ == "__main__":
    main()