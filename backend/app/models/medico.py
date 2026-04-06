import uuid
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Medico(Base):
    __tablename__ = "medicos"

    # Identificador único generado automáticamente
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Clínica a la que pertenece el médico (multi-tenant)
    clinica_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clinicas.id"), nullable=False
    )

    # Especialidad del médico (opcional)
    especialidad_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("especialidades.id"), nullable=True
    )

    # Datos personales del médico
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)

    # Código interno para cruzar con BD existente de la clínica
    codigo: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Si está False el médico no aparece en los listados activos
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relaciones con otras tablas
    especialidad: Mapped["Especialidad"] = relationship("Especialidad", back_populates="medicos")
    horarios: Mapped[list] = relationship("Horario", back_populates="medico")
    atenciones: Mapped[list] = relationship("Atencion", back_populates="medico")