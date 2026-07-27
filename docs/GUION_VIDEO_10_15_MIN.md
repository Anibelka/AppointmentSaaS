# Guion de apoyo para el video individual

No debe leerse palabra por palabra. Utilízalo para practicar el orden y los conceptos.

## 0:00-0:45 - Presentación

“Hola, mi nombre es Anibelka Santana, pertenezco al grupo `[GRUPO]` y presentaré AppointmentSaaS: Gestión Inteligente y Analítica para Negocios de Servicios. Dentro del equipo mi rol se concentró en `[APORTE REAL]`.”

## 0:45-2:30 - Problema, cliente y modelo

- Gestión informal mediante libretas, llamadas y WhatsApp.
- Inasistencias, conflictos de horario, trabajo administrativo y falta de datos.
- Cliente principal: dueño o administrador.
- Usuarios: empleado y cliente final.
- Modelo SaaS B2B con Plan Básico y Plan Pro.
- Aclarar que las cifras de reducción de inasistencia son estimaciones de la propuesta académica, no resultados de producción.

## 2:30-6:30 - Demostración funcional

1. Mostrar que el sistema está conectado a Supabase.
2. Entrar como cliente.
3. Seleccionar servicio y profesional.
4. Explicar que los horarios se calculan en America/Santo_Domingo.
5. Enseñar que un día cerrado no ofrece horas.
6. Reservar una cita.
7. Mostrar código y correo recibido.
8. Entrar como administrador.
9. Mostrar la misma cita en la agenda compartida.
10. Cambiar el estado.
11. Mostrar clientes y analítica.
12. Entrar como empleado y demostrar permisos limitados.

## 6:30-9:30 - Tecnologías

- HTML y CSS: interfaz accesible y responsiva.
- JavaScript: flujo de interacción y reglas de experiencia.
- Supabase Auth: registro, sesiones y recuperación de acceso.
- PostgreSQL: persistencia compartida y modelo relacional.
- RLS: autorización directamente en la base de datos.
- RPC PostgreSQL: valida reserva, horarios, solapamientos y cancelaciones.
- Edge Function: procesa correo sin exponer la clave de Resend.
- Resend: correo transaccional.
- Vercel: hosting HTTPS y despliegues.

## 9:30-12:30 - Conocimientos integrados

- Ingeniería de Software: requerimientos, MVP y modularidad.
- Análisis y Diseño: usuarios, stakeholders, flujos y reglas.
- Bases de Datos: entidades, relaciones, restricciones y consultas.
- Redes: HTTPS, frontend cloud, API y servicio externo.
- Seguridad: Auth, RLS, roles, secretos y mínimo privilegio.
- Calidad: casos de prueba y validaciones de negocio.
- Gestión: Kanban, división de tareas y documentación.
- Arquitectura: separación frontend, datos y función de correo.
- IA: apoyo en redacción, validación y refinamiento, manteniendo la comprensión individual.

## 12:30-13:45 - Reflexión

“Lo más importante que aprendí fue que un sistema profesional no se limita a crear pantallas; también necesita reglas, persistencia, seguridad, pruebas y una explicación clara del valor para el cliente.”

“Con más tiempo incorporaría pagos, recordatorios programados, pruebas automatizadas y un piloto con negocios reales.”

“Sí me sentiría preparada para presentarlo a un cliente como un MVP funcional, explicando con transparencia su alcance actual y el plan para evolucionarlo.”
