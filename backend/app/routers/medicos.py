from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.medico import MedicoCreate, MedicoUpdate, MedicoResponse
from app.schemas.horario import HorarioCreate, HorarioUpdate, HorarioResponse
from app.services import (
    obtener_medicos, obtener_medico, crear_medico,
    actualizar_medico, eliminar_medico,
    obtener_horarios, crear_horario,
    actualizar_horario, eliminar_horario
)
from app.utils.dependencies import require_rol, get_current_user
from app.utils.responses import created_response, success_response
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/medicos", tags=["Médicos"])


@router.get("/", response_model=list[MedicoResponse])
async def listar_medicos(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todos los médicos activos de la clínica del usuario autenticado"""
    return await obtener_medicos(current_user.clinica_id, db)


@router.get("/{medico_id}", response_model=MedicoResponse)
async def detalle_medico(
    medico_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Retorna el detalle de un médico por su ID"""
    return await obtener_medico(medico_id, db)


@router.post("/")
async def endpoint_crear_medico(
    data: MedicoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Crea un nuevo médico — solo superadmin y coordinador"""
    medico = await crear_medico(data, db)
    return created_response({"id": str(medico.id), "nombre": medico.nombre})


@router.put("/{medico_id}")
async def endpoint_actualizar_medico(
    medico_id: uuid.UUID,
    data: MedicoUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Actualiza los datos de un médico existente"""
    medico = await actualizar_medico(medico_id, data, db)
    return success_response({"id": str(medico.id), "nombre": medico.nombre})


@router.delete("/{medico_id}")
async def endpoint_eliminar_medico(
    medico_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Desactiva un médico (soft delete)"""
    await eliminar_medico(medico_id, db)
    return success_response(None, "Médico desactivado correctamente")


@router.get("/{medico_id}/horarios", response_model=list[HorarioResponse])
async def listar_horarios(
    medico_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Lista todos los horarios de un médico"""
    return await obtener_horarios(medico_id, db)


@router.post("/{medico_id}/horarios")
async def endpoint_crear_horario(
    medico_id: uuid.UUID,
    data: HorarioCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Crea un nuevo horario para un médico"""
    horario = await crear_horario(data, db)
    return created_response({"id": str(horario.id)})


@router.put("/horarios/{horario_id}")
async def endpoint_actualizar_horario(
    horario_id: uuid.UUID,
    data: HorarioUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Actualiza un horario existente"""
    horario = await actualizar_horario(horario_id, data, db)
    return success_response({"id": str(horario.id)})


@router.delete("/horarios/{horario_id}")
async def endpoint_eliminar_horario(
    horario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Elimina un horario por su ID"""
    await eliminar_horario(horario_id, db)
    return success_response(None, "Horario eliminado correctamente")