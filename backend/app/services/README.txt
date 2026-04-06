MÓDULO: services
================
Contiene la lógica de negocio separada de los endpoints.

Archivos:
- auth_service.py       → Lógica de autenticación y validación de usuarios
- medico_service.py     → Lógica de gestión de médicos y horarios
- atencion_service.py   → Lógica de registro y consulta de atenciones
- dashboard_service.py  → Lógica de cálculo de métricas para el dashboard

Los routers llaman a los servicios, los servicios llaman a los modelos.
Esto mantiene los endpoints limpios y la lógica reutilizable.