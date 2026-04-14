import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.auditoria import Auditoria
from app.models.usuario import Usuario
from app.utils.dependencies import require_rol

router = APIRouter(prefix="/auditoria", tags=["Auditoría"])


class AuditoriaResponse(BaseModel):
    id: uuid.UUID
    usuario_id: Optional[uuid.UUID]
    usuario_email: Optional[str]
    usuario_nombre: Optional[str]
    accion: str
    ip: Optional[str]
    fecha: datetime

    model_config = {"from_attributes": True}


class AuditoriaListResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    registros: list[AuditoriaResponse]


@router.get("/", response_model=AuditoriaListResponse)
async def listar_auditoria(
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=50, ge=1, le=200),
    fecha_desde: Optional[date] = Query(default=None),
    fecha_hasta: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin")),
):
    """Lista registros de auditoría con filtro de fechas — solo superadmin."""
    offset = (pagina - 1) * por_pagina

    filtros = []
    if fecha_desde:
        filtros.append(Auditoria.fecha >= datetime(fecha_desde.year, fecha_desde.month, fecha_desde.day, tzinfo=timezone.utc))
    if fecha_hasta:
        fin = datetime(fecha_hasta.year, fecha_hasta.month, fecha_hasta.day, tzinfo=timezone.utc) + timedelta(days=1)
        filtros.append(Auditoria.fecha < fin)

    condicion = and_(*filtros) if filtros else True

    total_result = await db.execute(select(func.count()).select_from(Auditoria).where(condicion))
    total = total_result.scalar_one()

    result = await db.execute(
        select(Auditoria).where(condicion).order_by(Auditoria.fecha.desc()).offset(offset).limit(por_pagina)
    )
    registros = result.scalars().all()

    return AuditoriaListResponse(
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        registros=registros,
    )
