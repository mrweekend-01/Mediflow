from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.especialidad import Especialidad
from app.schemas.especialidad import EspecialidadCreate, EspecialidadUpdate, EspecialidadResponse
from app.utils.dependencies import require_rol, get_current_user
from app.utils.responses import created_response, success_response, not_found_response
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/especialidades", tags=["Especialidades"])


@router.get("/", response_model=list[EspecialidadResponse])
async def listar_especialidades(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todas las especialidades de la clínica del usuario autenticado"""
    result = await db.execute(
        select(Especialidad).where(Especialidad.clinica_id == current_user.clinica_id)
    )
    return result.scalars().all()


@router.post("/")
async def crear_especialidad(
    data: EspecialidadCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Crea una nueva especialidad — solo superadmin y coordinador"""
    nueva = Especialidad(clinica_id=data.clinica_id, nombre=data.nombre)
    db.add(nueva)
    await db.flush()
    return created_response({"id": str(nueva.id), "nombre": nueva.nombre})


@router.put("/{especialidad_id}")
async def actualizar_especialidad(
    especialidad_id: uuid.UUID,
    data: EspecialidadUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Actualiza una especialidad existente"""
    result = await db.execute(
        select(Especialidad).where(Especialidad.id == especialidad_id)
    )
    especialidad = result.scalar_one_or_none()
    if not especialidad:
        return not_found_response("Especialidad")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(especialidad, campo, valor)
    await db.flush()
    return success_response({"id": str(especialidad.id), "nombre": especialidad.nombre})


@router.delete("/{especialidad_id}")
async def eliminar_especialidad(
    especialidad_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Elimina una especialidad por su ID"""
    result = await db.execute(
        select(Especialidad).where(Especialidad.id == especialidad_id)
    )
    especialidad = result.scalar_one_or_none()
    if not especialidad:
        return not_found_response("Especialidad")
    await db.delete(especialidad)
    await db.flush()
    return success_response(None, "Especialidad eliminada correctamente")