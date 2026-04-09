from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
from app.database import get_db
from app.schemas.control_medico import ControlMedicoCreate, ControlMedicoResponse
from app.models.control_medico import ControlMedico
from app.models.atencion import Atencion
from app.models.medico import Medico
from app.models.especialidad import Especialidad
from app.utils.dependencies import require_rol
from app.utils.responses import success_response
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/control-medico", tags=["Control Médico"])


@router.post("/", response_model=ControlMedicoResponse)
async def registrar_control(
    data: ControlMedicoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("coordinador", "superadmin"))
):
    """
    Registra un paciente en control médico.
    Solo coordinador y superadmin. Cuenta como atención en el dashboard.
    La fecha y turno los envía el cliente (timezone America/Lima).
    """
    fecha_registro = data.fecha or date.today()

    result = await db.execute(
        select(func.count(ControlMedico.id)).where(
            ControlMedico.clinica_id == current_user.clinica_id,
            ControlMedico.fecha == fecha_registro
        )
    )
    count_hoy = result.scalar_one()
    numero_orden = count_hoy + 1

    nuevo = ControlMedico(
        clinica_id=current_user.clinica_id,
        usuario_id=current_user.id,
        medico_id=data.medico_id,
        especialidad_id=data.especialidad_id,
        numero_orden=numero_orden,
        hcl=data.hcl,
        boleta=data.boleta,
        paciente_nombre=data.paciente_nombre,
        paciente_edad=data.paciente_edad,
        paciente_dni=data.paciente_dni,
        seguro=data.seguro,
        turno=data.turno,
        fecha=fecha_registro,
    )
    db.add(nuevo)

    # También cuenta como atención en el dashboard del director
    nueva_atencion = Atencion(
        medico_id=data.medico_id,
        usuario_id=current_user.id,
        clinica_id=current_user.clinica_id,
        turno=data.turno,
    )
    db.add(nueva_atencion)

    await db.flush()
    return nuevo


@router.get("/hoy")
async def obtener_control_hoy(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("coordinador", "superadmin"))
):
    """Retorna todos los registros de control médico del día actual"""
    result = await db.execute(
        select(ControlMedico)
        .where(
            ControlMedico.clinica_id == current_user.clinica_id,
            ControlMedico.fecha == date.today()
        )
        .order_by(ControlMedico.numero_orden)
    )
    registros = result.scalars().all()
    data = await _enriquecer(registros, db)
    return success_response(data)


@router.get("/mes")
async def obtener_control_mes(
    anio: int = Query(default=2026),
    mes: int = Query(default=4),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("coordinador", "superadmin"))
):
    """Retorna todos los registros de un mes — usado para exportar Excel"""
    result = await db.execute(
        select(ControlMedico)
        .where(
            ControlMedico.clinica_id == current_user.clinica_id,
            func.extract('year', ControlMedico.fecha) == anio,
            func.extract('month', ControlMedico.fecha) == mes
        )
        .order_by(ControlMedico.fecha, ControlMedico.numero_orden)
    )
    registros = result.scalars().all()
    data = await _enriquecer(registros, db)
    return success_response(data)


@router.delete("/{control_id}")
async def eliminar_control(
    control_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador"))
):
    """Elimina un registro de control médico"""
    result = await db.execute(select(ControlMedico).where(ControlMedico.id == control_id))
    registro = result.scalar_one_or_none()
    if not registro:
        from app.utils.responses import not_found_response
        return not_found_response("Registro de control médico")
    await db.delete(registro)
    await db.flush()
    return success_response(None, "Registro eliminado correctamente")


async def _enriquecer(registros, db):
    """Agrega nombre de médico y especialidad a cada registro"""
    data = []
    for r in registros:
        medico = None
        especialidad = None
        if r.medico_id:
            res_m = await db.execute(select(Medico).where(Medico.id == r.medico_id))
            medico = res_m.scalar_one_or_none()
        if r.especialidad_id:
            res_e = await db.execute(select(Especialidad).where(Especialidad.id == r.especialidad_id))
            especialidad = res_e.scalar_one_or_none()
        data.append({
            "id": str(r.id),
            "numero_orden": r.numero_orden,
            "hcl": r.hcl,
            "boleta": r.boleta,
            "paciente_nombre": r.paciente_nombre,
            "paciente_edad": r.paciente_edad,
            "paciente_dni": r.paciente_dni,
            "seguro": r.seguro,
            "medico_nombre": medico.nombre if medico else None,
            "medico_apellido": medico.apellido if medico else None,
            "especialidad_nombre": especialidad.nombre if especialidad else None,
            "turno": r.turno,
            "fecha": str(r.fecha),
            "registrado_en": str(r.registrado_en),
        })
    return data
