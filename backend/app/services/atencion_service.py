from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.atencion import Atencion
from app.schemas.atencion import AtencionCreate
from fastapi import HTTPException, status
import uuid


async def registrar_atencion(
    data: AtencionCreate,
    usuario_id: uuid.UUID,
    db: AsyncSession
) -> Atencion:
    """Registra una nueva atención en tiempo real"""
    nueva = Atencion(
        medico_id=data.medico_id,
        usuario_id=usuario_id,
        clinica_id=data.clinica_id,
        turno=data.turno
        # registrado_en se guarda automáticamente con server_default
    )
    db.add(nueva)
    await db.flush()
    return nueva


async def obtener_atenciones_por_medico(
    medico_id: uuid.UUID,
    db: AsyncSession
) -> list:
    """Retorna todas las atenciones de un médico ordenadas por fecha"""
    result = await db.execute(
        select(Atencion)
        .where(Atencion.medico_id == medico_id)
        .order_by(Atencion.registrado_en.desc())
    )
    return result.scalars().all()


async def obtener_atenciones_por_clinica(
    clinica_id: uuid.UUID,
    db: AsyncSession
) -> list:
    """Retorna todas las atenciones de una clínica ordenadas por fecha"""
    result = await db.execute(
        select(Atencion)
        .where(Atencion.clinica_id == clinica_id)
        .order_by(Atencion.registrado_en.desc())
    )
    return result.scalars().all()


async def eliminar_atencion(
    atencion_id: uuid.UUID,
    db: AsyncSession
) -> None:
    """Elimina una atención por su ID (solo para correcciones)"""
    result = await db.execute(
        select(Atencion).where(Atencion.id == atencion_id)
    )
    atencion = result.scalar_one_or_none()

    if not atencion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atención no encontrada"
        )

    await db.delete(atencion)
    await db.flush()