"""
Service de génération des fiches d'écriture arabe — LangDad
Format standard validé : 1 fiche par lettre, grille sans points,
3 modèles (noir + gris + gris), compatible impression N&B
"""
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import arabic_reshaper
from bidi.algorithm import get_display
from pypdf import PdfWriter, PdfReader
import os

# ── Polices ───────────────────────────────────────────────────
_FONT_PATHS = [
    '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf',
]

_fonts_registered = False

def _register_fonts():
    global _fonts_registered
    if _fonts_registered:
        return
    regular = _FONT_PATHS[0]
    bold = _FONT_PATHS[1] if os.path.exists(_FONT_PATHS[1]) else regular
    pdfmetrics.registerFont(TTFont('ArabicR', regular))
    pdfmetrics.registerFont(TTFont('ArabicB', bold))
    _fonts_registered = True

# ── Helper ────────────────────────────────────────────────────
def ar(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text))

# ── Constantes mise en page ───────────────────────────────────
W, H = A4
MARGIN = 30
CONTENT_W = W - 2 * MARGIN
CELL = 15
GRID_LINE = HexColor('#999999')
DARK = HexColor('#1A1A2E')
HEADER_H = 65
GRID_ROWS = 4
BAND_H = CELL * GRID_ROWS
GRID_W = CONTENT_W - 48
LETTER_FONT = CELL * 1.55
WORD_ROWS = 3
WORD_BAND_H = CELL * WORD_ROWS
WORD_FONT = CELL * 1.25

# ── Données Module 1 ──────────────────────────────────────────
MODULE1_LETTERS = [
    {
        'letter': 'ب', 'name': 'Ba', 'phoneme': 'b',
        'color': '#6C3FC5', 'color_lt': '#EDE8FB',
        'forms': [('Isolée','ب'), ('Début','بـ'), ('Milieu','ـبـ'), ('Fin','ـب')],
        'words': [
            ('بَابٌ', 'baabun', 'porte'),
            ('كِتَابٌ', 'kitaabun', 'livre'),
            ('بَيْتٌ', 'baytun', 'maison'),
            ('بُومَةٌ', 'buumatun', 'hibou'),
        ],
        'note': 'Ba: coque horizontale + 1 point dessous. Apres ا و ر ز د ذ en fin de mot -> forme isolee.',
    },
    {
        'letter': 'م', 'name': 'Mim', 'phoneme': 'm',
        'color': '#F07C1E', 'color_lt': '#FEF0E3',
        'forms': [('Isolée','م'), ('Début','مـ'), ('Milieu','ـمـ'), ('Fin','ـم')],
        'words': [
            ('مَكْتَبٌ', 'maktabun', 'bureau'),
            ('مَامَا', 'maama', 'maman'),
            ('مَكْتَبَةٌ', 'maktabatun', 'bibliotheque'),
            ('مَاتَ', 'maata', 'il est mort'),
        ],
        'note': 'Mim: cercle ferme + queue vers le bas. Forme compacte au milieu des mots.',
    },
    {
        'letter': 'ك', 'name': 'Kaf', 'phoneme': 'k',
        'color': '#2BA84A', 'color_lt': '#E3F7E8',
        'forms': [('Isolée','ك'), ('Début','كـ'), ('Milieu','ـكـ'), ('Fin','ـك')],
        'words': [
            ('كِتَابٌ', 'kitaabun', 'livre'),
            ('كاتِبٌ', 'kaatibun', 'ecrivain'),
            ('كُتُبٌ', 'kutubun', 'livres'),
            ('كَتَبَ', 'kataba', 'il a ecrit'),
        ],
        'note': "Kaf: forme en L avec trait diagonal. En finale peut aussi s'ecrire K selon le style.",
    },
    {
        'letter': 'ت', 'name': 'Ta', 'phoneme': 't',
        'color': '#1976D2', 'color_lt': '#E6F1FB',
        'forms': [('Isolée','ت'), ('Début','تـ'), ('Milieu','ـتـ'), ('Fin (Ta)','ـت')],
        'words': [
            ('تَمَّ', 'tamma', 'il fut accompli'),
            ('كِتَابَةٌ', 'kitaabatun', 'ecriture'),
            ('بَاتَ', 'baata', 'il passa la nuit'),
            ('كاتِبٌ', 'kaatibun', 'ecrivain'),
        ],
        'note': 'Ta: 2 points au-dessus. Ta marbuta (ة) uniquement en fin de mot.',
    },
]

