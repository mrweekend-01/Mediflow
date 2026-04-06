from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.atencion import Atencion
from app.models.medico import Medico
from app.models.especialidad import Especialidad
from app.models.horario import Horario
from app.schemas.dashboard import (
    DashboardResponse,
    MetricasGenerales,
    AtencionPorMedico,
    AtencionPorDia
)
from datetime import datetime, timedelta
import uuid


async def obtener_dashboard(
    clinica_id: uuid.UUID,
    db: AsyncSession,
    dias: int = 7
) -> DashboardResponse:
    """Calcula todas las métricas del dashboard para una clínica"""

    # Rango de fechas para el período solicitado
    fecha_fin = datetime.utcnow()
    fecha_inicio = fecha_fin - timedelta(days=dias)

    # --- Métricas generales ---

    # Total de atenciones en el período
    total_result = await db.execute(
        select(func.count(Atencion.id))
        .where(
            Atencion.clinica_id == clinica_id,
            Atencion.registrado_en >= fecha_inicio
        )
    )
    total_atenciones = total_result.scalar_one()

    # Médicos activos en la clínica
    medicos_result = await db.execute(
        select(func.count(Medico.id))
        .where(Medico.clinica_id == clinica_id, Medico.activo == True)
    )
    medicos_activos = medicos_result.scalar_one()

    # Horas registradas: suma de horas de horarios en el período
    horas_result = await db.execute(
        select(Horario)
        .join(Medico, Horario.medico_id == Medico.id)
        .where(Medico.clinica_id == clinica_id)
    )
    horarios = horas_result.scalars().all()

    # Calcula horas totales sumando diferencia entre hora_fin y hora_inicio
    horas_registradas = sum(
        (datetime.combine(datetime.today(), h.hora_fin) -
         datetime.combine(datetime.today(), h.hora_inicio)).seconds / 3600
        for h in horarios
    )

    # Promedio de atenciones por médico
    promedio = round(total_atenciones / medicos_activos, 1) if medicos_activos > 0 else 0

    metricas = MetricasGenerales(
        total_atenciones=total_atenciones,
        medicos_activos=medicos_activos,
        horas_registradas=round(horas_registradas, 1),
        promedio_por_medico=promedio
    )

    # --- Atenciones por médico ---
    por_medico_result = await db.execute(
        select(
            Medico.id,
            Medico.nombre,
            Medico.apellido,
            Especialidad.nombre.label("especialidad"),
            func.count(Atencion.id).label("total")
        )
        .join(Atencion, Atencion.medico_id == Medico.id)
        .outerjoin(Especialidad, Medico.especialidad_id == Especialidad.id)
        .where(
            Medico.clinica_id == clinica_id,
            Atencion.registrado_en >= fecha_inicio
        )
        .group_by(Medico.id, Medico.nombre, Medico.apellido, Especialidad.nombre)
        .order_by(func.count(Atencion.id).desc())
    )
    por_medico = [
        AtencionPorMedico(
            medico_id=str(row.id),
            nombre=row.nombre,
            apellido=row.apellido,
            especialidad=row.especialidad,
            total_atenciones=row.total
        )
        for row in por_medico_result.all()
    ]

    # --- Atenciones por día ---
    por_dia_result = await db.execute(
        select(
            func.date(Atencion.registrado_en).label("fecha"),
            func.count(Atencion.id).label("total")
        )
        .where(
            Atencion.clinica_id == clinica_id,
            Atencion.registrado_en >= fecha_inicio
        )
        .group_by(func.date(Atencion.registrado_en))
        .order_by(func.date(Atencion.registrado_en))
    )
    por_dia = [
        AtencionPorDia(
            fecha=str(row.fecha),
            total=row.total
        )
        for row in por_dia_result.all()
    ]

    return DashboardResponse(
        metricas=metricas,
        por_medico=por_medico,
        por_dia=por_dia
    )