from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings


# Motor asíncrono de conexión a PostgreSQL
# echo=True muestra las queries SQL en consola solo en desarrollo
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True if settings.ENVIRONMENT == "development" else False,
)

# Fábrica de sesiones asíncronas
# expire_on_commit=False evita que los objetos expiren al hacer commit
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Clase base de la que heredan todos los modelos SQLAlchemy
class Base(DeclarativeBase):
    pass


# Dependencia de FastAPI que abre y cierra la sesión de BD por cada request
# Hace commit automático si todo sale bien, rollback si hay error
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()