# Registre des modules → lettres (à enrichir au fil des modules)
MODULES_LETTERS = {
    1: MODULE1_LETTERS,
}

# ── Fonctions de dessin ───────────────────────────────────────
def _draw_grid_band(c, x, y, width, height, cell=CELL):
    c.setFillColor(HexColor('#FFFFFF'))
    c.setStrokeColor(HexColor('#777777'))
    c.setLineWidth(0.5)
    c.rect(x, y, width, height, fill=1, stroke=1)
    c.setStrokeColor(GRID_LINE)
    c.setLineWidth(0.4)
    ny = y + cell
    while ny < y + height:
        c.line(x, ny, x + width, ny)
        ny += cell
    nx = x + cell
    while nx < x + width:
        c.line(nx, y, nx, y + height)
        nx += cell

def _make_sheet_buffer(ld: dict) -> bytes:
    """Génère une fiche d'écriture pour une lettre et retourne les bytes PDF."""
    _register_fonts()
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    color = HexColor(ld['color'])
    color_lt = HexColor(ld['color_lt'])

    # ── Header ─────────────────────────────────────────────
    c.setFillColor(color)
    c.rect(0, H - HEADER_H, W, HEADER_H, fill=1, stroke=0)
    c.setFillColor(HexColor('#FFFFFF'))
    c.setFont('Helvetica-Bold', 16)
    c.drawString(MARGIN, H - HEADER_H/2 + 6, 'LangDad')
    c.setFont('Helvetica', 9)
    c.drawString(MARGIN, H - HEADER_H/2 - 8, "Fiche d'ecriture — Module 1")
    c.setFont('Helvetica-Bold', 22)
    c.drawCentredString(W/2, H - HEADER_H/2 + 8, ld['name'])
    c.setFont('Helvetica', 13)
    c.drawCentredString(W/2, H - HEADER_H/2 - 8, f"/{ld['phoneme']}/")
    c.setFont('ArabicB', 44)
    c.drawRightString(W - MARGIN, H - HEADER_H/2 - 11, ar(ld['letter']))

    y = H - HEADER_H - 8

    # ── Formes ─────────────────────────────────────────────
    c.setFillColor(color)
    c.setFont('Helvetica-Bold', 10)
    c.drawString(MARGIN, y, 'Formes selon la position')
    c.setStrokeColor(color)
    c.setLineWidth(1.2)
    c.line(MARGIN, y - 3, MARGIN + 175, y - 3)
    y -= 12

    forms = ld['forms']
    fw = CONTENT_W / len(forms)
    for i, (pos, char) in enumerate(forms):
        fx = MARGIN + i * fw
        fy = y - 58
        c.setFillColor(color_lt)
        c.roundRect(fx + 2, fy, fw - 4, 58, 5, fill=1, stroke=0)
        c.setStrokeColor(color)
        c.setLineWidth(0.8)
        c.roundRect(fx + 2, fy, fw - 4, 58, 5, fill=0, stroke=1)
        c.setFillColor(color)
        c.setFont('Helvetica-Bold', 7)
        c.drawCentredString(fx + fw/2, fy + 48, pos)
        c.setFillColor(DARK)
        c.setFont('ArabicB', 26)
        c.drawCentredString(fx + fw/2, fy + 18, ar(char))
    y -= 68

    # ── Note ───────────────────────────────────────────────
    y -= 4
    c.setFillColor(color_lt)
    c.roundRect(MARGIN, y - 18, CONTENT_W, 20, 3, fill=1, stroke=0)
    c.setStrokeColor(color)
    c.setLineWidth(2)
    c.line(MARGIN, y - 18, MARGIN, y + 2)
    c.setLineWidth(0.3)
    c.setFillColor(DARK)
    c.setFont('Helvetica', 7.5)
    c.drawString(MARGIN + 6, y - 11, ld['note'])
    y -= 26

    # ── Grilles lettres ────────────────────────────────────
    y -= 4
    c.setFillColor(color)
    c.setFont('Helvetica-Bold', 10)
    c.drawString(MARGIN, y, "Entrainement — lettres")
    c.setStrokeColor(color)
    c.setLineWidth(1.2)
    c.line(MARGIN, y - 3, MARGIN + 165, y - 3)
    c.setFillColor(HexColor('#333333'))
    c.setFont('Helvetica-Bold', 7.5)
    c.drawRightString(W - MARGIN, y, 'Direction : droite vers gauche')
    y -= 10

    for pos, char in forms:
        if y - BAND_H - 14 < 115:
            break
        c.setFillColor(DARK)
        c.setFont('Helvetica-Bold', 7.5)
        c.drawString(MARGIN, y - 3, f'{pos} :')
        y -= 8
        gy = y - BAND_H
        _draw_grid_band(c, MARGIN, gy, GRID_W, BAND_H)

        box_x = MARGIN + GRID_W + 2
        c.setFillColor(color_lt)
        c.roundRect(box_x, gy, 44, BAND_H, 4, fill=1, stroke=0)
        c.setStrokeColor(color)
        c.setLineWidth(1.2)
        c.roundRect(box_x, gy, 44, BAND_H, 4, fill=0, stroke=1)
        c.setFillColor(color)
        c.setFont('ArabicB', 22)
        c.drawCentredString(box_x + 22, gy + BAND_H/2 - 10, ar(char))

        baseline = gy + BAND_H - CELL
        step = CELL * 3.5
        x_start = MARGIN + GRID_W - CELL * 0.4

        c.setFillColor(HexColor('#000000'))
        c.setFont('ArabicB', LETTER_FONT)
        c.drawRightString(x_start, baseline, ar(char))

        c.setFillColor(HexColor('#888888'))
        c.drawRightString(x_start - step, baseline, ar(char))
        c.drawRightString(x_start - step * 2, baseline, ar(char))

        y = gy - 10

    # ── Grilles mots ───────────────────────────────────────
    y -= 2
    c.setFillColor(color)
    c.setFont('Helvetica-Bold', 10)
    c.drawString(MARGIN, y, "Entrainement — mots")
    c.setStrokeColor(color)
    c.setLineWidth(1.2)
    c.line(MARGIN, y - 3, MARGIN + 155, y - 3)
    y -= 10

    for word_ar, phoneme, translation in ld['words']:
        if y - WORD_BAND_H - 16 < 22:
            break
        c.setFillColor(HexColor('#333333'))
        c.setFont('Helvetica', 7.5)
        c.drawString(MARGIN, y - 3, f'{translation}  ({phoneme})')
        y -= 8
        wy = y - WORD_BAND_H
        _draw_grid_band(c, MARGIN, wy, GRID_W, WORD_BAND_H)

        box_x = MARGIN + GRID_W + 2
        c.setFillColor(color_lt)
        c.roundRect(box_x, wy, 44, WORD_BAND_H, 4, fill=1, stroke=0)
        c.setStrokeColor(color)
        c.setLineWidth(1.2)
        c.roundRect(box_x, wy, 44, WORD_BAND_H, 4, fill=0, stroke=1)
        c.setFillColor(color)
        c.setFont('ArabicR', 14)
        c.drawCentredString(box_x + 22, wy + WORD_BAND_H/2 - 7, ar(word_ar))

        word_baseline = wy + WORD_BAND_H - CELL
        word_x = MARGIN + GRID_W - CELL * 0.4
        c.setFillColor(HexColor('#000000'))
        c.setFont('ArabicR', WORD_FONT)
        c.drawRightString(word_x, word_baseline, ar(word_ar))
        y = wy - 12

    # ── Footer ─────────────────────────────────────────────
    c.setFillColor(color)
    c.rect(0, 0, W, 18, fill=1, stroke=0)
    c.setFillColor(HexColor('#FFFFFF'))
    c.setFont('Helvetica', 7.5)
    c.drawCentredString(W/2, 6,
        f"LangDad — Module 1 — Lettre {ld['name']} ({ld['letter']}) — Fiche d'ecriture")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()

# ── API publique ──────────────────────────────────────────────
def generate_letter_sheet(module_id: int, letter_name: str) -> bytes:
    """Génère la fiche d'une lettre spécifique d'un module."""
    letters = MODULES_LETTERS.get(module_id, [])
    ld = next((l for l in letters if l['name'].lower() == letter_name.lower()), None)
    if ld is None:
        raise ValueError(f"Lettre '{letter_name}' introuvable dans le module {module_id}")
    return _make_sheet_buffer(ld)

def generate_module_sheets(module_id: int) -> bytes:
    """Génère toutes les fiches d'un module en un seul PDF."""
    letters = MODULES_LETTERS.get(module_id)
    if not letters:
        raise ValueError(f"Module {module_id} introuvable")

    writer = PdfWriter()
    for ld in letters:
        sheet_bytes = _make_sheet_buffer(ld)
        reader = PdfReader(io.BytesIO(sheet_bytes))
        writer.add_page(reader.pages[0])

    out = io.BytesIO()
    writer.write(out)
    out.seek(0)
    return out.read()