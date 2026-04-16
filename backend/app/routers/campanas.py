from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, timedelta
from collections import defaultdict
from app.database import get_db
from app.models.triaje import Triaje
from app.models.especialidad import Especialidad
from app.utils.dependencies import require_rol
from app.utils.responses import success_response
from app.models.usuario import Usuario

router = APIRouter(prefix="/campanas", tags=["Campanas"])

ROLES_CAMPANAS = ("marketing", "comercial", "superadmin", "director")


@router.get("/resumen")
async def resumen_campanas(
    fecha_inicio: date = Query(default=None),
    fecha_fin: date = Query(default=None),
    especialidad_id: str = Query(default=None),
    turno: str = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol(*ROLES_CAMPANAS))
):
    """
    Agrupa registros de triaje por campo campaña.
    Retorna: nombre campaña, total pacientes, desglose por especialidad, turno, día.
    """
    if not fecha_fin:
        fecha_fin = date.today()
    if not fecha_inicio:
        fecha_inicio = fecha_fin - timedelta(days=29)

    query = select(Triaje).where(
        Triaje.clinica_id == current_user.clinica_id,
        Triaje.fecha >= fecha_inicio,
        Triaje.fecha <= fecha_fin,
        Triaje.campana.isnot(None),
        Triaje.campana != ""
    )
    if especialidad_id:
        import uuid
        query = query.where(Triaje.especialidad_id == uuid.UUID(especialidad_id))
    if turno and turno != "todos":
        query = query.where(Triaje.turno == turno)

    result = await db.execute(query.order_by(Triaje.fecha))
    registros = result.scalars().all()

    res_esp = await db.execute(
        select(Especialidad).where(Especialidad.clinica_id == current_user.clinica_id)
    )
    especialidades = {str(e.id): e.nombre for e in res_esp.scalars().all()}

    total_global = len(registros)

    campanas = defaultdict(lambda: {
        "pacientes": 0,
        "especialidades": defaultdict(int),
        "turnos": defaultdict(int),
        "dias": defaultdict(int)
    })

    for r in registros:
        nombre = r.campana.strip()
        campanas[nombre]["pacientes"] += 1
        esp_nombre = especialidades.get(str(r.especialidad_id), "Sin especialidad") if r.especialidad_id else "Sin especialidad"
        campanas[nombre]["especialidades"][esp_nombre] += 1
        t = r.turno or "sin turno"
        campanas[nombre]["turnos"][t] += 1
        campanas[nombre]["dias"][str(r.fecha)] += 1

    data = []
    for nombre, info in sorted(campanas.items(), key=lambda x: -x[1]["pacientes"]):
        pacientes = info["pacientes"]
        pct = round(pacientes / total_global * 100, 1) if total_global > 0 else 0
        esp_principal = max(info["especialidades"].items(), key=lambda x: x[1])[0] if info["especialidades"] else "—"
        turno_principal = max(info["turnos"].items(), key=lambda x: x[1])[0] if info["turnos"] else "—"
        data.append({
            "campana": nombre,
            "pacientes": pacientes,
            "porcentaje": pct,
            "especialidad_principal": esp_principal,
            "turno_principal": turno_principal,
            "especialidades": dict(info["especialidades"]),
            "turnos": dict(info["turnos"]),
            "dias": dict(info["dias"])
        })

    return success_response({
        "total_pacientes": total_global,
        "total_campanas": len(campanas),
        "promedio_por_campana": round(total_global / len(campanas), 1) if campanas else 0,
        "campana_mas_activa": data[0]["campana"] if data else None,
        "campanas": data
    })


@router.get("/tendencia")
async def tendencia_campanas(
    fecha_inicio: date = Query(default=None),
    fecha_fin: date = Query(default=None),
    especialidad_id: str = Query(default=None),
    turno: str = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol(*ROLES_CAMPANAS))
):
    """
    Agrupa por campaña y fecha para líneas de tendencia diaria.
    """
    if not fecha_fin:
        fecha_fin = date.today()
    if not fecha_inicio:
        fecha_inicio = fecha_fin - timedelta(days=29)

    query = select(Triaje).where(
        Triaje.clinica_id == current_user.clinica_id,
        Triaje.fecha >= fecha_inicio,
        Triaje.fecha <= fecha_fin,
        Triaje.campana.isnot(None),
        Triaje.campana != ""
    )
    if especialidad_id:
        import uuid
        query = query.where(Triaje.especialidad_id == uuid.UUID(especialidad_id))
    if turno and turno != "todos":
        query = query.where(Triaje.turno == turno)

    result = await db.execute(query.order_by(Triaje.fecha))
    registros = result.scalars().all()

    por_fecha = defaultdict(lambda: defaultdict(int))
    campanas_set = set()

    for r in registros:
        nombre = r.campana.strip()
        dia = str(r.fecha)
        por_fecha[dia][nombre] += 1
        campanas_set.add(nombre)

    serie = []
    current = fecha_inicio
    while current <= fecha_fin:
        dia_str = str(current)
        entry = {"fecha": dia_str}
        for campana in sorted(campanas_set):
            entry[campana] = por_fecha[dia_str].get(campana, 0)
        serie.append(entry)
        current += timedelta(days=1)

    return success_response({
        "campanas": sorted(list(campanas_set)),
        "serie": serie
    })
