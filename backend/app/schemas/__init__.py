# Exporta todos los schemas para importarlos fácilmente desde otros módulos
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.clinica import ClinicaCreate, ClinicaUpdate, ClinicaResponse
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse
from app.schemas.especialidad import EspecialidadCreate, EspecialidadUpdate, EspecialidadResponse
from app.schemas.medico import MedicoCreate, MedicoUpdate, MedicoResponse
from app.schemas.horario import HorarioCreate, HorarioUpdate, HorarioResponse
from app.schemas.atencion import AtencionCreate, AtencionResponse
from app.schemas.dashboard import DashboardResponse, MetricasGenerales, AtencionPorMedico, AtencionPorDia