# Exporta todos los servicios para importarlos fácilmente
from app.services.auth_service import login, crear_usuario
from app.services.medico_service import (
    obtener_medicos, obtener_medico, crear_medico,
    actualizar_medico, eliminar_medico,
    obtener_horarios, crear_horario,
    actualizar_horario, eliminar_horario
)
from app.services.atencion_service import (
    registrar_atencion, obtener_atenciones_por_medico,
    obtener_atenciones_por_clinica, eliminar_atencion
)
from app.services.dashboard_service import obtener_dashboard