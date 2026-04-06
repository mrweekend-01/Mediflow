from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


# Datos para crear un usuario
class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: str
    clinica_id: UUID


# Datos para actualizar un usuario
class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    email: EmailStr | None = None
    rol: str | None = None
    activo: bool | None = None


# Respuesta completa de un usuario (sin password)
class UsuarioResponse(BaseModel):
    id: UUID
    clinica_id: UUID
    nombre: str
    email: str
    rol: str
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}