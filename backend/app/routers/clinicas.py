from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.clinica import Clinica
from app.schemas.clinica import ClinicaCreate, ClinicaUpdate, ClinicaResponse
from app.utils.dependencies import require_rol
from app.utils.responses import created_response, success_response, not_found_response
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/clinicas", tags=["Clínicas"])


@router.get("/", response_model=list[ClinicaResponse])
async def listar_clinicas(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin"))
):
    """Lista todas las clínicas — solo superadmin"""
    result = await db.execute(select(Clinica))
    return result.scalars().all()


@router.post("/")
async def crear_clinica(
    data: ClinicaCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin"))
):
    """Crea una nueva clínica — solo superadmin"""
    nueva = Clinica(nombre=data.nombre, ruc=data.ruc, direccion=data.direccion)
    db.add(nueva)
    await db.flush()
    return created_response({"id": str(nueva.id), "nombre": nueva.nombre})


@router.put("/{clinica_id}")
async def actualizar_clinica(
    clinica_id: uuid.UUID,
    data: ClinicaUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin"))
):
    """Actualiza los datos de una clínica — solo superadmin"""
    result = await db.execute(select(Clinica).where(Clinica.id == clinica_id))
    clinica = result.scalar_one_or_none()
    if not clinica:
        return not_found_response("Clínica")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(clinica, campo, valor)
    await db.flush()
    return success_response({"id": str(clinica.id), "nombre": clinica.nombre})