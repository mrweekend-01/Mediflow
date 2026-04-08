import uuid
from sqlalchemy import String, Date, DateTime, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Triaje(Base):
    __tablename__ = "triaje"

    # Identificador único generado automáticamente
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Clínica a la que pertenece el registro
    clinica_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clinicas.id"), nullable=False
    )

    # Usuario que registró (chica de triaje)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )

    # Médico al que va el paciente
    medico_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicos.id"), nullable=True
    )

    # Especialidad del médico — se guarda separado para reportes
    especialidad_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("especialidades.id"), nullable=True
    )

    # Número de orden diario — reinicia cada día
    numero_orden: Mapped[int] = mapped_column(Integer, nullable=False)

    # Datos del paciente
    hcl: Mapped[str | None] = mapped_column(String(50), nullable=True)
    boleta: Mapped[str | None] = mapped_column(String(50), nullable=True)
    paciente_nombre: Mapped[str | None] = mapped_column(String(200), nullable=True)
    paciente_edad: Mapped[str | None] = mapped_column(String(10), nullable=True)
    paciente_dni: Mapped[str | None] = mapped_column(String(20), nullable=True)
    seguro: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Turno detectado automáticamente por hora del servidor
    turno: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Fecha del registro
    fecha: Mapped[str] = mapped_column(Date, nullable=False, server_default=func.current_date())

    # Fecha y hora exacta del registro
    registrado_en: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relaciones
    medico: Mapped["Medico"] = relationship("Medico")
    especialidad: Mapped["Especialidad"] = relationship("Especialidad")
    usuario: Mapped["Usuario"] = relationship("Usuario")