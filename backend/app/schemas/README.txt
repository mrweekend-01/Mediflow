MÓDULO: schemas
===============
Contiene los esquemas Pydantic para validación de datos de entrada y salida.

Archivos:
- clinica.py        → Schemas de clínica (Create, Update, Response)
- usuario.py        → Schemas de usuario (Create, Update, Response)
- especialidad.py   → Schemas de especialidad
- medico.py         → Schemas de médico
- horario.py        → Schemas de horario médico
- atencion.py       → Schemas de atención
- dashboard.py      → Schemas de respuesta para métricas y gráficos
- auth.py           → Schemas de login y token JWT

Separar schemas de modelos permite controlar qué datos se exponen en la API.