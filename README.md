# AppointmentSaaS

**Gestión inteligente de citas y analítica para negocios de servicios**

AppointmentSaaS es una solución SaaS B2B orientada a micro-PYMES dominicanas del sector servicios, como barberías, salones de belleza, spas y centros de estética. Digitaliza la agenda, aplica reglas de disponibilidad, permite reservas de clientes y convierte las citas en indicadores para apoyar decisiones del negocio.

## Estado de esta entrega

El repositorio contiene dos modos:

- **Modo cloud:** Supabase Auth + PostgreSQL + Row Level Security + Supabase Edge Function + Resend.
- **Modo local de respaldo:** `localStorage`, utilizado únicamente cuando las variables de Supabase todavía no están configuradas.

La aplicación muestra en el pie de página cuál modo está activo. Para presentar PostgreSQL y autenticación como tecnologías implementadas, la URL final debe indicar **“Supabase PostgreSQL conectado”**.

## Funcionalidades

### Portal del cliente

- Registro e inicio de sesión.
- Catálogo público de servicios y profesionales.
- Reserva basada en horario real de `America/Santo_Domingo`.
- Horarios distintos por día y cierres especiales.
- Prevención de fechas y horas pasadas.
- Prevención de solapamientos para el mismo profesional.
- Código de confirmación único.
- Consulta de citas.
- Portal de próximas citas e historial.
- Cancelación hasta dos horas antes.
- Descarga de comprobante y archivo de calendario `.ics`.
- Correo transaccional mediante Supabase Edge Function y Resend.

### Administrador

- Dashboard con citas, ingresos, clientes y recordatorios.
- Gestión de citas, clientes, servicios y profesionales.
- Configuración del horario semanal y cierres especiales.
- Plan Básico y Plan Pro.
- Analítica de horas pico, rentabilidad, retención y no-shows.
- Bitácora de actividad.
- Configuración pública del negocio.

### Empleado

- Acceso limitado a las citas asignadas.
- Confirmación, finalización, cancelación y estado “No asistió”.
- Consulta de clientes asociados.
- Restricción de analítica, suscripciones y configuración.

## Tecnologías implementadas

- HTML5, CSS3 y JavaScript.
- Supabase JavaScript Client.
- Supabase Auth.
- PostgreSQL.
- Row Level Security (RLS).
- Funciones PostgreSQL RPC para reglas críticas.
- Supabase Edge Functions.
- Resend para correo transaccional.
- Vercel para publicación del frontend y configuración pública.

## Arquitectura

```text
Cliente / Administrador / Empleado
                |
             HTTPS
                |
       Frontend estático en Vercel
                |
       Supabase Auth + PostgREST/RPC
                |
        PostgreSQL con políticas RLS
                |
     Edge Function de correo -> Resend
```

## Credenciales de demostración

Se crean mediante `scripts/create-demo-users.mjs`:

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `demo@appointmentsaas.com` | `Demo123!` |
| Empleado | `empleado@appointmentsaas.com` | `Empleado123!` |
| Cliente | `cliente@appointmentsaas.com` | `Cliente123!` |

## Activación rápida

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/migrations/001_schema_rls_seed.sql` en el SQL Editor.
3. Copia `.env.example` como `.env` y completa las variables.
4. Ejecuta:

```bash
npm install
npm run create-demo-users
```

5. Despliega `supabase/functions/send-appointment-email` y configura los secretos de Resend.
6. En Vercel agrega `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_BUSINESS_SLUG`.
7. Vuelve a desplegar el proyecto.
8. Prueba en una ventana de incógnito los tres perfiles y el correo.

Consulta la guía completa en [`docs/GUIA_CONFIGURACION_SUPABASE_RESEND_VERCEL.md`](docs/GUIA_CONFIGURACION_SUPABASE_RESEND_VERCEL.md).

## Estructura

```text
AppointmentSaaS/
├── index.html
├── styles.css
├── app.js
├── cloud.js
├── api/config.js
├── vercel.json
├── package.json
├── supabase/
│   ├── migrations/
│   └── functions/send-appointment-email/
├── scripts/create-demo-users.mjs
├── docs/
└── capturas/
```

## Limitación del modo local

Cuando Supabase no está configurado, los datos se guardan solamente en el navegador. Ese modo sirve para revisar la interfaz, pero no debe presentarse como una implementación de base de datos compartida.

## Equipo

- Edwin Fang
- Alisha Núñez
- Anibelka Santana

Proyecto Integrador II - UNIBE, 2026.


## Clientes registrados y clientes nuevos

En **Agenda → Nueva cita** y **Registrar historial**, el administrador puede:

- Elegir un cliente ya guardado en el CRM.
- Crear un cliente nuevo sin salir del formulario.
- Vincular automáticamente una cita con la cuenta del cliente cuando el correo coincide con Supabase Auth.

Para una base existente ejecuta:

```text
supabase/migrations/004_client_directory.sql
```


## Teléfonos y duplicados

Los teléfonos se muestran en formato `809-555-1234`. El directorio compara los números sin guiones, por lo que `8293698852` y `829-369-8852` corresponden al mismo cliente.

En una base existente ejecuta:

```text
supabase/migrations/005_phone_normalization_and_client_dedup.sql
```


## Continuidad de la reserva después de iniciar sesión

Cuando un visitante selecciona servicio, profesional, fecha y hora y luego se le solicita autenticarse, AppointmentSaaS conserva temporalmente la reserva en `sessionStorage`.

Después de iniciar sesión o crear una cuenta:

1. Se recupera la selección.
2. Se vuelve al resumen de la reserva.
3. Se confirma automáticamente.
4. La reserva temporal se elimina solo después de que PostgreSQL responde correctamente.

La reserva pendiente expira después de 30 minutos.
