from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.services.auth_service import login, crear_usuario
from app.utils.dependencies import get_current_user, require_rol
from app.utils.responses import created_response, success_response
from app.models.usuario import Usuario

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
async def endpoint_login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Endpoint de login — retorna token JWT si las credenciales son correctas"""
    real_ip = (
        request.headers.get("X-Real-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or (request.client.host if request.client else None)
    )
    return await login(data, db, ip=real_ip)


@router.post("/usuarios", response_model=UsuarioResponse)
async def endpoint_crear_usuario(
    data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Crea un nuevo usuario — solo superadmin y coordinador pueden hacerlo"""
    usuario = await crear_usuario(data, db)
    return usuario


@router.get("/me", response_model=UsuarioResponse)
async def endpoint_me(current_user: Usuario = Depends(get_current_user)):
    """Retorna los datos del usuario autenticado actualmente"""
    return current_user