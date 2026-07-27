# Directorio de clientes

- **Con cuenta:** cliente registrado en Supabase Auth; puede iniciar sesión y ver sus citas.
- **CRM:** cliente creado por el negocio, aunque todavía no posea una cuenta.

Al crear una cita, el administrador puede seleccionar un cliente existente o registrar uno nuevo. PostgreSQL evita duplicados por negocio y correo. Si posteriormente ese correo tiene una cuenta, el registro puede vincularse al perfil.
