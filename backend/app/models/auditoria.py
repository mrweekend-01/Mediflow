import uuid
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Auditoria(Base):
    __tablename__ = "auditoria"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    usuario_email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    usuario_nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    accion: Mapped[str] = mapped_column(String(200), nullable=False)
    ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fecha: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
