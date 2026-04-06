MÓDULO: routers
===============
Contiene todos los endpoints de la API organizados por recurso.

Archivos:
- auth.py        → Login, logout, refresh token
- clinicas.py    → CRUD de clínicas (solo superadmin)
- usuarios.py    → CRUD de usuarios por clínica
- medicos.py     → CRUD de médicos por clínica
- especialidades.py → CRUD de especialidades
- horarios.py    → Registro y consulta de horarios médicos
- atenciones.py  → Registro en tiempo real de atenciones
- dashboard.py   → Endpoints de métricas y gráficos

Cada router se registra en app/main.py con su prefijo correspondiente.