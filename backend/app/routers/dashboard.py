from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import obtener_dashboard
from app.utils.dependencies import require_rol
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/{clinica_id}", response_model=DashboardResponse)
async def endpoint_dashboard(
    clinica_id: uuid.UUID,
    dias: int = Query(default=7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("director", "coordinador", "superadmin"))
):
    """
    Retorna todas las métricas del dashboard para una clínica.
    El parámetro dias define el período (por defecto 7 días, máximo 90).
    Solo director, coordinador y superadmin pueden acceder.
    """
    return await obtener_dashboard(clinica_id, db, dias)