from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import (
    auth_router,
    clinicas_router,
    usuarios_router,
    medicos_router,
    especialidades_router,
    atenciones_router,
    dashboard_router
)


# Instancia principal de la aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Plataforma SaaS para gestión de productividad médica en clínicas privadas",
    docs_url="/docs",
    redoc_url="/redoc"
)


# Configuración de CORS — permite que el frontend React se conecte al backend
# En producción reemplazar ["*"] con el dominio real del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registro de todos los routers con sus prefijos
app.include_router(auth_router)
app.include_router(clinicas_router)
app.include_router(usuarios_router)
app.include_router(medicos_router)
app.include_router(especialidades_router)
app.include_router(atenciones_router)
app.include_router(dashboard_router)


# Endpoint raíz para verificar que el servidor está corriendo
@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "corriendo",
        "docs": "/docs"
    }


# Endpoint de salud para monitoreo
@app.get("/health", tags=["Root"])
async def health():
    return {"status": "ok"}