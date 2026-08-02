# Continuidad de la reserva durante la autenticación

## Problema corregido

Antes, cuando un visitante pulsaba **Confirmar cita** sin una cuenta activa, se abría el modal de autenticación. Después del inicio de sesión, la aplicación enviaba al usuario a su portal personal y no retomaba la reserva.

## Comportamiento actual

- La selección se conserva temporalmente en `sessionStorage`.
- El inicio de sesión no reinicia el formulario.
- La aplicación vuelve al resumen de la cita.
- La confirmación se ejecuta automáticamente.
- PostgreSQL vuelve a validar disponibilidad, horario y solapamientos.
- Si el horario fue ocupado durante el proceso, se muestra el error y la cita no se duplica.
- La información temporal expira a los 30 minutos.
