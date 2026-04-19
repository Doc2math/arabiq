"""
LangDad — Extraction du skeleton des lettres arabes
=====================================================
Calcule l'axe médian (skeleton) de chaque lettre à partir de son path SVG.

Usage :
    cd backend
    pip install fonttools numpy scikit-image --break-system-packages
    python extract_skeleton.py
"""

import json
import numpy as np
import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
except ImportError:
    print("[ERREUR] pip install fonttools --break-system-packages")
    sys.exit(1)

try:
    from skimage.morphology import skeletonize
    from skimage.draw import polygon
    import skimage
except ImportError:
    print("[ERREUR] pip install scikit-image numpy --break-system-packages")
    sys.exit(1)

try:
    import xml.etree.ElementTree as ET
    from svg.path import parse_path
    from svg.path.path import Line, CubicBezier, QuadraticBezier, Arc, Move, Close
except ImportError:
    print("[INFO] pip install svg.path --break-system-packages")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "svg.path", "--break-system-packages"])
    from svg.path import parse_path
    from svg.path.path import Line, CubicBezier, QuadraticBezier, Arc, Move, Close


FONT_PATH = Path(__file__).parent / "fonts" / "NotoNaskhArabic-Bold.ttf"

LETTERS = [
    (0x0628, 'ba',  'ب'),
    (0x0643, 'kaf', 'ك'),
    (0x062A, 'ta',  'ت'),
    (0x0645, 'mim', 'م'),
]

SIZE = 200  # taille de la grille raster


def extract_path(font, char_code: int) -> str | None:
    """Extrait le path SVG d'un glyphe normalisé dans SIZE x SIZE."""
    cmap = font.getBestCmap()
    if char_code not in cmap:
        return None
    glyph_name = cmap[char_code]
    glyph_set  = font.getGlyphSet()
    if glyph_name not in glyph_set:
        return None

    units = font['head'].unitsPerEm
    scale = (SIZE * 0.8) / units
    offset_x = SIZE * 0.1
    offset_y = SIZE * 0.9

    pen = SVGPathPen(glyph_set)
    transform = (scale, 0, 0, -scale, offset_x, offset_y)
    t_pen = TransformPen(pen, transform)
    glyph_set[glyph_name].draw(t_pen)
    return pen.getCommands()


def path_to_bitmap(d: str, size: int) -> np.ndarray:
    """Convertit un path SVG en bitmap binaire."""
    try:
        path = parse_path(d)
    except Exception as e:
        print(f"  [WARN] parse_path failed: {e}")
        return np.zeros((size, size), dtype=bool)

    # Rasteriser le path en échantillonnant des points
    img = np.zeros((size, size), dtype=np.uint8)

    # Collecter les points du contour
    points_x = []
    points_y = []
    n_samples = 500

    for i in range(n_samples + 1):
        t = i / n_samples
        try:
            pt = path.point(t)
            x, y = pt.real, pt.imag
            if 0 <= x < size and 0 <= y < size:
                points_x.append(x)
                points_y.append(y)
        except Exception:
            continue

    if len(points_x) < 3:
        return img.astype(bool)

    # Remplir le polygone
    try:
        rr, cc = polygon(
            np.array(points_y, dtype=float),
            np.array(points_x, dtype=float),
            shape=(size, size)
        )
        img[rr, cc] = 1
    except Exception as e:
        print(f"  [WARN] polygon fill failed: {e}")

    return img.astype(bool)


def bitmap_to_skeleton_path(bitmap: np.ndarray, size: int) -> str:
    """Calcule le skeleton et extrait un path SVG simplifié."""
    from skimage.morphology import skeletonize, remove_small_objects
    from skimage.measure import label, find_contours

    # Nettoyer
    clean = remove_small_objects(bitmap, min_size=10)
    if not clean.any():
        return ""

    # Skeletonize
    skel = skeletonize(clean)

    # Extraire les coordonnées du skeleton
    ys, xs = np.where(skel)
    if len(xs) == 0:
        return ""

    # Trier les points pour former un chemin continu
    # Algorithme greedy nearest-neighbor
    points = list(zip(xs.tolist(), ys.tolist()))

    if not points:
        return ""

    # Trouver le point de départ (le plus à droite pour l'arabe)
    start_idx = max(range(len(points)), key=lambda i: points[i][0])
    ordered = [points.pop(start_idx)]

    while points:
        last = ordered[-1]
        # Trouver le plus proche
        dists = [(abs(p[0]-last[0]) + abs(p[1]-last[1]), i) for i, p in enumerate(points)]
        dists.sort()
        nearest_dist, nearest_idx = dists[0]
        if nearest_dist > 20:  # trop loin = nouvelle sous-path
            break
        ordered.append(points.pop(nearest_idx))

    # Simplifier (garder 1 point sur 3)
    simplified = ordered[::3]
    if len(simplified) < 2:
        return ""

    # Normaliser vers viewBox 280x280
    scale_x = 280 / size
    scale_y = 280 / size

    d_parts = []
    for i, (x, y) in enumerate(simplified):
        nx = round(x * scale_x, 1)
        ny = round(y * scale_y, 1)
        cmd = "M" if i == 0 else "L"
        d_parts.append(f"{cmd}{nx} {ny}")

    return " ".join(d_parts)


def main():
    if not FONT_PATH.exists():
        print(f"[ERREUR] Police non trouvée : {FONT_PATH}")
        sys.exit(1)

    print(f"[INFO] Chargement police...")
    font = TTFont(FONT_PATH)

    results = {}

    for char_code, key, display in LETTERS:
        print(f"  Traitement U+{char_code:04X} ({display} — {key})...")

        # 1. Extraire le path SVG
        d = extract_path(font, char_code)
        if not d:
            print(f"    [SKIP] path non trouvé")
            continue

        # 2. Rasteriser en bitmap
        print(f"    Rasterisation...")
        bitmap = path_to_bitmap(d, SIZE)
        filled = bitmap.sum()
        print(f"    Pixels remplis : {filled}")

        if filled < 100:
            print(f"    [WARN] bitmap trop vide, skip")
            continue

        # 3. Calculer skeleton
        print(f"    Calcul du skeleton...")
        skeleton_d = bitmap_to_skeleton_path(bitmap, SIZE)

        if not skeleton_d:
            print(f"    [WARN] skeleton vide")
            continue

        print(f"    [OK] skeleton: {len(skeleton_d)} chars")

        results[key] = {
            "char": display,
            "skeleton": skeleton_d,
        }

    # Fusionner avec arabic-glyphs.json existant
    glyphs_file = Path(__file__).parent.parent / "frontend" / "src" / "data" / "arabic-glyphs.json"
    if glyphs_file.exists():
        with open(glyphs_file, encoding='utf-8') as f:
            glyphs = json.load(f)
        for key, data in results.items():
            if key in glyphs:
                glyphs[key]['skeleton'] = data['skeleton']
                print(f"  [OK] skeleton ajouté pour {key}")
        with open(glyphs_file, 'w', encoding='utf-8') as f:
            json.dump(glyphs, f, ensure_ascii=False, indent=2)
        print(f"\n[✓] arabic-glyphs.json mis à jour avec les skeletons")
    else:
        out = Path(__file__).parent / "arabic-skeletons.json"
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\n[✓] Skeletons sauvegardés → {out}")


if __name__ == "__main__":
    main()