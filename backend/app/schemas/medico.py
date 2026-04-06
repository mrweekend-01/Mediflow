from pydantic import BaseModel
from uuid import UUID


# Datos para crear un médico
class MedicoCreate(BaseModel):
    nombre: str
    apellido: str
    clinica_id: UUID
    especialidad_id: UUID | None = None
    codigo: str | None = None


# Datos para actualizar un médico
class MedicoUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    especialidad_id: UUID | None = None
    codigo: str | None = None
    activo: bool | None = None


# Respuesta completa de un médico
class MedicoResponse(BaseModel):
    id: UUID
    clinica_id: UUID
    especialidad_id: UUID | None
    nombre: str
    apellido: str
    codigo: str | None
    activo: bool

    model_config = {"from_attributes": True}