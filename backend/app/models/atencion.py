import uuid
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Atencion(Base):
    __tablename__ = "atenciones"

    # Identificador único generado automáticamente
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Médico que recibe la atención
    medico_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicos.id"), nullable=False
    )

    # Usuario de admisión que registró la atención
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )

    # Clínica donde ocurrió la atención (para queries rápidas del dashboard)
    clinica_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clinicas.id"), nullable=False
    )

    # Turno en que se registró la atención: mañana o tarde
    turno: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Fecha y hora exacta del registro, se guarda automáticamente
    registrado_en: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relaciones con médico y usuario
    medico: Mapped["Medico"] = relationship("Medico", back_populates="atenciones")
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="atenciones")