from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# Datos para crear una clínica
class ClinicaCreate(BaseModel):
    nombre: str
    ruc: str | None = None
    direccion: str | None = None


# Datos para actualizar una clínica
class ClinicaUpdate(BaseModel):
    nombre: str | None = None
    ruc: str | None = None
    direccion: str | None = None


# Respuesta completa de una clínica
class ClinicaResponse(BaseModel):
    id: UUID
    nombre: str
    ruc: str | None
    direccion: str | None
    created_at: datetime

    # Permite que Pydantic lea objetos SQLAlchemy directamente
    model_config = {"from_attributes": True}