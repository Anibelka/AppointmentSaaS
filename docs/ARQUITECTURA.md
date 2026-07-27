# Arquitectura final de AppointmentSaaS

## Vista lógica

```text
[Cliente final]        [Empleado]        [Administrador]
       \                  |                   /
                    HTTPS / TLS
                         |
                 Frontend en Vercel
                         |
            Supabase JavaScript Client
                /                    \
       Supabase Auth          PostgREST / RPC
                                    |
                          PostgreSQL con RLS
                                    |
                         Supabase Edge Function
                                    |
                                 Resend
                                    |
                          Correo de confirmación
```

## Responsabilidades

### Frontend

- Presentación de portales.
- Navegación y formularios.
- Cálculo preliminar de horarios para mejorar la experiencia.
- Visualización de agenda y analítica.
- Invocación de funciones seguras.

### Supabase Auth

- Registro con correo y contraseña.
- Inicio y cierre de sesión.
- Sesión JWT.
- Metadatos iniciales del perfil.

### PostgreSQL

- Persistencia relacional.
- Integridad referencial.
- Prevención de solapamientos.
- Reglas críticas de horarios y cancelación.
- RLS por usuario, negocio y rol.

### Edge Function

- Verificación del JWT.
- Verificación del propietario o rol autorizado.
- Consulta segura de datos de la cita.
- Uso de la API privada de Resend.
- Registro del estado del correo.

### Vercel

- Publicación del frontend mediante HTTPS.
- Variables públicas de Supabase entregadas a través de `/api/config`.
- Despliegues Preview y Production.

## Separación implementado/propuesto

### Implementado cuando el modo cloud está activo

- Frontend HTML/CSS/JavaScript.
- Supabase Auth.
- PostgreSQL.
- RLS.
- RPC.
- Edge Function.
- Resend.
- Vercel.

### Evolución futura

- Backend FastAPI dedicado para integraciones complejas.
- Nginx y balanceo cuando la escala lo requiera.
- Pagos de suscripción.
- Recordatorios programados mediante cron/colas.
- Monitoreo y alertas centralizadas.
- Pruebas automatizadas en CI/CD.
