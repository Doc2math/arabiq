"""
Endpoint Certifications — app/api/v1/endpoints/certifications.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, Certification, Module, LessonProgress, Lesson, Course
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import os

router = APIRouter(prefix="/certifications", tags=["certifications"])

CERTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', 'certs')


def generate_cert_number(user_id: str, module_id: int) -> str:
    """Génère un numéro de certificat unique."""
    year = datetime.now().year
    short_id = str(user_id).replace('-', '')[:6].upper()
    return f"LANGDAD-{year}-{short_id}-M{module_id}"


async def generate_cert_pdf(cert: Certification, user: User, module_title: str) -> str:
    """Génère le PDF du certificat avec ReportLab."""
    try:
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.colors import HexColor
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFFont

        os.makedirs(CERTS_DIR, exist_ok=True)
        pdf_path = os.path.join(CERTS_DIR, f"{cert.id}.pdf")

        W, H = landscape(A4)
        c = rl_canvas.Canvas(pdf_path, pagesize=landscape(A4))

        violet = HexColor('#6C3FC5')
        orange = HexColor('#F07C1E')
        gold   = HexColor('#F9A825')
        dark   = HexColor('#1A1A2E')
        light  = HexColor('#EDE8FB')

        # Fond
        c.setFillColor(HexColor('#F8F7FF'))
        c.rect(0, 0, W, H, fill=1, stroke=0)

        # Bordure décorative
        c.setStrokeColor(violet)
        c.setLineWidth(8)
        c.rect(20, 20, W-40, H-40, fill=0, stroke=1)
        c.setStrokeColor(gold)
        c.setLineWidth(2)
        c.rect(28, 28, W-56, H-56, fill=0, stroke=1)

        # Titre principal
        c.setFillColor(violet)
        c.setFont("Helvetica-Bold", 36)
        c.drawCentredString(W/2, H-100, "Certificat de Réussite")

        # Sous-titre
        c.setFont("Helvetica", 16)
        c.setFillColor(dark)
        c.drawCentredString(W/2, H-135, "LangDad — Plateforme d'apprentissage de l'arabe")

        # Ligne déco
        c.setStrokeColor(gold)
        c.setLineWidth(1.5)
        c.line(100, H-150, W-100, H-150)

        # Texte principal
        c.setFont("Helvetica", 14)
        c.setFillColor(dark)
        c.drawCentredString(W/2, H-195, "Ce certificat est décerné à")

        # Nom utilisateur
        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(violet)
        c.drawCentredString(W/2, H-240, user.username)

        # Texte module
        c.setFont("Helvetica", 14)
        c.setFillColor(dark)
        c.drawCentredString(W/2, H-280, "pour avoir complété avec succès")

        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(orange)
        c.drawCentredString(W/2, H-310, module_title)

        # Score
        c.setFont("Helvetica", 12)
        c.setFillColor(dark)
        c.drawCentredString(W/2, H-345, f"Score BKT : {int(cert.bkt_score * 100)}%   |   Score global : {int(cert.overall_score * 100)}%")

        # Ligne déco
        c.setStrokeColor(gold)
        c.line(100, H-365, W-100, H-365)

        # Date et numéro
        date_str = cert.issued_at.strftime("%d %B %Y") if cert.issued_at else datetime.now().strftime("%d %B %Y")
        c.setFont("Helvetica", 11)
        c.setFillColor(HexColor('#5A5A7A'))
        c.drawString(60, 60, f"Délivré le : {date_str}")
        c.drawCentredString(W/2, 60, f"N° {cert.certificate_number}")
        c.drawRightString(W-60, 60, "langdad.com")

        # Lune décorative
        c.setFont("Helvetica-Bold", 48)
        c.setFillColor(HexColor('#6C3FC520'))
        c.drawCentredString(W/2, H-420, "🌙")

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
    bkt_score: float
    overall_score: float
    certificate_number: str
    issued_at: str
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True


class CertificationRequest(BaseModel):
    module_id: int
    bkt_score: float = 0.0
    overall_score: float = 0.0


# ── Endpoints ──────────────────────────────────────────────────

@router.post("/generate", response_model=CertificationRead, status_code=status.HTTP_201_CREATED)
async def generate_certification(
    payload: CertificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Génère un certificat si le module est complété avec score suffisant."""

    # Vérifier que le module existe
    mod_result = await db.execute(select(Module).where(Module.id == payload.module_id))
    module = mod_result.scalar_one_or_none()
    if not module:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Module introuvable")

    # Vérifier si certificat déjà existant
    existing = await db.execute(
        select(Certification).where(
            Certification.user_id == current_user.id,
            Certification.module_id == payload.module_id,
        )
    )
    existing_cert = existing.scalar_one_or_none()
    if existing_cert:
        return CertificationRead(
            id=str(existing_cert.id),
            module_id=existing_cert.module_id,
            module_title=module.title,
            bkt_score=existing_cert.bkt_score,
            overall_score=existing_cert.overall_score,
            certificate_number=existing_cert.certificate_number,
            issued_at=existing_cert.issued_at.isoformat(),
            pdf_url=existing_cert.pdf_url,
        )

    # Vérifier que toutes les leçons sont complétées
    les_result = await db.execute(
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(Course.module_id == payload.module_id)
    )
    lessons = les_result.scalars().all()
    lesson_ids = [l.id for l in lessons]

    prog_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    progressions = prog_result.scalars().all()
    completed_ids = {p.lesson_id for p in progressions}

    if len(completed_ids) < len(lesson_ids):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Module incomplet : {len(completed_ids)}/{len(lesson_ids)} leçons complétées"
        )

    # Vérifier score suffisant
    if payload.overall_score < 0.70:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Score insuffisant : {int(payload.overall_score*100)}% (minimum 70%)"
        )

    # Créer le certificat
    cert = Certification(
        id=uuid.uuid4(),
        user_id=current_user.id,
        module_id=payload.module_id,
        bkt_score=payload.bkt_score,
        overall_score=payload.overall_score,
        certificate_number=generate_cert_number(str(current_user.id), payload.module_id),
        issued_at=datetime.now(timezone.utc),
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)

    # Générer le PDF
    pdf_path = await generate_cert_pdf(cert, current_user, module.title)
    if pdf_path:
        cert.pdf_url = f"/api/v1/certifications/{cert.id}/download"
        await db.commit()

    return CertificationRead(
        id=str(cert.id),
        module_id=cert.module_id,
        module_title=module.title,
        bkt_score=cert.bkt_score,
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
    """Retourne tous les certificats de l'utilisateur."""
    result = await db.execute(
        select(Certification, Module)
        .join(Module, Certification.module_id == Module.id)
        .where(Certification.user_id == current_user.id)
        .order_by(Certification.issued_at.desc())
    )
    rows = result.all()

    return [
        CertificationRead(
            id=str(cert.id),
            module_id=cert.module_id,
            module_title=mod.title,
            bkt_score=cert.bkt_score,
            overall_score=cert.overall_score,
            certificate_number=cert.certificate_number,
            issued_at=cert.issued_at.isoformat(),
            pdf_url=cert.pdf_url,
        )
        for cert, mod in rows
    ]


@router.get("/{cert_id}/download")
async def download_certification(
    cert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Télécharge le PDF du certificat."""
    result = await db.execute(
        select(Certification).where(
            Certification.id == uuid.UUID(cert_id),
            Certification.user_id == current_user.id,
        )
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Certificat introuvable")

    pdf_path = os.path.join(CERTS_DIR, f"{cert.id}.pdf")
    if not os.path.exists(pdf_path):
        # Régénérer le PDF
        mod_result = await db.execute(select(Module).where(Module.id == cert.module_id))
        module = mod_result.scalar_one_or_none()
        pdf_path = await generate_cert_pdf(cert, current_user, module.title if module else "Module")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"certificat-{cert.certificate_number}.pdf"
    )