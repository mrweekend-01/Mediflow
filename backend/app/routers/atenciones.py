from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.database import get_db
from app.schemas.atencion import AtencionCreate, AtencionHistoricaCreate, AtencionResponse
from app.services import (
    registrar_atencion,
    obtener_atenciones_por_medico,
    obtener_atenciones_por_clinica,
    eliminar_atencion
)
from app.utils.dependencies import require_rol, get_current_user
from app.utils.responses import created_response, success_response
from app.models.usuario import Usuario
from app.models.atencion import Atencion
import uuid

router = APIRouter(prefix="/atenciones", tags=["Atenciones"])


@router.post("/", response_model=AtencionResponse)
async def endpoint_registrar_atencion(
    data: AtencionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("admision", "coordinador", "superadmin"))
):
    """Registra una atención en tiempo real — fecha y turno automáticos"""
    return await registrar_atencion(data, current_user.id, db)


@router.post("/historico")
async def endpoint_registrar_historico(
    data: AtencionHistoricaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("archivos", "coordinador", "superadmin"))
):
    """
    Registra N atenciones con fecha y turno manual.
    Usado por archivos y coordinador para cargar datos históricos.
    Crea un registro por cada atención indicada en 'cantidad'.
    """
    fecha_manual = datetime.strptime(data.fecha, "%Y-%m-%d")

    registros_creados = 0
    for _ in range(data.cantidad):
        nueva = Atencion(
            medico_id=data.medico_id,
            usuario_id=current_user.id,
            clinica_id=data.clinica_id,
            turno=data.turno,
            registrado_en=fecha_manual
        )
        db.add(nueva)
        registros_creados += 1

    await db.flush()
    return success_response(
        {"registros_creados": registros_creados},
        f"{registros_creados} atenciones registradas correctamente"
    )


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