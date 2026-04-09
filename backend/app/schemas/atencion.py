from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# Schema para admisión — sin fecha manual, se genera automáticamente
class AtencionCreate(BaseModel):
    medico_id: UUID
    clinica_id: UUID
    turno: str | None = None


# Schema para registro histórico — con fecha manual y cantidad
class AtencionHistoricaCreate(BaseModel):
    medico_id: UUID
    clinica_id: UUID
    turno: str
    fecha: str
    cantidad: int


# Schema para ajustar cantidad de atenciones históricas existentes
class AtencionHistoricaAjuste(BaseModel):
    medico_id: UUID
    clinica_id: UUID
    turno: str
    fecha: str          # "YYYY-MM-DD"
    nueva_cantidad: int


# Respuesta completa de una atención
class AtencionResponse(BaseModel):
    id: UUID
    medico_id: UUID
    usuario_id: UUID
    clinica_id: UUID
    turno: str | None
    registrado_en: datetime

    model_config = {"from_attributes": True}