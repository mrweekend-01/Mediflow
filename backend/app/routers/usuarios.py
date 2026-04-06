from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioUpdate, UsuarioResponse
from app.utils.dependencies import require_rol, get_current_user
from app.utils.responses import success_response, not_found_response
import uuid

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=list[UsuarioResponse])
async def listar_usuarios(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Lista todos los usuarios de la clínica del usuario autenticado"""
    result = await db.execute(
        select(Usuario).where(Usuario.clinica_id == current_user.clinica_id)
    )
    return result.scalars().all()


@router.put("/{usuario_id}")
async def actualizar_usuario(
    usuario_id: uuid.UUID,
    data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Actualiza los datos de un usuario existente"""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        return not_found_response("Usuario")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(usuario, campo, valor)
    await db.flush()
    return success_response({"id": str(usuario.id), "nombre": usuario.nombre})


@router.delete("/{usuario_id}")
async def desactivar_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Desactiva un usuario — no lo elimina de la BD"""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        return not_found_response("Usuario")
    usuario.activo = False
    await db.flush()
    return success_response(None, "Usuario desactivado correctamente")