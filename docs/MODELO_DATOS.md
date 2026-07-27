# Modelo de datos relacional

## Entidades

### businesses

Representa cada empresa suscrita. Conserva nombre, dirección, teléfono, zona horaria, plan y preferencias de recordatorios.

### profiles

Extiende `auth.users` con nombre, teléfono, rol, negocio y profesional relacionado.

### services

Catálogo de servicios, precio, duración y estado.

### staff

Profesionales del negocio. Puede vincularse con una cuenta autenticada.

### business_hours

Horario por cada día de la semana. Permite diferencias entre lunes-viernes, sábado y domingo.

### business_closures

Excepciones por fecha: feriados, mantenimiento, vacaciones o cierres especiales.

### appointments

Citas con cliente, servicio, profesional, inicio, fin, estado, código, recordatorio y correo.

### audit_logs

Eventos relevantes para trazabilidad.

## Relaciones principales

```text
businesses 1 --- N services
businesses 1 --- N staff
businesses 1 --- 7 business_hours
businesses 1 --- N business_closures
businesses 1 --- N appointments
businesses 1 --- N audit_logs
profiles   1 --- 0..1 staff
profiles   1 --- N appointments (como cliente)
services   1 --- N appointments
staff      1 --- N appointments
```

## Reglas de integridad

- Un servicio y un profesional deben pertenecer al mismo negocio que la cita.
- Una cita no puede iniciar en el pasado.
- El día debe estar abierto y no ser un cierre especial.
- La duración debe caber antes del cierre.
- Dos citas activas no pueden solaparse para el mismo profesional.
- Un cliente solo consulta sus citas.
- Un empleado solo consulta y modifica las citas asignadas.
- El administrador opera únicamente sobre su negocio.
