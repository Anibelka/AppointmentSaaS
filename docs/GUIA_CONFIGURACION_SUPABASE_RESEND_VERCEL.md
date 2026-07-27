# Guía de configuración: Supabase, Resend y Vercel

Esta guía activa PostgreSQL real, autenticación compartida y envío de correos. Hasta completar estos pasos, la aplicación abre en modo local de respaldo.

## 1. Crear el proyecto de Supabase

1. Crea un proyecto nuevo en Supabase.
2. Conserva de forma segura la contraseña de PostgreSQL.
3. En **Project Settings > API**, localiza:
   - Project URL.
   - Publishable key o anon key.
   - Service role key.
4. La service role key no debe colocarse en el frontend, GitHub ni Vercel como variable pública.

## 2. Crear la base de datos

1. En Supabase abre **SQL Editor**.
2. Copia y ejecuta el contenido de:

```text
supabase/migrations/001_schema_rls_seed.sql
```

El script crea:

- Negocios.
- Perfiles y roles.
- Servicios.
- Profesionales.
- Horarios semanales.
- Cierres especiales.
- Citas.
- Bitácora.
- Políticas RLS.
- Funciones RPC para reservar, cancelar y cambiar estados.
- Restricción PostgreSQL contra solapamientos.
- Datos iniciales de Barbería Caribe.

## 3. Crear los usuarios de demostración

En una terminal dentro del repositorio:

```bash
npm install
```

Crea un archivo `.env` a partir de `.env.example` y completa:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Después ejecuta:

```bash
npm run create-demo-users
```

El script crea o actualiza:

- Administrador.
- Empleado asignado a Carlos.
- Cliente.
- Algunas citas de demostración.

La service role key se utiliza exclusivamente desde el script administrativo local.

## 4. Probar autenticación

Antes de desplegar:

1. Revisa **Authentication > Users**.
2. Confirma que aparecen los tres usuarios.
3. Revisa la tabla `profiles`.
4. Verifica los roles:
   - `admin`
   - `employee`
   - `client`
5. Verifica que el empleado tenga `staff_id = 1`.

## 5. Configurar Resend

1. Crea una cuenta en Resend.
2. Para enviar a cualquier destinatario, agrega y verifica un dominio propio.
3. Crea una API key.
4. Define un remitente del dominio verificado, por ejemplo:

```text
AppointmentSaaS <citas@tudominio.com>
```

Durante pruebas con `onboarding@resend.dev`, el proveedor normalmente limita el destinatario al correo de la cuenta de Resend.

## 6. Desplegar la Supabase Edge Function

Instala o utiliza Supabase CLI y vincula el proyecto:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
```

Configura secretos:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxx
npx supabase secrets set RESEND_FROM="AppointmentSaaS <citas@tudominio.com>"
npx supabase secrets set PUBLIC_SITE_URL=https://tu-proyecto.vercel.app
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

Despliega:

```bash
npx supabase functions deploy send-appointment-email
```

La función exige JWT válido y verifica que quien solicita el correo sea:

- El cliente propietario de la cita.
- Un administrador del negocio.
- El empleado asignado.

## 7. Configurar Vercel

Importa el repositorio desde GitHub. En el proyecto de Vercel abre:

```text
Settings > Environment Variables
```

Agrega para Production y Preview:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_BUSINESS_SLUG=barberia-caribe
```

Después de agregar o cambiar variables, realiza un nuevo despliegue. El endpoint `/api/config` expone al navegador solamente la URL y clave pública de Supabase.

## 8. Configurar Supabase Auth URLs

En Supabase abre la configuración de URL de autenticación y agrega:

- URL principal de Vercel.
- URLs de preview necesarias.
- `http://localhost:3000` o el puerto utilizado localmente.

Esto permite que las confirmaciones y redirecciones de autenticación regresen al sistema.

## 9. Prueba de aceptación

Abre la URL pública en incógnito y confirma:

1. El pie indica **Supabase PostgreSQL conectado**.
2. El cliente inicia sesión.
3. Crea una cita futura.
4. Recibe código de confirmación.
5. Recibe correo real.
6. La cita aparece al iniciar sesión como administrador.
7. El empleado solo ve las citas asignadas.
8. La cita no puede duplicar el horario del profesional.
9. Los días cerrados no ofrecen horarios.
10. Los datos permanecen al cambiar de navegador.

## 10. Evidencias para la entrega

Captura:

- Portal público.
- Confirmación con código.
- Correo recibido.
- Dashboard administrativo.
- Agenda compartida.
- Vista limitada del empleado.
- Tablas de Supabase con datos.
- Despliegue activo en Vercel.
