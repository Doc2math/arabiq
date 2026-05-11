"""
Endpoint Certifications — app/api/v1/endpoints/certifications.py
Style LangDad : violet + orange, multilingue, QR code
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, Certification, Module, LessonProgress, Lesson, Course
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import os

router = APIRouter(prefix="/certifications", tags=["certifications"])

CERTS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', '..', '..', '..', 'certs'
)

TRANSLATIONS = {
    "fr": {
        "title":      "Certificat de réussite",
        "platform":   "Plateforme d'apprentissage de l'arabe",
        "awarded_to": "Décerné à",
        "completed":  "pour avoir complété avec succès",
        "score":      "Score",
        "issued":     "Délivré le",
        "verify":     "Vérifier : langdad.com/verify",
        "degree":     "Degré",
        "months": ["","janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],
        "module_order": ["","Premier","Deuxième","Troisième","Quatrième","Cinquième","Sixième","Septième","Huitième","Neuvième","Dixième","Onzième","Douzième"],
    },
    "en": {
        "title":      "Certificate of Achievement",
        "platform":   "Arabic Learning Platform",
        "awarded_to": "Awarded to",
        "completed":  "for successfully completing",
        "score":      "Score",
        "issued":     "Issued on",
        "verify":     "Verify: langdad.com/verify",
        "degree":     "Degree",
        "months": ["","January","February","March","April","May","June","July","August","September","October","November","December"],
        "module_order": ["","First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth","Eleventh","Twelfth"],
    },
    "es": {
        "title":      "Certificado de logro",
        "platform":   "Plataforma de aprendizaje del árabe",
        "awarded_to": "Otorgado a",
        "completed":  "por haber completado con éxito",
        "score":      "Puntuación",
        "issued":     "Emitido el",
        "verify":     "Verificar: langdad.com/verify",
        "degree":     "Grado",
        "months": ["","enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
        "module_order": ["","Primer","Segundo","Tercer","Cuarto","Quinto","Sexto","Séptimo","Octavo","Noveno","Décimo","Undécimo","Duodécimo"],
    },
    "de": {
        "title":      "Leistungszertifikat",
        "platform":   "Arabisch-Lernplattform",
        "awarded_to": "Verliehen an",
        "completed":  "für den erfolgreichen Abschluss",
        "score":      "Ergebnis",
        "issued":     "Ausgestellt am",
        "verify":     "Überprüfen: langdad.com/verify",
        "degree":     "Stufe",
        "months": ["","Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
        "module_order": ["","Erstes","Zweites","Drittes","Viertes","Fünftes","Sechstes","Siebtes","Achtes","Neuntes","Zehntes","Elftes","Zwölftes"],
    },
    "nl": {
        "title":      "Certificaat van prestatie",
        "platform":   "Arabisch leerplatform",
        "awarded_to": "Uitgereikt aan",
        "completed":  "voor het succesvol afronden van",
        "score":      "Score",
        "issued":     "Uitgegeven op",
        "verify":     "Verifiëren: langdad.com/verify",
        "degree":     "Graad",
        "months": ["","januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"],
        "module_order": ["","Eerste","Tweede","Derde","Vierde","Vijfde","Zesde","Zevende","Achtste","Negende","Tiende","Elfde","Twaalfde"],
    },
}


def get_translations(lang: str) -> dict:
    return TRANSLATIONS.get(lang, TRANSLATIONS["fr"])


def format_date(dt: datetime, lang: str) -> str:
    t = get_translations(lang)
    return f"{dt.day} {t['months'][dt.month]} {dt.year}"


def module_label(module_order: int, degree: int, lang: str) -> str:
    t = get_translations(lang)
    order_word = t["module_order"][module_order] if module_order < len(t["module_order"]) else f"Module {module_order}"
    return f"{order_word} Module — {t['degree']} {degree}"


def generate_cert_number(user_id: str, module_id: int) -> str:
    year = datetime.now().year
    short_id = str(user_id).replace('-', '')[:6].upper()
    return f"LANGDAD-{year}-{short_id}-M{module_id}"


async def generate_cert_pdf(cert, user, module_order: int, degree: int, lang: str) -> str:
    try:
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.colors import HexColor
        import qrcode
        import io

        os.makedirs(CERTS_DIR, exist_ok=True)
        pdf_path = os.path.join(CERTS_DIR, f"{cert.id}.pdf")

        t  = get_translations(lang)
        W, H = landscape(A4)
        c  = rl_canvas.Canvas(pdf_path, pagesize=landscape(A4))

        violet    = HexColor('#6C3FC5')
        violet_dk = HexColor('#4A2A8A')
        violet_lt = HexColor('#EDE8FB')
        orange    = HexColor('#F07C1E')
        dark      = HexColor('#1A1A2E')
        gray      = HexColor('#5A5A7A')
        white     = HexColor('#FFFFFF')
        bg        = HexColor('#F8F7FF')

        c.setFillColor(bg)
        c.rect(0, 0, W, H, fill=1, stroke=0)

        bar_w = 12
        c.setFillColor(violet)
        c.rect(0, H/2, bar_w, H/2, fill=1, stroke=0)
        c.setFillColor(orange)
        c.rect(0, 0, bar_w, H/2, fill=1, stroke=0)

        c.setStrokeColor(violet)
        c.setLineWidth(2)
        c.rect(bar_w + 16, 16, W - bar_w - 32, H - 32, fill=0, stroke=1)

        badge_x, badge_y = W/2, H - 60
        c.setFillColor(violet)
        c.roundRect(badge_x - 70, badge_y - 14, 140, 26, 13, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(badge_x, badge_y - 5, "LANGDAD")

        c.setFont("Helvetica-Bold", 30)
        c.setFillColor(violet)
        c.drawCentredString(W/2, H - 110, t["title"])

        c.setStrokeColor(orange)
        c.setLineWidth(1.5)
        c.line(W/2 - 120, H - 125, W/2 + 120, H - 125)

        c.setFont("Helvetica", 13)
        c.setFillColor(gray)
        c.drawCentredString(W/2, H - 160, t["awarded_to"])

        c.setFont("Helvetica-Bold", 34)
        c.setFillColor(dark)
        c.drawCentredString(W/2, H - 205, user.username)

        c.setFont("Helvetica", 13)
        c.setFillColor(gray)
        c.drawCentredString(W/2, H - 240, t["completed"])

        label = module_label(module_order, degree, lang)
        box_w, box_h = 320, 40
        box_x = W/2 - box_w/2
        box_y = H - 295
        c.setFillColor(violet_lt)
        c.roundRect(box_x, box_y, box_w, box_h, 8, fill=1, stroke=0)
        c.setStrokeColor(violet)
        c.setLineWidth(1)
        c.roundRect(box_x, box_y, box_w, box_h, 8, fill=0, stroke=1)
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(violet_dk)
        c.drawCentredString(W/2, box_y + 13, label)

        score_pct = int(cert.overall_score * 100)
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(orange)
        c.drawCentredString(W/2, H - 340, f"{t['score']} : {score_pct}%")

        c.setStrokeColor(HexColor('#E8E4F8'))
        c.setLineWidth(1)
        c.line(bar_w + 40, 90, W - 40, 90)

        date_str = format_date(cert.issued_at or datetime.now(), lang)
        c.setFont("Helvetica", 10)
        c.setFillColor(gray)
        c.drawString(bar_w + 40, 65, f"{t['issued']} : {date_str}")
        c.drawCentredString(W/2, 65, f"N° {cert.certificate_number}")

        verify_url = f"https://langdad.com/verify/{cert.certificate_number}"
        qr = qrcode.QRCode(version=1, box_size=3, border=2)
        qr.add_data(verify_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buf = io.BytesIO()
        qr_img.save(qr_buf, format="PNG")
        qr_buf.seek(0)

        from reportlab.lib.utils import ImageReader
        qr_reader = ImageReader(qr_buf)
        qr_size = 64
        qr_x = W - 40 - qr_size
        qr_y = 40
        c.drawImage(qr_reader, qr_x, qr_y, width=qr_size, height=qr_size)
        c.setFont("Helvetica", 7)
        c.setFillColor(gray)
        c.drawCentredString(qr_x + qr_size/2, qr_y - 8, t["verify"])

        c.save()
        return pdf_path

    except Exception as e:
        print(f"Erreur génération PDF: {e}")
        return ""


# ── Schémas ────────────────────────────────────────────────────
class CertificationRead(BaseModel):
    id: str
    module_id: int
    module_title: str
    overall_score: float
    certificate_number: str
    issued_at: str
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True


class CertificationRequest(BaseModel):
    module_id: int
    module_order: int = 1
    degree: int = 1
    overall_score: float = 0.0
    lang: str = "fr"


# ── Endpoints ──────────────────────────────────────────────────

@router.post("/generate", response_model=CertificationRead, status_code=status.HTTP_201_CREATED)
async def generate_certification(
    payload: CertificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Vérifier module
    mod_result = await db.execute(select(Module).where(Module.id == payload.module_id))
    module = mod_result.scalar_one_or_none()
    if not module:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Module introuvable")

    # Certificat déjà existant → regénérer dans la bonne langue
    existing = await db.execute(
        select(Certification).where(
            Certification.user_id == current_user.id,
            Certification.module_id == payload.module_id,
        )
    )
    existing_cert = existing.scalar_one_or_none()

    if existing_cert:
        new_pdf = await generate_cert_pdf(
            existing_cert, current_user,
            payload.module_order, payload.degree, payload.lang
        )
        if new_pdf:
            existing_cert.pdf_url = f"/api/v1/certifications/{existing_cert.id}/download"
            await db.commit()

        return CertificationRead(
            id=str(existing_cert.id),
            module_id=existing_cert.module_id,
            module_title=module.title,
            overall_score=existing_cert.overall_score,
            certificate_number=existing_cert.certificate_number,
            issued_at=existing_cert.issued_at.isoformat(),
            pdf_url=existing_cert.pdf_url,
        )

    # Vérifier score >= 80%
    if payload.overall_score < 0.80:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Score insuffisant : {int(payload.overall_score*100)}% (minimum 80%)"
        )

    # Vérifier leçons complétées
    les_result = await db.execute(
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(Course.module_id == payload.module_id)
    )
    lessons    = les_result.scalars().all()
    lesson_ids = [l.id for l in lessons]

    prog_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    completed_ids = {p.lesson_id for p in prog_result.scalars().all()}

    if len(completed_ids) < len(lesson_ids):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Module incomplet : {len(completed_ids)}/{len(lesson_ids)} leçons complétées"
        )

    # Créer certificat
    cert = Certification(
        id=uuid.uuid4(),
        user_id=current_user.id,
        module_id=payload.module_id,
        bkt_score=payload.overall_score,
        overall_score=payload.overall_score,
        certificate_number=generate_cert_number(str(current_user.id), payload.module_id),
        issued_at=datetime.now(timezone.utc),
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)

    # Générer PDF
    pdf_path = await generate_cert_pdf(
        cert, current_user,
        payload.module_order, payload.degree, payload.lang
    )
    if pdf_path:
        cert.pdf_url = f"/api/v1/certifications/{cert.id}/download"
        await db.commit()

    return CertificationRead(
        id=str(cert.id),
        module_id=cert.module_id,
        module_title=module.title,
        overall_score=cert.overall_score,
        certificate_number=cert.certificate_number,
        issued_at=cert.issued_at.isoformat(),
        pdf_url=cert.pdf_url,
    )


@router.get("/user", response_model=list[CertificationRead])
async def get_user_certifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Certification, Module)
        .join(Module, Certification.module_id == Module.id)
        .where(Certification.user_id == current_user.id)
        .order_by(Certification.issued_at.desc())
    )
    return [
        CertificationRead(
            id=str(cert.id),
            module_id=cert.module_id,
            module_title=mod.title,
            overall_score=cert.overall_score,
            certificate_number=cert.certificate_number,
            issued_at=cert.issued_at.isoformat(),
            pdf_url=cert.pdf_url,
        )
        for cert, mod in result.all()
    ]


@router.delete("/{cert_id}")
async def delete_certification(
    cert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        cert_uuid = uuid.UUID(cert_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="UUID invalide")

    result = await db.execute(
        select(Certification).where(
            Certification.id == cert_uuid,
            Certification.user_id == current_user.id,
        )
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Certificat introuvable")

    pdf_path = os.path.join(CERTS_DIR, f"{cert.id}.pdf")
    if os.path.exists(pdf_path):
        os.remove(pdf_path)

    await db.delete(cert)
    await db.commit()
    return {"message": "Certificat supprimé"}


@router.get("/verify/{cert_number}")
async def verify_certification(
    cert_number: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Certification, User, Module)
        .join(User, Certification.user_id == User.id)
        .join(Module, Certification.module_id == Module.id)
        .where(Certification.certificate_number == cert_number)
    )
    row = result.first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Certificat introuvable")

    cert, user, module = row
    return {
        "valid": True,
        "certificate_number": cert.certificate_number,
        "username": user.username,
        "module_title": module.title,
        "overall_score": cert.overall_score,
        "issued_at": cert.issued_at.isoformat(),
    }


@router.get("/{cert_id}/download")
async def download_certification(
    cert_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        cert_uuid = uuid.UUID(cert_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="UUID invalide")

    result = await db.execute(
        select(Certification).where(Certification.id == cert_uuid)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Certificat introuvable")

    pdf_path = os.path.join(CERTS_DIR, f"{cert.id}.pdf")

    if not os.path.exists(pdf_path):
        user_result = await db.execute(select(User).where(User.id == cert.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            pdf_path = await generate_cert_pdf(cert, user, 1, 1, "fr")

    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="PDF introuvable")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"certificat-{cert.certificate_number}.pdf"
    )