# Plan de pruebas de aceptación

## Objetivo

Confirmar que AppointmentSaaS funciona de extremo a extremo y que cada rol solo realiza las acciones autorizadas.

## Casos funcionales

| ID | Caso | Resultado esperado |
|---|---|---|
| PF-01 | Registrar un cliente | La cuenta se crea y se solicita confirmación de correo cuando corresponda. |
| PF-02 | Iniciar sesión como cliente | El cliente accede únicamente a su portal. |
| PF-03 | Reservar en horario disponible | Se crea la cita, se genera un código y aparece la confirmación. |
| PF-04 | Reservar una hora pasada | El sistema rechaza la operación. |
| PF-05 | Reservar en día cerrado | No se muestran horarios y la RPC rechaza intentos manipulados. |
| PF-06 | Crear solapamiento | PostgreSQL rechaza la cita para el mismo profesional. |
| PF-07 | Consultar por código | Se muestran datos limitados de la cita. |
| PF-08 | Cancelar con más de 2 horas | La cita cambia a Cancelada. |
| PF-09 | Cancelar con menos de 2 horas | La operación se rechaza. |
| PF-10 | Correo de confirmación | El cliente recibe un correo con el código y detalles. |
| PF-11 | Administrador gestiona agenda | Puede consultar y actualizar todas las citas del negocio. |
| PF-12 | Empleado consulta agenda | Solo visualiza citas asignadas. |
| PF-13 | Empleado intenta abrir analítica | El módulo permanece restringido. |
| PF-14 | Administrador modifica horario | La disponibilidad pública cambia. |
| PF-15 | Administrador agrega cierre especial | La fecha queda bloqueada. |
| PF-16 | Datos compartidos | Una cita creada en un navegador aparece en otro. |

## Casos de seguridad

| ID | Caso | Resultado esperado |
|---|---|---|
| PS-01 | Cliente consulta tabla de otras citas | RLS impide obtener citas ajenas. |
| PS-02 | Empleado modifica cita no asignada | La función RPC rechaza la operación. |
| PS-03 | Cliente modifica directamente servicios | RLS bloquea la acción. |
| PS-04 | Usuario anónimo consulta bitácora | No recibe registros. |
| PS-05 | Llamar Edge Function sin JWT | Respuesta 401. |
| PS-06 | Enviar correo de una cita ajena | Respuesta 403. |
| PS-07 | Inspeccionar frontend | No aparecen service role key ni Resend API key. |

## Navegadores

- Google Chrome.
- Microsoft Edge.
- Firefox.
- Vista móvil en herramientas de desarrollo.

## Evidencias

Para cada caso crítico conserva captura, fecha, resultado y observación. Marca como bloqueante cualquier error en autenticación, reserva, persistencia, roles o correo.
