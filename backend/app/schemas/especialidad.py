from pydantic import BaseModel
from uuid import UUID


# Datos para crear una especialidad
class EspecialidadCreate(BaseModel):
    nombre: str
    clinica_id: UUID


# Datos para actualizar una especialidad
class EspecialidadUpdate(BaseModel):
    nombre: str | None = None


# Respuesta completa de una especialidad
class EspecialidadResponse(BaseModel):
    id: UUID
    clinica_id: UUID
    nombre: str

    model_config = {"from_attributes": True}