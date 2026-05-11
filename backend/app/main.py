from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import engine
from app.models.models import Base
from fastapi.staticfiles import StaticFiles




@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ne pas créer les tables au démarrage — utilisez migrate.py séparément
    yield
    await engine.dispose()

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    @app.get("/health", include_in_schema=False)
    async def health():
        return JSONResponse({"status": "ok", "version": settings.APP_VERSION})
    
    return app


app = create_app()