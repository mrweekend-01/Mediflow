from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.usuario import Usuario
from app.core.security import verify_password, create_access_token, hash_password
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.usuario import UsuarioCreate
from fastapi import HTTPException, status


async def login(data: LoginRequest, db: AsyncSession) -> TokenResponse:
    """Valida credenciales y retorna un token JWT si son correctas"""

    # Busca el usuario por email
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    usuario = result.scalar_one_or_none()

    # Verifica que exista, esté activo y el password sea correcto
    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )

    if not verify_password(data.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )

    # Genera el token JWT con el email y rol del usuario
    token = create_access_token(data={
        "sub": usuario.email,
        "rol": usuario.rol,
        "clinica_id": str(usuario.clinica_id)
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        rol=usuario.rol,
        nombre=usuario.nombre,
        clinica_id=str(usuario.clinica_id)
    )


async def crear_usuario(data: UsuarioCreate, db: AsyncSession) -> Usuario:
    """Crea un nuevo usuario con el password hasheado"""

    # Verifica que el email no esté en uso
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    existente = result.scalar_one_or_none()

    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Crea el usuario con el password encriptado
    nuevo_usuario = Usuario(
        clinica_id=data.clinica_id,
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol
    )

    db.add(nuevo_usuario)
    await db.flush()
    return nuevo_usuario