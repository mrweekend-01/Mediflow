from pydantic import BaseModel
from uuid import UUID
from datetime import time, date


# Datos para crear un horario
class HorarioCreate(BaseModel):
    medico_id: UUID
    dia_semana: str | None = None
    turno: str | None = None
    hora_inicio: time
    hora_fin: time
    fecha: date | None = None


# Datos para actualizar un horario
class HorarioUpdate(BaseModel):
    dia_semana: str | None = None
    turno: str | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None
    fecha: date | None = None


# Respuesta completa de un horario
class HorarioResponse(BaseModel):
    id: UUID
    medico_id: UUID
    dia_semana: str | None
    turno: str | None
    hora_inicio: time
    hora_fin: time
    fecha: date | None

    model_config = {"from_attributes": True}