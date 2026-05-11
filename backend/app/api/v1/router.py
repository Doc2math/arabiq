from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.curriculum import router as curriculum_router
from app.api.v1.endpoints.writing_sheets import router as writing_sheets_router
from app.api.v1.endpoints.bkt import router as bkt_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.superadmin import router as superadmin_router
from app.api.v1.endpoints.certifications import router as certifications_router
from app.api.v1.endpoints.institution import router as institution_router
from app.api.v1.endpoints.oral import router as oral_router
from app.api.v1.endpoints.blog import router as blog_router





api_router = APIRouter(prefix="/api/v1")
api_router.include_router(blog_router)
api_router.include_router(oral_router)
api_router.include_router(auth_router)
api_router.include_router(certifications_router)
api_router.include_router(curriculum_router)
api_router.include_router(writing_sheets_router)
api_router.include_router(bkt_router)
api_router.include_router(admin_router)
api_router.include_router(superadmin_router)
api_router.include_router(institution_router)