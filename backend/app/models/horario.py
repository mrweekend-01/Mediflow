import uuid
from sqlalchemy import String, Time, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Horario(Base):
    __tablename__ = "medico_horario"

    # Identificador único generado automáticamente
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Médico al que pertenece este horario
    medico_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicos.id"), nullable=False
    )

    # Día de la semana programado (lunes, martes, etc.)
    dia_semana: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Turno: mañana o tarde
    turno: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Hora de inicio y fin del horario programado
    hora_inicio: Mapped[str] = mapped_column(Time, nullable=False)
    hora_fin: Mapped[str] = mapped_column(Time, nullable=False)

    # Fecha específica (opcional, para horarios puntuales)
    fecha: Mapped[str | None] = mapped_column(Date, nullable=True)

    # Relación con el médico
    medico: Mapped["Medico"] = relationship("Medico", back_populates="horarios")