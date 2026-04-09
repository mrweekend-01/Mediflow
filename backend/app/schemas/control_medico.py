from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime


class ControlMedicoCreate(BaseModel):
    medico_id: UUID
    especialidad_id: UUID | None = None
    hcl: str | None = None
    boleta: str | None = None
    paciente_nombre: str | None = None
    paciente_edad: str | None = None
    paciente_dni: str | None = None
    seguro: str | None = None
    turno: str | None = None   # enviado por el cliente
    fecha: date | None = None  # enviado por el cliente (America/Lima)


class ControlMedicoResponse(BaseModel):
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
