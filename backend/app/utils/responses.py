from typing import Any
from fastapi.responses import JSONResponse


def success_response(data: Any, message: str = "Operación exitosa", status_code: int = 200):
    """Formato estándar para respuestas exitosas"""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data
        }
    )


def error_response(message: str, status_code: int = 400, details: Any = None):
    """Formato estándar para respuestas de error"""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "details": details
        }
    )


def created_response(data: Any, message: str = "Creado exitosamente"):
    """Formato estándar para recursos creados (201)"""
    return success_response(data=data, message=message, status_code=201)


def not_found_response(resource: str = "Recurso"):
    """Formato estándar para recursos no encontrados (404)"""
    return error_response(
        message=f"{resource} no encontrado",
        status_code=404
    )