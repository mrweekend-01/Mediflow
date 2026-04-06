import uuid
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    # Identificador único generado automáticamente
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Clínica a la que pertenece el usuario (multi-tenant)
    clinica_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clinicas.id"), nullable=False
    )

    # Datos del usuario
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # Contraseña almacenada como hash, nunca en texto plano
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Rol que define los permisos: superadmin, coordinador, admision, director
    rol: Mapped[str] = mapped_column(String(20), nullable=False)

    # Si está False el usuario no puede iniciar sesión
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Fecha de creación automática
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relación con atenciones registradas por este usuario
    atenciones: Mapped[list] = relationship("Atencion", back_populates="usuario")