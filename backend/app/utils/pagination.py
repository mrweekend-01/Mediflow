from pydantic import BaseModel
from typing import TypeVar, Generic, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func


T = TypeVar("T")


class PaginationParams(BaseModel):
    """Parámetros de paginación que llegan como query params en los endpoints"""
    page: int = 1
    page_size: int = 20


class PaginatedResponse(BaseModel, Generic[T]):
    """Respuesta paginada genérica reutilizable en cualquier listado"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


async def paginate(
    db: AsyncSession,
    query,
    page: int = 1,
    page_size: int = 20
) -> dict:
    """
    Ejecuta una query con paginación.
    Retorna los items de la página solicitada y el total de registros.
    """

    # Cuenta el total de registros sin paginar
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Aplica offset y limit para traer solo la página solicitada
    offset = (page - 1) * page_size
    paginated_query = query.offset(offset).limit(page_size)
    result = await db.execute(paginated_query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }