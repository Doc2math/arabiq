"""
LangDad — Générateur PDF Livre Scolaire
Chapitre 1 : Les 4 lettres fondatrices (م ك ت ب)

Prérequis :
  pip install reportlab uharfbuzz freetype-py pillow
  apt-get install -y fonts-hosny-amiri        (Linux)
  # Windows : téléchargez Amiri-Regular.ttf et placez-le dans le même dossier

Usage :
  python generate_chapitre1.py
  python generate_chapitre1.py mon_output.pdf
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
import uharfbuzz as hb
import freetype
from PIL import Image
import io, os, sys

# ── Chemin police Amiri ────────────────────────────────────────
AMIRI_PATHS = [
    "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Regular.ttf",  # Linux
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "Amiri-Regular.ttf"),  # dossier local
    "C:/Windows/Fonts/Amiri-Regular.ttf",                              # Windows
    "Amiri-Regular.ttf",
]

FONT_PATH = None
for p in AMIRI_PATHS:
    if os.path.exists(p):
        FONT_PATH = p
        break

if not FONT_PATH:
    print("ERREUR : Police Amiri introuvable.")
    print("  Linux  : apt-get install fonts-hosny-amiri")
    print("  Windows: téléchargez Amiri-Regular.ttf sur github.com/aliftype/amiri/releases")
    sys.exit(1)

print(f"✓ Police : {FONT_PATH}")

# ── Rendu arabe HarfBuzz + FreeType ───────────────────────────
def render_arabic(text, font_path, font_size, color=(74, 42, 138)):
    """
    Rend du texte arabe avec harakat correctement positionnés.
    HarfBuzz gère le shaping OpenType, FreeType le rendu pixel.
    Retourne une image PIL RGBA transparente.
    """
    with open(font_path, 'rb') as f:
        font_data = f.read()

    blob    = hb.Blob(font_data)
    face    = hb.Face(blob)
    hb_font = hb.Font(face)
    SCALE   = font_size * 64
    hb_font.scale = (SCALE, SCALE)
    hb.ot_font_set_funcs(hb_font)

    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb_font, buf, {})

    infos     = buf.glyph_infos
    positions = buf.glyph_positions

    total_advance = sum(p.x_advance for p in positions) / SCALE * font_size
    img_w    = int(total_advance) + 40
    img_h    = font_size + 60
    baseline = int(img_h * 0.7)

    ft = freetype.Face(font_path)
    ft.set_char_size(font_size * 64)

    img   = Image.new('RGBA', (img_w, img_h), (0, 0, 0, 0))
    pen_x = 20.0

    for info, pos in zip(infos, positions):
        gid       = info.codepoint
        x_offset  = pos.x_offset  / SCALE * font_size
        y_offset  = pos.y_offset  / SCALE * font_size
        x_advance = pos.x_advance / SCALE * font_size

        try:
            ft.load_glyph(gid, freetype.FT_LOAD_RENDER)
            bm = ft.glyph.bitmap
            if bm.width > 0 and bm.rows > 0:
                gx = int(pen_x + x_offset + ft.glyph.bitmap_left)
                gy = int(baseline - y_offset - ft.glyph.bitmap_top)
                glyph_img = Image.frombytes('L', (bm.width, bm.rows), bytes(bm.buffer))
                colored   = Image.new('RGBA', glyph_img.size, (*color, 255))
                if gx < img_w and gy < img_h and gx + bm.width > 0 and gy + bm.rows > 0:
                    img.paste(colored, (max(0, gx), max(0, gy)), glyph_img)
        except Exception:
            pass

        pen_x += x_advance

    bbox = img.getbbox()
    if bbox:
        pad = 6
        img = img.crop((max(0, bbox[0]-pad), max(0, bbox[1]-pad),
                        min(img.width, bbox[2]+pad), min(img.height, bbox[3]+pad)))
    return img


def ar_to_reader(text, font_size, color):
    """Rend le texte arabe et retourne (ImageReader, width_pts, height_pts)."""
    img = render_arabic(text, FONT_PATH, font_size, color)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    scale = 0.75  # 96dpi → 72dpi (points PDF)
    return ImageReader(buf), img.width * scale, img.height * scale


def draw_ar(c, text, cx, cy, size=60, color=(108, 63, 197), align='center'):
    """
    Dessine du texte arabe dans le canvas ReportLab.
    cx, cy = point d'ancrage selon align.
    """
    reader, pw, ph = ar_to_reader(text, size, color)
    if align == 'center':
        x = cx - pw / 2
    elif align == 'right':
        x = cx - pw
    else:
        x = cx
    y = cy - ph / 2
    c.drawImage(reader, x, y, pw, ph, mask='auto')
    return pw, ph


# ── Palette couleurs ───────────────────────────────────────────
VIOLET    = HexColor('#6C3FC5')
VIOLET_LT = HexColor('#EDE8FB')
VIOLET_DK = HexColor('#4A2A8A')
ORANGE    = HexColor('#F07C1E')
ORANGE_LT = HexColor('#FEF0E3')
GREEN     = HexColor('#2BA84A')
GREEN_LT  = HexColor('#E3F7E8')
RED       = HexColor('#E24B4A')
RED_LT    = HexColor('#FCEBEB')
GOLD      = HexColor('#F9A825')
GOLD_LT   = HexColor('#FFF8E1')
BG        = HexColor('#F8F7FF')
DARK      = HexColor('#1A1A2E')
GRAY      = HexColor('#5A5A7A')
LIGHT     = HexColor('#9A9AB0')
BORDER    = HexColor('#E8E4F8')

# Tuples RGB pour Pillow
C_VIOLET    = (108, 63,  197)
C_VIOLET_DK = (74,  42,  138)
C_ORANGE    = (240, 124,  30)
C_GREEN     = (43,  168,  74)
C_RED       = (226,  75,  74)
C_DARK      = (26,   26,  46)
C_GRAY      = (90,   90, 122)
C_WHITE     = (255, 255, 255)
C_GOLD      = (249, 168,  37)

W, H = A4

# ── Données des lettres ────────────────────────────────────────
LETTERS = [
    # (arabe, nom, phonème, color_rl, color_lt, color_pillow, mnémo)
    ("م", "Mim", "/m/", VIOLET, VIOLET_LT, C_VIOLET,  "comme 'maison'"),
    ("ك", "Kaf", "/k/", GREEN,  GREEN_LT,  C_GREEN,   "comme 'cafe'"),
    ("ت", "Ta",  "/t/", ORANGE, ORANGE_LT, C_ORANGE,  "comme 'table'"),
    ("ب", "Ba",  "/b/", RED,    RED_LT,    C_RED,     "comme 'ballon'"),
]

# ── Helpers ReportLab ──────────────────────────────────────────
def rr(c, x, y, w, h, r, fill, stroke=None, sw=1):
    c.saveState()
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
        c.roundRect(x, y, w, h, r, fill=1, stroke=1)
    else:
        c.setStrokeColor(fill)
        c.roundRect(x, y, w, h, r, fill=1, stroke=0)
    c.restoreState()

def txt(c, text, x, y, font, size, color, align='left'):
    c.saveState()
    c.setFont(font, size)
    c.setFillColor(color)
    if align == 'center':
        c.drawCentredString(x, y, text)
    elif align == 'right':
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)
    c.restoreState()

def footer(c, page_num):
    c.saveState()
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(18, 26, W - 18, 26)
    c.setFont("Helvetica", 8)
    c.setFillColor(LIGHT)
    c.drawString(18, 14, "LangDad — Degre 1, Chapitre 1 — Les 4 lettres fondatrices")
    c.drawRightString(W - 18, 14, f"langdad.com   |   p.{page_num}")
    c.restoreState()


# ══════════════════════════════════════════════════════════════
# PAGE 1 — COUVERTURE
# ══════════════════════════════════════════════════════════════
def page_couverture(c):
    # Fond
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Bande violet sombre gauche
    c.setFillColor(VIOLET_DK)
    c.rect(0, 0, W * 0.38, H, fill=1, stroke=0)

    # Triangle orange
    p = c.beginPath()
    p.moveTo(W * 0.38, H)
    p.lineTo(W * 0.38 + 80, H)
    p.lineTo(W * 0.38, H - 80)
    p.close()
    c.setFillColor(ORANGE)
    c.drawPath(p, fill=1, stroke=0)

    # Triangle déco bas gauche
    p2 = c.beginPath()
    p2.moveTo(0, 0)
    p2.lineTo(100, 0)
    p2.lineTo(0, 100)
    p2.close()
    c.setFillColor(HexColor('#ffffff08'))
    c.drawPath(p2, fill=1, stroke=0)

    # Cercles déco
    c.setFillColor(HexColor('#1E0959'))
    c.circle(W * 0.19, H * 0.75, 80, fill=1, stroke=0)
    c.circle(W * 0.19, H * 0.25, 50, fill=1, stroke=0)
    c.setFillColor(HexColor('#1E0959'))
    c.circle(W * 0.19, H * 0.5, 140, fill=1, stroke=0)

    # Ligne or séparatrice
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.line(W * 0.38 - 4, 40, W * 0.38 - 4, H - 40)

    # Logo
    rr(c, W * 0.19 - 24, H - 100, 48, 48, 10, ORANGE)
    txt(c, "LD", W * 0.19, H - 78, "Helvetica-Bold", 16, white, 'center')
    txt(c, "LangDad",         W * 0.19, H - 120, "Helvetica-Bold", 15, white, 'center')
   

    # Lettres décoratives côté gauche
    letter_data = [(H * 0.62, 80), (H * 0.48, 64), (H * 0.36, 64), (H * 0.24, 72)]
    for i, (letter, _, _, _, _, cpil, _) in enumerate(LETTERS):
        ypos, sz = letter_data[i]
        faded = tuple(min(255, int(c * 0.3 + 200 * 0.7)) for c in cpil)
        draw_ar(c, letter, W * 0.19, ypos, size=sz, color=faded)

    # ── Partie droite ──────────────────────────────────────────
    rx = W * 0.38 + 24
    rw = W - rx - 24

    # Badge
    rr(c, rx, H - 80, 130, 32, 16, VIOLET)
    txt(c, "Degre 1  —  Partie 1", rx + 65, H - 59, "Helvetica-Bold", 10, white, 'center')

    # Titre
    txt(c, "Les 4 lettres",  rx, H - 125, "Helvetica-Bold", 36, DARK)
    txt(c, "fondatrices",    rx, H - 163, "Helvetica-Bold", 36, VIOLET)

    # Ligne déco
    c.setStrokeColor(ORANGE)
    c.setLineWidth(3)
    c.line(rx, H - 175, rx + 240, H - 175)

    # Lettres arabes titre
    draw_ar(c, "م   ك   ت   ب", rx + rw / 2, H - 218, size=52, color=C_VIOLET_DK)
    txt(c, "Mim  •  Kaf  •  Ta  •  Ba", rx + rw / 2, H - 248, "Helvetica", 13, GRAY, 'center')

    # Séparateur
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.line(rx, H - 262, W - 24, H - 262)

    # 3 stats
    infos_stats = [("4", "lettres"), ("4", "exercices"), ("1", "regle d'or")]
    for i, (num, label) in enumerate(infos_stats):
        ix = rx + i * (rw / 3) + rw / 6
        txt(c, num,   ix, H - 292, "Helvetica-Bold", 28, ORANGE, 'center')
        txt(c, label, ix, H - 310, "Helvetica",       9, GRAY,   'center')

    # 4 mini-cartes
    cy_m = H - 460
    cw_m, gap_m = 74, 10
    sx_m = rx + (rw - (4 * cw_m + 3 * gap_m)) / 2

    for i, (letter, name, phon, color, bg, cpil, _) in enumerate(LETTERS):
        cx = sx_m + i * (cw_m + gap_m)
        rr(c, cx, cy_m, cw_m, 92, 12, bg, color, 2)
        draw_ar(c, letter, cx + cw_m / 2, cy_m + 92 - 36, size=32, color=cpil)
        c.saveState()
        c.setStrokeColor(HexColor('#00000012'))
        c.setLineWidth(0.8)
        c.line(cx + 8, cy_m + 92 - 56, cx + cw_m - 8, cy_m + 92 - 56)
        c.restoreState()
        txt(c, name, cx + cw_m / 2, cy_m + 92 - 72, "Helvetica-Bold", 9, DARK,  'center')
        txt(c, phon, cx + cw_m / 2, cy_m + 92 - 84, "Helvetica",      8, color, 'center')

    # Description
    txt(c, "Decouvrez les premieres lettres de l'alphabet arabe,", rx, cy_m - 22, "Helvetica", 11, GRAY)
    txt(c, "leurs sons et comment les distinguer.",                 rx, cy_m - 36, "Helvetica", 11, GRAY)

    # Bas couverture
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.line(rx, 68, W - 24, 68)
    rr(c, rx, 38, 110, 24, 12, ORANGE)
    txt(c, "Livre de l'eleve",              rx + 55,  47, "Helvetica-Bold",  9, white, 'center')
    txt(c, "Chapitre 1  •  Reconnaissance", rx + 125, 47, "Helvetica",       9, GRAY)
    txt(c, "c 2026 LangDad",                W - 24,   47, "Helvetica",       8, LIGHT, 'right')


# ══════════════════════════════════════════════════════════════
# PAGE 2 — LES 4 LETTRES + EXERCICE 1
# ══════════════════════════════════════════════════════════════
def page_lettres(c):
    # En-tête
    rr(c, 0, H - 72, W, 72, 0, VIOLET)
    txt(c, "01", 18, H - 62, "Helvetica-Bold", 46, HexColor('#ffffff20'))
    txt(c, "Les 4 lettres fondatrices",       82, H - 44, "Helvetica-Bold", 17, white)
    txt(c, "Reconnaissance et prononciation",  82, H - 62, "Helvetica",      11, HexColor('#ffffff70'))
    txt(c, "p.2", W - 18, H - 50, "Helvetica-Bold", 12, HexColor('#ffffff80'), 'right')

    # Objectifs
    rr(c, 18, H - 116, W - 36, 36, 9, ORANGE_LT, ORANGE, 1.5)
    txt(c, "OBJECTIFS :", 30, H - 97, "Helvetica-Bold", 10, ORANGE)
    txt(c, "Reconnaitre les 4 lettres   •   Lire leur son   •   Distinguer Ba et Ta",
        108, H - 97, "Helvetica", 10, DARK)

    # 4 cartes lettres
    cw, ch = 116, 140
    sx = (W - (4 * cw + 3 * 10)) / 2
    cy = H - 288

    for i, (letter, name, phon, color, bg, cpil, _) in enumerate(LETTERS):
        cx = sx + i * (cw + 10)
        rr(c, cx, cy, cw, ch, 14, bg, color, 2)
        draw_ar(c, letter, cx + cw / 2, cy + ch - 48, size=54, color=cpil)
        c.saveState()
        c.setStrokeColor(HexColor('#00000015'))
        c.setLineWidth(1)
        c.line(cx + 14, cy + ch - 84, cx + cw - 14, cy + ch - 84)
        c.restoreState()
        txt(c, name, cx + cw / 2, cy + ch - 100, "Helvetica-Bold", 13, DARK,  'center')
        txt(c, phon, cx + cw / 2, cy + ch - 118, "Helvetica-Bold", 12, color, 'center')

    # Encadré À retenir
    ry = cy - 22
    rr(c, 18, ry - 68, W - 36, 78, 12, GOLD_LT, GOLD, 2)
    txt(c, "A RETENIR — Ba et Ta ont la meme forme de base !", 30, ry - 10,
        "Helvetica-Bold", 11, HexColor('#B8860B'))
    draw_ar(c, "ب", 34, ry - 28, size=20, color=C_RED)
    txt(c, "Ba  ==>  1 point EN DESSOUS", 58, ry - 30, "Helvetica-Bold", 11, DARK)
    draw_ar(c, "ت", 34, ry - 48, size=20, color=C_ORANGE)
    txt(c, "Ta   ==>  2 points AU-DESSUS", 58, ry - 50, "Helvetica-Bold", 11, DARK)
    txt(c, "Les points CHANGENT la lettre !",  310, ry - 30, "Helvetica", 10, GRAY)
    txt(c, "Jamais decoratifs en arabe.",       310, ry - 46, "Helvetica", 10, GRAY)

    # Exercice 1
    ex1y = ry - 100
    txt(c, "Exercice 1 — Identifie chaque lettre (entoure la bonne reponse)",
        18, ex1y, "Helvetica-Bold", 12, VIOLET)
    rr(c, 18, ex1y - 96, W - 36, 92, 10, BG, BORDER, 1)

    qs = [
        ("م", C_VIOLET,  "A) Kaf      B) Mim      C) Ta       D) Ba"),
        ("ب", C_RED,     "A) Ta       B) Kaf      C) Ba       D) Mim"),
        ("ت", C_ORANGE,  "A) Ba       B) Mim      C) Kaf      D) Ta"),
        ("ك", C_GREEN,   "A) Mim      B) Kaf      C) Ba       D) Ta"),
    ]
    for i, (letter, cpil, opts) in enumerate(qs):
        qy = ex1y - 24 - i * 20
        txt(c, f"{i+1}.", 30, qy, "Helvetica-Bold", 11, VIOLET)
        draw_ar(c, letter, 62, qy + 8, size=20, color=cpil)
        txt(c, opts, 82, qy, "Helvetica", 10, DARK)

    footer(c, 2)


# ══════════════════════════════════════════════════════════════
# PAGE 3 — EXERCICES SUITE
# ══════════════════════════════════════════════════════════════
def page_exercices(c):
    rr(c, 0, H - 58, W, 58, 0, VIOLET_LT, VIOLET, 2)
    txt(c, "Exercices — Suite", 18, H - 36, "Helvetica-Bold", 14, VIOLET)
    txt(c, "Chapitre 1",        18, H - 52, "Helvetica",      10, GRAY)
    txt(c, "p.3", W - 18, H - 44, "Helvetica-Bold", 12, GRAY, 'right')

    y = H - 82

    # Exercice 2 — Discrimination Ba/Ta
    rr(c, 18, y - 100, W - 36, 110, 10, RED_LT, RED, 1.5)
    txt(c, "Exercice 2 — Classe les lettres dans la bonne colonne",
        28, y - 8, "Helvetica-Bold", 11, RED)
    draw_ar(c, "ب   ت   ت   ب   ب   ت   ب   ت", W / 2, y - 48, size=30, color=C_DARK)

    rr(c, 38,      y - 94, 120, 30, 8, RED,    None)
    rr(c, W - 158, y - 94, 120, 30, 8, ORANGE, None)
    txt(c, "Ba", 80,    y - 83, "Helvetica-Bold", 13, white)
   
    txt(c, "Ta", W - 118, y - 83, "Helvetica-Bold", 13, white)
   

    y -= 118

    # Exercice 3 — Relier
    rr(c, 18, y - 165, W - 36, 175, 10, GREEN_LT, GREEN, 1.5)
    txt(c, "Exercice 3 — Relie chaque lettre a son nom et son son",
        28, y - 8, "Helvetica-Bold", 11, GREEN)

    letters_rel = [("م", C_WHITE, VIOLET), ("ك", C_GREEN, GREEN),
                   ("ت", C_ORANGE, ORANGE), ("ب", C_RED, RED)]
    noms_rel    = [("Kaf  ", GREEN), ("Ba", RED),
                   ("Mim  ", VIOLET), ("Ta  ", ORANGE)]

    for i, ((letter, cpil, lc), (name, rc)) in enumerate(zip(letters_rel, noms_rel)):
        ly = y - 40 - i * 30
        rr(c, 35, ly - 12, 50, 28, 8, lc, None)
        draw_ar(c, letter, 60, ly + 2, size=32, color=C_WHITE)
        c.saveState()
        c.setStrokeColor(LIGHT)
        c.setLineWidth(0.5)
        c.setDash([3, 5])
        c.line(88, ly + 2, W - 172, ly + 2)
        c.setDash([])
        c.restoreState()
        rr(c, W - 172, ly - 12, 144, 28, 8, rc, None)
        txt(c, name, W - 100, ly + 2, "Helvetica-Bold", 10, white, 'center')

    y -= 188

    # Exercice 4 — Défi مَكْتَبٌ
    rr(c, 18, y - 120, W - 36, 130, 10, VIOLET_LT, VIOLET, 2)
    txt(c, "Exercice 4   DEFI — Identifie les 4 lettres dans ce mot",
        28, y - 8, "Helvetica-Bold", 11, VIOLET)
    draw_ar(c, "مَكْتَبٌ", W / 2, y - 62, size=72, color=C_VIOLET_DK)
   

    bw = 86
    sbx = (W - (4 * bw + 3 * 8)) / 2
    for i in range(4):
        bx = sbx + i * (bw + 8)
        c.saveState()
        c.setStrokeColor(VIOLET)
        c.setLineWidth(1.5)
        c.setFillColor(white)
        c.roundRect(bx, y - 115, bw, 20, 4, fill=1, stroke=1)
        c.restoreState()

    footer(c, 3)


# ══════════════════════════════════════════════════════════════
# PAGE 4 — BILAN + AUTO-ÉVALUATION
# ══════════════════════════════════════════════════════════════
def page_bilan(c):
    rr(c, 0, H - 74, W, 74, 0, VIOLET_DK)
    txt(c, "Ce que j'ai appris",                   W / 2, H - 46,
        "Helvetica-Bold", 20, white, 'center')
    txt(c, "Chapitre 1 — Bilan et auto-evaluation",  W / 2, H - 65,
        "Helvetica", 12, HexColor('#ffffff70'), 'center')

    # 4 cartes récap
    cw2, ch2 = 114, 150
    sx2 = (W - (4 * cw2 + 3 * 10)) / 2
    cy2 = H - 264

    for i, (letter, name, phon, color, bg, cpil, mnemo) in enumerate(LETTERS):
        cx = sx2 + i * (cw2 + 10)
        rr(c, cx, cy2, cw2, ch2, 14, bg, color, 2)
        draw_ar(c, letter, cx + cw2 / 2, cy2 + ch2 - 46, size=52, color=cpil)
        c.saveState()
        c.setStrokeColor(HexColor('#00000012'))
        c.setLineWidth(1)
        c.line(cx + 12, cy2 + ch2 - 82, cx + cw2 - 12, cy2 + ch2 - 82)
        c.restoreState()
        txt(c, name,  cx + cw2 / 2, cy2 + ch2 - 100, "Helvetica-Bold", 13, DARK,  'center')
        txt(c, phon,  cx + cw2 / 2, cy2 + ch2 - 118, "Helvetica-Bold", 13, color, 'center')
        txt(c, mnemo, cx + cw2 / 2, cy2 + ch2 - 134, "Helvetica",       8, GRAY,  'center')

    # Règle d'or
    rry = cy2 - 22
    rr(c, 18, rry - 60, W - 36, 70, 12, GOLD_LT, GOLD, 2)
    txt(c, "La regle d'or", 30, rry - 12, "Helvetica-Bold", 12, HexColor('#B8860B'))
    txt(c, "En arabe : 1 lettre = 1 son fixe. Toujours. Sans exception !",
        30, rry - 30, "Helvetica-Bold", 11, DARK)
    draw_ar(c, "ب", 30, rry - 48, size=16, color=C_RED)
    txt(c, "Ba (1 point dessous)  vs", 54, rry - 50, "Helvetica", 10, GRAY)
    draw_ar(c, "ت", 218, rry - 48, size=16, color=C_ORANGE)
    txt(c, "Ta (2 points dessus)", 242, rry - 50, "Helvetica", 10, GRAY)

    # Auto-évaluation
    aey = rry - 84
    rr(c, 18, aey - 132, W - 36, 142, 12, BG, BORDER, 1)
    txt(c, "Auto-evaluation — Coche ce que tu maitrises",
        30, aey - 12, "Helvetica-Bold", 12, VIOLET)

    items = [
        ("Je reconnais la lettre Mim",   "م",       C_VIOLET,  "sans hesiter"),
        ("Je reconnais la lettre Kaf",   "ك",       C_GREEN,   "sans hesiter"),
        ("Je distingue facilement",      "ب  et  ت", C_RED,    "Ba et Ta"),
        ("Je sais que les points changent la lettre", "", None, ""),
        ("J'ai identifie les 4 lettres dans",  "مَكْتَبٌ", C_VIOLET_DK, ""),
    ]
    eval_labels = ["Oui", "+/-", "Non"]
    eval_colors = [GREEN, ORANGE, RED]

    for i, (pre, arabic, cpil, post) in enumerate(items):
        iy = aey - 36 - i * 19
        for j in range(3):
            bx = 30 + j * 28
            c.saveState()
            c.setFillColor(HexColor('#F0EDF8'))
            c.setStrokeColor(eval_colors[j])
            c.setLineWidth(1)
            c.roundRect(bx, iy - 7, 24, 16, 4, fill=1, stroke=1)
            c.setFont("Helvetica", 7)
            c.setFillColor(eval_colors[j])
            c.drawCentredString(bx + 12, iy, eval_labels[j])
            c.restoreState()

        txt(c, pre, 120, iy + 1, "Helvetica", 10, DARK)
        if arabic and cpil:
            x_ar = 120 + len(pre) * 5.6
            draw_ar(c, arabic, x_ar + 5, iy + 9, size=15, color=cpil)
            if post and i not in [2, 4]:
                txt(c, "  " + post, x_ar + 30, iy + 1, "Helvetica", 10, DARK)

    # Prochain chapitre
    rr(c, 18, 46, W - 36, 42, 12, VIOLET, None)
    txt(c, "Prochain chapitre :", 30, 79, "Helvetica-Bold", 11, white)
    txt(c, "Chapitre 2 — Les voyelles courtes (harakat) : les sons qui donnent vie aux lettres",
        30, 61, "Helvetica", 10, HexColor('#ffffff90'))

    footer(c, 4)


# ══════════════════════════════════════════════════════════════
# GÉNÉRATION PRINCIPALE
# ══════════════════════════════════════════════════════════════
def generate(output_path="langdad_chapitre1.pdf"):
    print(f"\nGénération : {output_path}")
    cv = canvas.Canvas(output_path, pagesize=A4)

    print("  Page 1 — Couverture...")
    page_couverture(cv)
    cv.showPage()

    print("  Page 2 — Les 4 lettres...")
    page_lettres(cv)
    cv.showPage()

    print("  Page 3 — Exercices...")
    page_exercices(cv)
    cv.showPage()

    print("  Page 4 — Bilan...")
    page_bilan(cv)

    cv.save()
    print(f"\n✓ PDF généré : {output_path}\n")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "langdad_chapitre1.pdf"
    generate(out)