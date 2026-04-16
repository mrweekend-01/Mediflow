import asyncio
import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.core.security import decode_access_token

logger = logging.getLogger("mediflow.access")


async def _registrar_auditoria(email: str, accion: str, ip: str | None) -> None:
    """Inserta un registro de auditoría usando su propia sesión de BD."""
    from app.database import AsyncSessionLocal
    from app.models.auditoria import Auditoria
    from app.models.usuario import Usuario
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(Usuario).where(Usuario.email == email))
            usuario = result.scalar_one_or_none()
            db.add(Auditoria(
                usuario_id=usuario.id if usuario else None,
                usuario_email=email,
                usuario_nombre=usuario.nombre if usuario else None,
                accion=accion,
                ip=ip,
            ))
            await db.commit()
        except Exception:
            await db.rollback()

from app.routers import (
    auth_router,
    clinicas_router,
    usuarios_router,
    medicos_router,
    especialidades_router,
    atenciones_router,
    dashboard_router,
    triaje_router,
    control_medico_router,
    campanas_router,
    auditoria_router,
)

# Instancia principal de la aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Plataforma SaaS para gestión de productividad médica en clínicas privadas",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Hosts de confianza (permite cualquier host; ajustar en producción si se desea restringir)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_and_audit(request: Request, call_next):
    real_ip = (
        request.headers.get("X-Real-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000

    logger.info(
        '%s "%s %s" %s %.0fms',
        real_ip,
        request.method,
        request.url.path,
        response.status_code,
        elapsed,
    )

    # Audita POST/PUT/DELETE exitosos (login lo audita auth_service directamente)
    if (
        request.method in ("POST", "PUT", "DELETE")
        and request.url.path != "/auth/login"
        and response.status_code < 300
    ):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            payload = decode_access_token(auth_header[7:])
            if payload and payload.get("sub"):
                accion = f"{request.method} {request.url.path}"
                asyncio.create_task(
                    _registrar_auditoria(payload["sub"], accion, real_ip)
                )

    return response

# Registro de todos los routers
app.include_router(auth_router)
app.include_router(clinicas_router)
app.include_router(usuarios_router)
app.include_router(medicos_router)
app.include_router(especialidades_router)
app.include_router(atenciones_router)
app.include_router(dashboard_router)
app.include_router(triaje_router)
app.include_router(control_medico_router)
app.include_router(campanas_router)
app.include_router(auditoria_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "corriendo",
        "docs": "/docs"
    }


@app.get("/health", tags=["Root"])
async def health():
    return {"status": "ok"}