from pydantic import BaseModel


# Datos que el usuario envía para iniciar sesión
class LoginRequest(BaseModel):
    email: str
    password: str


# Respuesta al iniciar sesión exitosamente
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str
    clinica_id: str