from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.medico import Medico
from app.models.horario import Horario
from app.schemas.medico import MedicoCreate, MedicoUpdate
from app.schemas.horario import HorarioCreate, HorarioUpdate
from fastapi import HTTPException, status
import uuid


async def obtener_medicos(clinica_id: uuid.UUID, db: AsyncSession) -> list:
    """Retorna todos los médicos activos de una clínica"""
    result = await db.execute(
        select(Medico)
        .where(Medico.clinica_id == clinica_id, Medico.activo == True)
    )
    return result.scalars().all()


async def obtener_medico(medico_id: uuid.UUID, db: AsyncSession) -> Medico:
    """Retorna un médico por su ID o lanza 404 si no existe"""
    result = await db.execute(select(Medico).where(Medico.id == medico_id))
    medico = result.scalar_one_or_none()
    if not medico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Médico no encontrado"
        )
    return medico


async def crear_medico(data: MedicoCreate, db: AsyncSession) -> Medico:
    """Crea un nuevo médico en la clínica"""
    nuevo = Medico(
        clinica_id=data.clinica_id,
        especialidad_id=data.especialidad_id,
        nombre=data.nombre,
        apellido=data.apellido,
        codigo=data.codigo
    )
    db.add(nuevo)
    await db.flush()
    return nuevo


async def actualizar_medico(
    medico_id: uuid.UUID,
    data: MedicoUpdate,
    db: AsyncSession
) -> Medico:
    """Actualiza los datos de un médico existente"""
    medico = await obtener_medico(medico_id, db)

    # Solo actualiza los campos que vienen en el request
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(medico, campo, valor)

    await db.flush()
    return medico


async def eliminar_medico(medico_id: uuid.UUID, db: AsyncSession) -> None:
    """Desactiva un médico (soft delete) en vez de eliminarlo"""
    medico = await obtener_medico(medico_id, db)
    medico.activo = False
    await db.flush()


async def obtener_horarios(medico_id: uuid.UUID, db: AsyncSession) -> list:
    """Retorna todos los horarios de un médico"""
    result = await db.execute(
        select(Horario).where(Horario.medico_id == medico_id)
    )
    return result.scalars().all()


async def crear_horario(data: HorarioCreate, db: AsyncSession) -> Horario:
    """Crea un nuevo horario para un médico"""
    nuevo = Horario(
        medico_id=data.medico_id,
        dia_semana=data.dia_semana,
        turno=data.turno,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        fecha=data.fecha
    )
    db.add(nuevo)
    await db.flush()
    return nuevo


async def actualizar_horario(
    horario_id: uuid.UUID,
    data: HorarioUpdate,
    db: AsyncSession
) -> Horario:
    """Actualiza un horario existente"""
    result = await db.execute(select(Horario).where(Horario.id == horario_id))
    horario = result.scalar_one_or_none()

    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(horario, campo, valor)

    await db.flush()
    return horario


async def eliminar_horario(horario_id: uuid.UUID, db: AsyncSession) -> None:
    """Elimina un horario por su ID"""
    result = await db.execute(select(Horario).where(Horario.id == horario_id))
    horario = result.scalar_one_or_none()

    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )

    await db.delete(horario)
    await db.flush()