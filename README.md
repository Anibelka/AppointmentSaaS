# AppointmentSaaS · Demo con horarios y portal de clientes

## Credenciales

### Administrador
- `demo@appointmentsaas.com`
- `Demo123!`

### Empleado
- `empleado@appointmentsaas.com`
- `Empleado123!`

### Cliente
- `cliente@appointmentsaas.com`
- `Cliente123!`

## Principales mejoras

- Zona horaria fija `America/Santo_Domingo` para validar la fecha y hora actual.
- Las horas ya transcurridas del día no aparecen como disponibles.
- Horario configurable para cada día de la semana.
- Lunes a viernes, sábado y domingo pueden tener horarios diferentes.
- Los domingos pueden marcarse como cerrados o abrirse desde Configuración.
- Cierres especiales por fecha para feriados, mantenimiento u otras excepciones.
- Validación de duración del servicio dentro del horario de cierre.
- Detección de solapamientos entre citas, no solamente horas idénticas.
- Pantalla de confirmación corregida con código de cita.
- Copiar código, descargar comprobante y archivo `.ics` para calendario.
- Portal de clientes con registro, inicio de sesión, próximas citas e historial.
- Cancelación hasta dos horas antes.
- Integración opcional con EmailJS para enviar un correo real.
- Si EmailJS no está configurado, la cita se confirma en pantalla y puede descargarse.

## Correo real

El demo puede enviar correo mediante EmailJS, pero debes crear una cuenta y completar en el panel:

1. `Service ID`
2. `Template ID`
3. `Public Key`

La plantilla debe aceptar estos parámetros:

- `to_email`
- `to_name`
- `business_name`
- `appointment_code`
- `service_name`
- `professional_name`
- `appointment_date`
- `appointment_time`
- `business_phone`
- `business_address`

Sin estas credenciales no se puede enviar un correo automático real desde un archivo HTML local. El botón **Abrir en mi correo** prepara el mensaje en la aplicación de correo del dispositivo.

## Cómo abrir

Descomprime el ZIP y abre `index.html` en Chrome o Edge.

Para publicarlo, puedes arrastrar la carpeta a Netlify o subirla a GitHub Pages.
