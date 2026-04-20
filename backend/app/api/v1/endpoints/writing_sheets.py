from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.services.writing_sheets import generate_letter_sheet, generate_module_sheets

router = APIRouter(prefix="/writing-sheets", tags=["writing-sheets"])

@router.get("/module/{module_id}")
async def get_module_sheets(module_id: int):
    """Télécharger toutes les fiches d'écriture d'un module (PDF combiné)."""
    try:
        pdf_bytes = generate_module_sheets(module_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=LangDad_Module{module_id}_Fiches_Ecriture.pdf"}
    )

@router.get("/module/{module_id}/letter/{letter_name}")
async def get_letter_sheet(module_id: int, letter_name: str):
    """Télécharger la fiche d'écriture d'une lettre spécifique."""
    try:
        pdf_bytes = generate_letter_sheet(module_id, letter_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=LangDad_Module{module_id}_{letter_name}.pdf"}
    )