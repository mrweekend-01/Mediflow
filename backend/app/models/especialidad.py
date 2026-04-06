import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Especialidad(Base):
    __tablename__ = "especialidades"

    # Identificador único generado automáticamente
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Clínica a la que pertenece esta especialidad (multi-tenant)
    clinica_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clinicas.id"), nullable=False
    )

    # Nombre de la especialidad (ej. Traumatología, Fisioterapia)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relación con médicos que tienen esta especialidad
    medicos: Mapped[list] = relationship("Medico", back_populates="especialidad")