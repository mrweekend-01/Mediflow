from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from app.database import get_db
from app.schemas.triaje import TriajeCreate, TriajeResponse
from app.models.triaje import Triaje
from app.models.atencion import Atencion
from app.models.medico import Medico
from app.models.especialidad import Especialidad
from app.utils.dependencies import require_rol, get_current_user
from app.utils.responses import success_response
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/triaje", tags=["Triaje"])


@router.post("/", response_model=TriajeResponse)
async def registrar_triaje(
    data: TriajeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_rol("admision", "coordinador", "superadmin"))
):
    """
    Registra un paciente en triaje en tiempo real.
    También inserta en atenciones para alimentar el dashboard del director.
    """
    # Usa los valores enviados por el cliente (timezone America/Lima)
    turno = data.turno or ("mañana" if datetime.now().hour < 13 else "tarde")
    fecha_hoy = data.fecha or date.today()

    # Calcula número de orden del día
    result = await db.execute(
        select(func.count(Triaje.id)).where(
            Triaje.clinica_id == current_user.clinica_id,
            Triaje.fecha == fecha_hoy
        )
    )
    count_hoy = result.scalar_one()
    numero_orden = count_hoy + 1

    # Inserta en triaje con detalle completo del paciente
    nuevo_triaje = Triaje(
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
        turno=turno,
        fecha=fecha_hoy,
        campana=data.campana,
    )
    db.add(nuevo_triaje)

    # También inserta en atenciones para el dashboard del director
    nueva_atencion = Atencion(
        medico_id=data.medico_id,
        usuario_id=current_user.id,
        clinica_id=current_user.clinica_id,
        turno=turno,
    )
    db.add(nueva_atencion)

    await db.flush()
    return nuevo_triaje


@router.get("/hoy")
async def obtener_triaje_hoy(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Retorna todos los registros de triaje del día actual"""
    result = await db.execute(
        select(Triaje)
        .where(
            Triaje.clinica_id == current_user.clinica_id,
            Triaje.fecha == date.today()
        )
        .order_by(Triaje.numero_orden)
    )
    registros = result.scalars().all()

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
            "campana": r.campana,
            "fecha": str(r.fecha),
            "registrado_en": str(r.registrado_en),
        })

    return success_response(data)


@router.get("/mes")
async def obtener_triaje_mes(
    anio: int = Query(default=2026),
    mes: int = Query(default=4),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Retorna todos los registros de triaje de un mes específico"""
    result = await db.execute(
        select(Triaje)
        .where(
            Triaje.clinica_id == current_user.clinica_id,
            func.extract('year', Triaje.fecha) == anio,
            func.extract('month', Triaje.fecha) == mes
        )
        .order_by(Triaje.fecha, Triaje.numero_orden)
    )
    registros = result.scalars().all()

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
            "campana": r.campana,
            "fecha": str(r.fecha),
            "registrado_en": str(r.registrado_en),
        })

    return success_response(data)


@router.delete("/{triaje_id}")
async def eliminar_triaje(
    triaje_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_rol("superadmin", "coordinador", "admision"))
):
    """Elimina un registro de triaje — solo para correcciones"""
    result = await db.execute(select(Triaje).where(Triaje.id == triaje_id))
    registro = result.scalar_one_or_none()
    if not registro:
        from app.utils.responses import not_found_response
        return not_found_response("Registro de triaje")
    await db.delete(registro)
    await db.flush()
    return success_response(None, "Registro eliminado correctamente")