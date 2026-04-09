from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.medico import MedicoCreate, MedicoUpdate, MedicoResponse
from app.schemas.horario import HorarioCreate, HorarioUpdate, HorarioResponse, HorarioBulkCreate
from app.models.horario import Horario
from sqlalchemy import select
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


@router.get("/{medico_id}/horarios/mes")
async def listar_horarios_mes(
    medico_id: uuid.UUID,
    anio: int,
    mes: int,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Lista horarios por fecha específica de un mes — para el calendario"""
    from sqlalchemy import func
    result = await db.execute(
        select(Horario)
        .where(
            Horario.medico_id == medico_id,
            Horario.fecha.isnot(None),
            func.extract('year', Horario.fecha) == anio,
            func.extract('month', Horario.fecha) == mes
        )
        .order_by(Horario.fecha)
    )
    horarios = result.scalars().all()
    return success_response([
        {
            "id": str(h.id),
            "fecha": str(h.fecha),
            "turno": h.turno,
            "hora_inicio": str(h.hora_inicio),
            "hora_fin": str(h.hora_fin),
        }
        for h in horarios
    ])


@router.post("/{medico_id}/horarios/bulk")
async def endpoint_crear_horarios_bulk(
    medico_id: uuid.UUID,
    data: HorarioBulkCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Crea múltiples horarios por fecha de una vez — usado por el calendario"""
    for item in data.items:
        h = Horario(
            medico_id=medico_id,
            fecha=item.fecha,
            turno=item.turno,
            hora_inicio=item.hora_inicio,
            hora_fin=item.hora_fin,
        )
        db.add(h)
    await db.flush()
    return success_response({"creados": len(data.items)}, f"{len(data.items)} horarios creados")


@router.delete("/{medico_id}/horarios/fecha/{fecha}")
async def endpoint_eliminar_horarios_fecha(
    medico_id: uuid.UUID,
    fecha: str,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Elimina todos los horarios de un médico en una fecha específica"""
    from datetime import date as date_type
    from sqlalchemy import delete
    fecha_date = date_type.fromisoformat(fecha)
    await db.execute(
        delete(Horario).where(
            Horario.medico_id == medico_id,
            Horario.fecha == fecha_date
        )
    )
    await db.flush()
    return success_response(None, "Horarios de esa fecha eliminados")