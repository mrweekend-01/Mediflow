from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# Datos para registrar una atención
class AtencionCreate(BaseModel):
    medico_id: UUID
    clinica_id: UUID
    turno: str | None = None


# Respuesta completa de una atención
class AtencionResponse(BaseModel):
    id: UUID
    medico_id: UUID
    usuario_id: UUID
    clinica_id: UUID
    turno: str | None
    registrado_en: datetime

    model_config = {"from_attributes": True}