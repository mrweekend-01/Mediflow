from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import Optional


# Schema para registrar un paciente en triaje
class TriajeCreate(BaseModel):
    medico_id: UUID
    especialidad_id: UUID
    hcl: str | None = None
    boleta: str | None = None
    paciente_nombre: str | None = None
    paciente_edad: str | None = None
    paciente_dni: str | None = None
    seguro: str | None = None


# Respuesta completa de un registro de triaje
class TriajeResponse(BaseModel):
    id: UUID
    clinica_id: UUID
    usuario_id: UUID
    medico_id: UUID | None
    especialidad_id: UUID | None
    numero_orden: int
    hcl: str | None
    boleta: str | None
    paciente_nombre: str | None
    paciente_edad: str | None
    paciente_dni: str | None
    seguro: str | None
    turno: str | None
    fecha: date
    registrado_en: datetime

    model_config = {"from_attributes": True}


# Respuesta con nombre de médico y especialidad incluidos
class TriajeDetalleResponse(BaseModel):
    id: UUID
    numero_orden: int
    hcl: str | None
    boleta: str | None
    paciente_nombre: str | None
    paciente_edad: str | None
    paciente_dni: str | None
    seguro: str | None
    medico_nombre: str | None
    medico_apellido: str | None
    especialidad_nombre: str | None
    turno: str | None
    fecha: date
    registrado_en: datetime

    model_config = {"from_attributes": True}