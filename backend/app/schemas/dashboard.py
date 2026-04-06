from pydantic import BaseModel


# Métricas generales para las tarjetas del dashboard
class MetricasGenerales(BaseModel):
    total_atenciones: int
    medicos_activos: int
    horas_registradas: float
    promedio_por_medico: float


# Atenciones agrupadas por médico
class AtencionPorMedico(BaseModel):
    medico_id: str
    nombre: str
    apellido: str
    especialidad: str | None
    total_atenciones: int


# Atenciones agrupadas por día
class AtencionPorDia(BaseModel):
    fecha: str
    total: int


# Respuesta completa del dashboard
class DashboardResponse(BaseModel):
    metricas: MetricasGenerales
    por_medico: list[AtencionPorMedico]
    por_dia: list[AtencionPorDia]