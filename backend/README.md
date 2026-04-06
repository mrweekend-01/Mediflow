# MediFlow

Plataforma web SaaS para gestión de productividad médica en clínicas privadas.
Permite registrar atenciones en tiempo real, gestionar horarios médicos
y visualizar métricas de productividad desde un dashboard integrado.

## Tecnologías
- Backend: FastAPI + PostgreSQL + SQLAlchemy
- Autenticación: JWT con roles
- Frontend: React + Tailwind (próximamente)

## Estructura
- app/routers    → Endpoints de la API
- app/models     → Modelos de base de datos
- app/schemas    → Validación de datos con Pydantic
- app/core       → Configuración y seguridad
- app/services   → Lógica de negocio
- app/utils      → Utilidades compartidas

## Roles
- superadmin  → Gestión de clínicas
- coordinador → Gestión de médicos y horarios
- admision    → Registro de atenciones
- director    → Solo visualización del dashboard

## Instalación
1. Crear entorno virtual: python -m venv venv
2. Activar: venv\Scripts\activate
3. Instalar dependencias: pip install -r requirements.txt
4. Configurar .env con los datos de conexión
5. Ejecutar: uvicorn app.main:app --reload