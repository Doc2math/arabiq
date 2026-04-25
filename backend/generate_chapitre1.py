"""
LangDad — Générateur PDF Livre Scolaire
Chapitre 1 : Les 4 lettres fondatrices (م ك ت ب)

Prérequis :
  pip install reportlab arabic-reshaper python-bidi --break-system-packages
  apt-get install -y fonts-hosny-amiri

Usage :
  python generate_chapitre1.py
  → génère langdad_chapitre1.pdf dans le dossier courant
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from arabic_reshaper import ArabicReshaper 
from bidi.algorithm import get_display
import os, sys
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.utils import ImageReader
import io

def ar_image(text, font_size=60, color=(108, 63, 197)):
    """
    Rend le texte arabe avec harakat comme image PNG
    et retourne un BytesIO prêt pour ReportLab.
    """
    from arabic_reshaper import ArabicReshaper
    from bidi.algorithm import get_display
    
    reshaper = ArabicReshaper(configuration={
        'delete_harakat': False,
        'delete_tatweel': False,
        'support_ligatures': True,
    })
    
    text_ready = get_display(reshaper.reshape(text))
    
    # Charger la police Amiri
    font = ImageFont.truetype(
        "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Regular.ttf",
        font_size
    )
    
    # Mesurer la taille
    dummy = Image.new('RGBA', (1, 1))
    d = ImageDraw.Draw(dummy)
    bbox = d.textbbox((0, 0), text_ready, font=font)
    w = bbox[2] - bbox[0] + 20
    h = bbox[3] - bbox[1] + 20
    
    # Dessiner sur fond transparent
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), text_ready, font=font, fill=(*color, 255))
    
    # Convertir en BytesIO
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf, w, h


def draw_ar(c, text, cx, cy, font_size=60, color=(108, 63, 197)):
    """Dessine du texte arabe centré en (cx, cy) via Pillow."""
    buf, w, h = ar_image(text, font_size, color)
    img = ImageReader(buf)
    # Convertir pixels → points (96 dpi → 72 dpi)
    scale = 0.75
    pw, ph = w * scale, h * scale
    c.drawImage(img, cx - pw/2, cy - ph/2, pw, ph, mask='auto')

pdfmetrics.registerFont(TTFont('Amiri', 'Amiri-Regular.ttf'))

# ── Polices ────────────────────────────────────────────────────
AMIRI_PATHS = [
    "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Regular.ttf",
    "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Bold.ttf",
    "Amiri-Regular.ttf",  # dossier local
]

def load_fonts():
    for path in AMIRI_PATHS:
        if os.path.exists(path) and "Regular" in path:
            try:
                pdfmetrics.registerFont(TTFont('Amiri', path))
                bold_path = path.replace("Regular", "Bold")
                if os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont('AmiriBold', bold_path))
                print(f"✓ Police Amiri chargée : {path}")
                return True
            except Exception as e:
                print(f"Erreur police : {e}")
    print("⚠ Police Amiri introuvable — installez : apt-get install fonts-hosny-amiri")
    return False
# ── Reshaper avec harakat ──────────────────────────────────────
_reshaper = arabic_reshaper.ArabicReshaper(configuration={
    'delete_harakat': False,
    'delete_tatweel': False,
    'support_ligatures': True,
})

def ar(text):
    """Prépare le texte arabe avec harakat pour ReportLab."""
    reshaped = _reshaper.reshape(text)
    return get_display(reshaped)
# ── Texte arabe ────────────────────────────────────────────────

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

W, H = A4  # 595 x 842 points

# ── Helpers ────────────────────────────────────────────────────
def rr(c, x, y, w, h, r, fill, stroke=None, sw=1):
    """Rectangle arrondi."""
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
    """Texte avec alignement."""
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
    """Pied de page standard."""
    c.saveState()
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(18, 26, W-18, 26)
    c.setFont("Helvetica", 8)
    c.setFillColor(LIGHT)
    c.drawString(18, 14, "LangDad — Degre 1, Chapitre 1 — Les 4 lettres fondatrices")
    c.drawRightString(W-18, 14, f"langdad.com   |   p.{page_num}")
    c.restoreState()

# ── Données des lettres ────────────────────────────────────────
def get_letters():
    return [
        (ar("م"), "Mim", "/m/", VIOLET, VIOLET_LT, "comme 'maison'"),
        (ar("ك"), "Kaf", "/k/", GREEN,  GREEN_LT,  "comme 'cafe'"),
        (ar("ت"), "Ta",  "/t/", ORANGE, ORANGE_LT, "comme 'table'"),
        (ar("ب"), "Ba",  "/b/", RED,    RED_LT,    "comme 'ballon'"),
    ]

# ══════════════════════════════════════════════════════════════
# PAGE 1 — COUVERTURE
# ══════════════════════════════════════════════════════════════
def page_couverture(c, LETTERS):
    # Fond blanc cassé
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Bande violet sombre gauche (38% de la page)
    c.setFillColor(VIOLET_DK)
    c.rect(0, 0, W*0.38, H, fill=1, stroke=0)

    # Triangle décoratif orange (coin supérieur droit de la bande)
    p = c.beginPath()
    p.moveTo(W*0.38, H)
    p.lineTo(W*0.38 + 80, H)
    p.lineTo(W*0.38, H - 80)
    p.close()
    c.setFillColor(ORANGE)
    c.drawPath(p, fill=1, stroke=0)

    # Cercles décoratifs sur fond violet
    c.setFillColor(HexColor('#ffffff08'))
    c.circle(W*0.19, H*0.75, 80, fill=0, stroke=1)
    c.circle(W*0.19, H*0.25, 50, fill=0, stroke=1)
    c.setFillColor(HexColor('#ffffff05'))
    c.circle(W*0.19, H*0.5, 140, fill=0, stroke=1)

    # Ligne déco or verticale
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.line(W*0.38-4, 40, W*0.38-4, H-40)

    # Logo LangDad (côté gauche)
    rr(c, W*0.19-24, H-100, 48, 48, 10, ORANGE)
    txt(c, "LD", W*0.19, H-78, "Helvetica-Bold", 16, white, 'center')
    txt(c, "LangDad",         W*0.19, H-120, "Helvetica-Bold", 15, white, 'center')
    txt(c, "www.langdad.com", W*0.19, H-136, "Helvetica",       8, HexColor('#ffffff60'), 'center')

    # Grandes lettres arabes décoratives côté gauche
    positions = [H*0.62, H*0.48, H*0.36, H*0.24]
    sizes     = [90, 70, 70, 80]
    for i, (letter, _, _, _, _, _) in enumerate(LETTERS):
        txt(c, letter, W*0.19, positions[i], 'Amiri', sizes[i], HexColor('#ffffff16'), 'center')

    # ── Partie droite ──────────────────────────────────────────
    rx = W*0.38 + 24
    rw = W - rx - 24

    # Badge degré
    rr(c, rx, H-80, 130, 32, 16, VIOLET)
    txt(c, "Degre 1  —  Partie 1", rx+65, H-59, "Helvetica-Bold", 10, white, 'center')

    # Titre
    txt(c, "Les 4 lettres",    rx, H-125, "Helvetica-Bold", 36, DARK)
    txt(c, "fondatrices",      rx, H-163, "Helvetica-Bold", 36, VIOLET)

    # Sous-ligne déco orange
    c.setStrokeColor(ORANGE)
    c.setLineWidth(3)
    c.line(rx, H-175, rx+240, H-175)
   
    # Lettres arabes centrées
    draw_ar(c, "مَكْتَبٌ", W/2, y-70, font_size=68, color=(74, 42, 138))
    
    c.drawImage("desk.png", 230, 110, width=380, height=180)
    # Séparateur
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.line(rx, H-264, W-24, H-264)

    # Infos pédagogiques (3 stats)
    infos = [("4","lettres"), ("4","exercices"), ("1","regle d'or")]
    for i, (num, label) in enumerate(infos):
        ix = rx + i*(rw/3) + rw/6
        txt(c, num,   ix, H-294, "Helvetica-Bold", 28, ORANGE, 'center')
        txt(c, label, ix, H-312, "Helvetica",       9, GRAY,   'center')

    # 4 mini-cartes lettres
    cy_mini = H-460
    cw_mini, gap_mini = 74, 10
    sx_mini = rx + (rw-(4*cw_mini+3*gap_mini))/2

    for i, (letter, name, phon, color, bg, _) in enumerate(LETTERS):
        cx = sx_mini + i*(cw_mini+gap_mini)
        rr(c, cx, cy_mini, cw_mini, 90, 12, bg, color, 2)
        txt(c, letter, cx+cw_mini/2, cy_mini+90-32, 'Amiri', 36, color, 'center')
        c.saveState()
        c.setStrokeColor(HexColor('#00000012'))
        c.setLineWidth(0.8)
        c.line(cx+8, cy_mini+90-58, cx+cw_mini-8, cy_mini+90-58)
        c.restoreState()
        txt(c, name, cx+cw_mini/2, cy_mini+90-72, "Helvetica-Bold", 9, DARK,  'center')
        txt(c, phon, cx+cw_mini/2, cy_mini+90-84, "Helvetica",      8, color, 'center')

    # Description
    txt(c, "Decouvrez les premieres lettres de l'alphabet arabe,", rx, cy_mini-24, "Helvetica", 11, GRAY)
    txt(c, "leurs sons et comment les distinguer.",                 rx, cy_mini-38, "Helvetica", 11, GRAY)

    # Bas de page couverture
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.line(rx, 68, W-24, 68)
    rr(c, rx, 38, 110, 24, 12, ORANGE)
    txt(c, "Livre de l'eleve",              rx+55,  47, "Helvetica-Bold", 9, white, 'center')
    txt(c, "Chapitre 1  •  Reconnaissance", rx+125, 47, "Helvetica",      9, GRAY)
    txt(c, "c 2026 LangDad",                W-24,   47, "Helvetica",      8, LIGHT, 'right')


# ══════════════════════════════════════════════════════════════
# PAGE 2 — LES 4 LETTRES + EXERCICE 1
# ══════════════════════════════════════════════════════════════
def page_lettres(c, LETTERS):
    # En-tête violet
    rr(c, 0, H-72, W, 72, 0, VIOLET)
    txt(c, "01", 18, H-62, "Helvetica-Bold", 46, HexColor('#ffffff20'))
    txt(c, "Les 4 lettres fondatrices",      82, H-44, "Helvetica-Bold", 17, white)
    txt(c, "Reconnaissance et prononciation", 82, H-62, "Helvetica",     11, HexColor('#ffffff70'))
    txt(c, "p.2", W-18, H-50, "Helvetica-Bold", 12, HexColor('#ffffff80'), 'right')

    # Objectifs
    rr(c, 18, H-116, W-36, 36, 9, ORANGE_LT, ORANGE, 1.5)
    txt(c, "OBJECTIFS :", 30, H-97, "Helvetica-Bold", 10, ORANGE)
    txt(c, "Reconnaitre م ك ت ب   •   Lire leur son   •   Distinguer Ba et Ta", 108, H-97, "Helvetica", 10, DARK)

    # 4 cartes lettres
    cw, ch = 116, 132
    sx = (W-(4*cw+3*10))/2
    cy = H-282

    for i, (letter, name, phon, color, bg, _) in enumerate(LETTERS):
        cx = sx + i*(cw+10)
        rr(c, cx, cy, cw, ch, 14, bg, color, 2)
        txt(c, letter, cx+cw/2, cy+ch-68, 'Amiri', 54, color, 'center')
        c.saveState()
        c.setStrokeColor(HexColor('#00000015'))
        c.setLineWidth(1)
        c.line(cx+14, cy+ch-78, cx+cw-14, cy+ch-78)
        c.restoreState()
        txt(c, name, cx+cw/2, cy+ch-96,  "Helvetica-Bold", 13, DARK,  'center')
        txt(c, phon, cx+cw/2, cy+ch-114, "Helvetica-Bold", 12, color, 'center')

    # Encadré À retenir
    ry = cy-22
    rr(c, 18, ry-68, W-36, 78, 12, GOLD_LT, GOLD, 2)
    txt(c, "A RETENIR — Ba et Ta ont la meme forme de base !",  30, ry-10, "Helvetica-Bold", 11, HexColor('#B8860B'))
    txt(c, ar("ب") + "  Ba  ==>  1 point EN DESSOUS",           30, ry-30, "Helvetica-Bold", 11, DARK)
    txt(c, ar("ت") + "  Ta   ==>  2 points AU-DESSUS",          30, ry-50, "Helvetica-Bold", 11, DARK)
    txt(c, "Les points CHANGENT la lettre.",  310, ry-30, "Helvetica", 10, GRAY)
    txt(c, "Ils ne sont jamais decoratifs !",  310, ry-46, "Helvetica", 10, GRAY)

    # Exercice 1
    ex1y = ry-100
    txt(c, "Exercice 1 — Identifie chaque lettre (entoure la bonne reponse)", 18, ex1y, "Helvetica-Bold", 12, VIOLET)
    rr(c, 18, ex1y-92, W-36, 88, 10, BG, BORDER, 1)

    qs = [
        (ar("م"), "A) Kaf      B) Mim      C) Ta       D) Ba"),
        (ar("ب"), "A) Ta       B) Kaf      C) Ba       D) Mim"),
        (ar("ت"), "A) Ba       B) Mim      C) Kaf      D) Ta"),
        (ar("ك"), "A) Mim      B) Kaf      C) Ba       D) Ta"),
    ]
    for i, (l, opts) in enumerate(qs):
        qy = ex1y-22-i*18
        txt(c, f"{i+1}.", 30, qy, "Helvetica-Bold", 11, VIOLET)
        txt(c, l,         52, qy, 'Amiri',           16, VIOLET)
        txt(c, opts,      78, qy, "Helvetica",        10, DARK)

    footer(c, 2)


# ══════════════════════════════════════════════════════════════
# PAGE 3 — EXERCICES SUITE
# ══════════════════════════════════════════════════════════════
def page_exercices(c, LETTERS):
    rr(c, 0, H-58, W, 58, 0, VIOLET_LT, VIOLET, 2)
    txt(c, "Exercices — Suite", 18, H-36, "Helvetica-Bold", 14, VIOLET)
    txt(c, "Chapitre 1",        18, H-52, "Helvetica",      10, GRAY)
    txt(c, "p.3", W-18, H-44, "Helvetica-Bold", 12, GRAY, 'right')

    y = H-82

    # Exercice 2 — Discrimination Ba/Ta
    rr(c, 18, y-96, W-36, 106, 10, RED_LT, RED, 1.5)
    txt(c, "Exercice 2 — Classe les lettres dans la bonne colonne", 28, y-8, "Helvetica-Bold", 11, RED)
    txt(c, ar("ب   ت   ت   ب   ب   ت   ب   ت"), W/2, y-44, 'Amiri', 30, DARK, 'center')
    rr(c, 38,    y-90, 120, 30, 8, RED,    None)
    rr(c, W-158, y-90, 120, 30, 8, ORANGE, None)
    txt(c, ar("ب") + "  Ba", 98,    y-70, "Helvetica-Bold", 13, white, 'center')
    txt(c, ar("ت") + "  Ta", W-98,  y-70, "Helvetica-Bold", 13, white, 'center')

    y -= 116

    # Exercice 3 — Relier
    rr(c, 18, y-160, W-36, 170, 10, GREEN_LT, GREEN, 1.5)
    txt(c, "Exercice 3 — Relie chaque lettre a son nom et son son", 28, y-8, "Helvetica-Bold", 11, GREEN)

    pairs_l = [(ar("م"), VIOLET), (ar("ك"), GREEN), (ar("ت"), ORANGE), (ar("ب"), RED)]
    pairs_r = [("Kaf  /k/", GREEN), ("Ba  /b/", RED), ("Mim  /m/", VIOLET), ("Ta  /t/", ORANGE)]

    for i, ((letter, lc), (name, rc)) in enumerate(zip(pairs_l, pairs_r)):
        ly = y-38-i*30
        rr(c, 35, ly-10, 48, 26, 8, lc, None)
        txt(c, letter, 59, ly+3, 'Amiri', 20, white, 'center')
        c.saveState()
        c.setStrokeColor(LIGHT)
        c.setLineWidth(0.5)
        c.setDash([3, 5])
        c.line(86, ly+3, W-170, ly+3)
        c.setDash([])
        c.restoreState()
        rr(c, W-170, ly-10, 142, 26, 8, rc, None)
        txt(c, name, W-99, ly+3, "Helvetica-Bold", 10, white, 'center')

    y -= 182

    # Exercice 4 — Défi mot مَكْتَبٌ
    rr(c, 18, y-118, W-36, 128, 10, VIOLET_LT, VIOLET, 2)
    txt(c, "Exercice 4   DEFI — Identifie les 4 lettres dans ce mot", 28, y-8, "Helvetica-Bold", 11, VIOLET)
    txt(c, ar("مَكْتَبٌ"), W/2, y-70, 'Amiri', 68, VIOLET_DK, 'center')
    txt(c, "(bureau en arabe)", W/2, y-88, "Helvetica", 10, GRAY, 'center')

    bw = 86
    sbx = (W-(4*bw+3*8))/2
    for i in range(4):
        bx = sbx+i*(bw+8)
        c.saveState()
        c.setStrokeColor(VIOLET)
        c.setLineWidth(1.5)
        c.setFillColor(white)
        c.roundRect(bx, y-113, bw, 20, 4, fill=1, stroke=1)
        c.restoreState()

    footer(c, 3)


# ══════════════════════════════════════════════════════════════
# PAGE 4 — BILAN + AUTO-ÉVALUATION
# ══════════════════════════════════════════════════════════════
def page_bilan(c, LETTERS):
    # En-tête
    rr(c, 0, H-74, W, 74, 0, VIOLET_DK)
    txt(c, "Ce que j'ai appris",                  W/2, H-46, "Helvetica-Bold", 20, white,                'center')
    txt(c, "Chapitre 1 — Bilan et auto-evaluation", W/2, H-65, "Helvetica",     12, HexColor('#ffffff70'), 'center')

    # 4 cartes récap
    cw2, ch2 = 114, 148
    sx2 = (W-(4*cw2+3*10))/2
    cy2 = H-262

    for i, (letter, name, phon, color, bg, mnemo) in enumerate(LETTERS):
        cx = sx2+i*(cw2+10)
        rr(c, cx, cy2, cw2, ch2, 14, bg, color, 2)
        txt(c, letter, cx+cw2/2, cy2+ch2-68,  'Amiri',          52, color, 'center')
        c.saveState()
        c.setStrokeColor(HexColor('#00000012'))
        c.setLineWidth(1)
        c.line(cx+12, cy2+ch2-76, cx+cw2-12, cy2+ch2-76)
        c.restoreState()
        txt(c, name,  cx+cw2/2, cy2+ch2-96,  "Helvetica-Bold", 13, DARK,  'center')
        txt(c, phon,  cx+cw2/2, cy2+ch2-114, "Helvetica-Bold", 13, color, 'center')
        txt(c, mnemo, cx+cw2/2, cy2+ch2-130, "Helvetica",       8, GRAY,  'center')

    # Règle d'or
    rry = cy2-22
    rr(c, 18, rry-60, W-36, 70, 12, GOLD_LT, GOLD, 2)
    txt(c, "La regle d'or",                                                          30, rry-12, "Helvetica-Bold", 12, HexColor('#B8860B'))
    txt(c, "En arabe : 1 lettre = 1 son fixe. Toujours. Sans exception !",           30, rry-30, "Helvetica-Bold", 11, DARK)
    txt(c, "Les points changent la lettre : " + ar("ب") + " Ba vs " + ar("ت") + " Ta", 30, rry-50, "Helvetica", 10, GRAY)

    # Auto-évaluation
    aey = rry-84
    rr(c, 18, aey-132, W-36, 142, 12, BG, BORDER, 1)
    txt(c, "Auto-evaluation — Coche ce que tu maitrises", 30, aey-12, "Helvetica-Bold", 12, VIOLET)

    items = [
        "Je reconnais la lettre Mim  " + ar("م") + "  sans hesiter",
        "Je reconnais la lettre Kaf  " + ar("ك") + "  sans hesiter",
        "Je distingue facilement  "    + ar("ب") + " Ba  et  " + ar("ت") + " Ta",
        "Je sais que les points changent la lettre",
        "J'ai identifie les 4 lettres dans  " + ar("مَكْتَبٌ"),
    ]
    labels      = ["Oui", "+/-", "Non"]
    eval_colors = [GREEN, ORANGE, RED]

    for i, item in enumerate(items):
        iy = aey-36-i*19
        for j in range(3):
            bx = 30+j*28
            c.saveState()
            c.setFillColor(HexColor('#F0EDF8'))
            c.setStrokeColor(eval_colors[j])
            c.setLineWidth(1)
            c.roundRect(bx, iy-7, 24, 16, 4, fill=1, stroke=1)
            c.setFont("Helvetica", 7)
            c.setFillColor(eval_colors[j])
            c.drawCentredString(bx+12, iy, labels[j])
            c.restoreState()
        txt(c, item, 120, iy+1, "Helvetica", 10, DARK)

    # Prochain chapitre
    rr(c, 18, 46, W-36, 42, 12, VIOLET, None)
    txt(c, "Prochain chapitre :", 30, 79, "Helvetica-Bold", 11, white)
    txt(c, "Chapitre 2 — Les voyelles courtes (harakat) : les sons qui donnent vie aux lettres", 30, 61, "Helvetica", 10, HexColor('#ffffff90'))

    footer(c, 4)


# ══════════════════════════════════════════════════════════════
# GÉNÉRATION PRINCIPALE
# ══════════════════════════════════════════════════════════════
def generate(output_path="langdad_chapitre1.pdf"):
    if not load_fonts():
        sys.exit(1)

    LETTERS = get_letters()
    c = canvas.Canvas(output_path, pagesize=A4)

    page_couverture(c, LETTERS)
    c.showPage()

    page_lettres(c, LETTERS)
    c.showPage()

    page_exercices(c, LETTERS)
    c.showPage()

    page_bilan(c, LETTERS)

    c.save()
    print(f"✓ PDF généré : {output_path}")

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "langdad_chapitre1.pdf"
    generate(out)