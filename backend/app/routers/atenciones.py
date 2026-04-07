from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.atencion import AtencionCreate, AtencionResponse
from app.services import (
    registrar_atencion,
    obtener_atenciones_por_medico,
    obtener_atenciones_por_clinica,
    eliminar_atencion
)
from app.utils.dependencies import require_rol, get_current_user
from app.utils.responses import created_response, success_response
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/atenciones", tags=["Atenciones"])


@router.post("/", response_model=AtencionResponse)
async def endpoint_registrar_atencion(
    data: AtencionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("admision", "coordinador", "superadmin"))
):
    """Registra una atención en tiempo real — admisión y coordinador"""
    return await registrar_atencion(data, current_user.id, db)


@router.get("/clinica/{clinica_id}", response_model=list[AtencionResponse])
async def listar_atenciones_clinica(
    clinica_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Lista todas las atenciones de una clínica"""
    return await obtener_atenciones_por_clinica(clinica_id, db)


@router.get("/medico/{medico_id}", response_model=list[AtencionResponse])
async def listar_atenciones_medico(
    medico_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Lista todas las atenciones de un médico específico"""
    return await obtener_atenciones_por_medico(medico_id, db)


@router.delete("/{atencion_id}")
async def endpoint_eliminar_atencion(
    atencion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador", "admision"))
):
    """Elimina una atención por su ID — solo para correcciones"""
    await eliminar_atencion(atencion_id, db)
    return success_response(None, "Atención eliminada correctamente")