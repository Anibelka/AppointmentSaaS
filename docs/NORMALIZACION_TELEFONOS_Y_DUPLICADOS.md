# Normalización de teléfonos y clientes duplicados

La interfaz aplica automáticamente el formato `XXX-XXX-XXXX`.

Para identificar a un mismo cliente se comparan:

- La cuenta de Supabase, cuando existe.
- El correo electrónico.
- Los diez dígitos del teléfono, ignorando guiones y espacios.

La migración 005 normaliza los registros existentes, combina duplicados con el mismo nombre y teléfono, y mueve sus citas al registro conservado.
